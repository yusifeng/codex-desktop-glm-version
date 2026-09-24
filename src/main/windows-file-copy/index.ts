// Windows 专用：从加密目录复制资源时的降级路径。
//
// Windows 上如果源目录启用了加密（EPERM，errno 6000），目标盘不支持加密属性
// 会导致 copy 失败。此时降级为逐文件流式复制（在未加密的目标上重建内容），
// 并带 60 秒超时保护。
import { join } from "node:path";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { createTaggedLogger } from "@chunk/logger";

const logger = createTaggedLogger("windows-file-copy");

const FALLBACK_TIMEOUT_MS = 60_000;
// 源目录加密导致的复制失败 errno（EPERM 的 Windows 映射）。
const ENCRYPTED_SOURCE_ERRNO = 6000;

function isEncryptedSourceError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && (error as NodeJS.ErrnoException).errno === ENCRYPTED_SOURCE_ERRNO;
}

async function retryCopyDirectory(source: string, destination: string, signal: AbortSignal) {
  signal.throwIfAborted();
  await mkdir(destination, { recursive: true });
  signal.throwIfAborted();
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    signal.throwIfAborted();
    if (entry.isSymbolicLink())
      throw new Error("Encrypted resource copy fallback does not support reparse points.");
    const entrySource = join(source, entry.name);
    const entryDestination = join(destination, entry.name);
    if (entry.isDirectory()) {
      await retryCopyDirectory(entrySource, entryDestination, signal);
    } else {
      await retryCopyFile(entrySource, entryDestination, signal);
    }
  }
}

async function retryCopyFile(source: string, destination: string, signal: AbortSignal) {
  signal.throwIfAborted();
  await pipeline(createReadStream(source), createWriteStream(destination), { signal });
}

async function copyWithFallback({
  copy,
  copyKind,
  destination,
  retry,
  source,
}: {
  copy: () => Promise<void>;
  copyKind: "directory" | "file";
  destination: string;
  retry: (source: string, destination: string, signal: AbortSignal) => Promise<void>;
  source: string;
}) {
  try {
    await copy();
  } catch (error) {
    if (process.platform !== "win32" || !isEncryptedSourceError(error)) throw error;
    logger.info("windows_encrypted_copy_fallback_started", {
      safe: { copyKind, errorCode: ENCRYPTED_SOURCE_ERRNO },
      sensitive: {},
    });
    const abortController = new AbortController();
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        const error = new Error("Windows encrypted resource copy timed out");
        abortController.abort(error);
        reject(error);
      }, FALLBACK_TIMEOUT_MS);
    });
    try {
      await Promise.race([retry(source, destination, abortController.signal), timeout]);
    } catch (error) {
      logger.warning("windows_encrypted_copy_fallback_failed", {
        safe: { copyKind, errorCode: ENCRYPTED_SOURCE_ERRNO },
        sensitive: { error },
      });
      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
    logger.info("windows_encrypted_copy_fallback_succeeded", {
      safe: { copyKind, errorCode: ENCRYPTED_SOURCE_ERRNO },
      sensitive: {},
    });
  }
}

export async function copyDirectoryAllowDecryptedDestinationOnEncryptionFailure(input: {
  copy: () => Promise<void>;
  source: string;
  destination: string;
}) {
  return copyWithFallback({ ...input, copyKind: "directory", retry: retryCopyDirectory });
}

export async function copyFileAllowDecryptedDestinationOnEncryptionFailure(input: {
  copy: () => Promise<void>;
  source: string;
  destination: string;
}) {
  return copyWithFallback({ ...input, copyKind: "file", retry: retryCopyFile });
}
