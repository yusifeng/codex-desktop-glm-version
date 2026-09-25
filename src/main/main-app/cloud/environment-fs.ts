// 云环境文件系统 RPC 包装（fs/getMetadata / fs/readFile / fs/readDirectory）。
//
// 对应 main-C-Mhak1n.ts 93,413-93,515：
//   - Wze CloudEnvironmentFsService：getRoot（绝对 cwd 直验 + environment/info
//     兜底 + file: URL 转换）、readFile（base64 → utf8）、getMetadata
//     （contentKind 嗅探 + 采样限额）、readDirectory（workspaceRoot 越界防护 +
//     symlink 拒绝 + 隐藏文件/仅目录过滤 + 目录优先排序）
import { posix } from "node:path";
import { fileURLToPath } from "node:url";
import {
  wf as objectSchema,
  xf as looseObjectSchema,
  Of as stringSchema,
  Cf as numberSchema,
  gf as booleanSchema,
  hf as arraySchema,
  Uf as EventEmitterBase,
  Rs as sniffContentKind,
} from "@chunk/shared";

const metadataSchema = objectSchema({
  isDirectory: booleanSchema(),
  isFile: booleanSchema(),
  isSymlink: booleanSchema(),
  createdAtMs: numberSchema(),
  modifiedAtMs: numberSchema(),
});

interface SendRequest {
  (method: string, params: unknown): Promise<unknown>;
}

/** 云环境 fs 服务（原 `Wze`）。 */
class CloudEnvironmentFsService extends (EventEmitterBase as new () => {}) {
  sendRequest: SendRequest;

  constructor(sendRequest: SendRequest) {
    super();
    this.sendRequest = sendRequest;
  }

  /** 工作区根（原 `getRoot`）：绝对路径直验目录，否则问 environment/info。 */
  async getRoot({ environmentId, cwd }: { environmentId: string; cwd?: string | null }): Promise<string | null> {
    requireExecutor(environmentId);
    if (cwd != null && posix.isAbsolute(cwd)) {
      try {
        if (
          ((metadataSchema as unknown as { parse(input: unknown): { isDirectory: boolean } }).parse(
            await this.sendRequest("fs/getMetadata", { environmentId, path: cwd }),
          ).isDirectory)
        )
          return cwd;
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !["No such file or directory (os error 2)", "Not a directory (os error 20)"].includes(error.message)
        )
          throw error;
      }
    }
    const info = (objectSchema({ cwd: (stringSchema() as unknown as { nullish(): unknown }).nullish() }) as unknown as {
      parse(input: unknown): { cwd?: string | null };
    }).parse(await this.sendRequest("environment/info", { environmentId }));
    const resolved = info.cwd;
    return resolved == null
      ? null
      : resolved.startsWith("file:")
        ? (fileURLToPath(resolved, { windows: false }) as string)
        : posix.isAbsolute(resolved)
          ? resolved
          : null;
  }

  async readFile(request: { environmentId: string; path: string }): Promise<{ contents: string }> {
    requireExecutor(request.environmentId);
    return { contents: (await readRemoteFile(this.sendRequest, request)).toString("utf8") };
  }

  /** 元数据（原 `getMetadata`）：文件的 contentKind 嗅探 + 大小采样。 */
  async getMetadata(request: {
    environmentId: string;
    path: string;
    contentSampleByteLimit?: number;
    contentSampleMaxFileBytes?: number;
  }): Promise<{ contentKind?: unknown; createdAtMs: number | null; isFile: boolean; mtimeMs: number; sizeBytes: number | null }> {
    const environmentId = requireExecutor(request.environmentId);
    const metadata = (metadataSchema as unknown as {
      parse(input: unknown): { isFile: boolean; createdAtMs: number; modifiedAtMs: number };
    }).parse(await this.sendRequest("fs/getMetadata", { environmentId, path: request.path }));
    const sample =
      metadata.isFile && request.contentSampleByteLimit != null
        ? await readRemoteFile(this.sendRequest, { environmentId, path: request.path })
        : null;
    return {
      contentKind:
        (sample != null &&
        (request.contentSampleMaxFileBytes == null || sample.byteLength <= request.contentSampleMaxFileBytes)
          ? await (sniffContentKind as (data: Buffer) => Promise<unknown>)(sample.subarray(0, request.contentSampleByteLimit))
          : null) ?? undefined,
      createdAtMs: metadata.createdAtMs > 0 ? metadata.createdAtMs : null,
      isFile: metadata.isFile,
      mtimeMs: metadata.modifiedAtMs,
      sizeBytes: sample?.byteLength ?? null,
    };
  }

  /** 目录读（原 `readDirectory`）：越界防护 + symlink 拒绝 + 过滤排序。 */
  async readDirectory(request: {
    environmentId: string;
    workspaceRoot: string;
    directoryPath?: string;
    includeHidden?: boolean;
    directoriesOnly?: boolean;
  }): Promise<{
    workspaceRoot: string;
    directoryPath: string;
    parentPath: string | null;
    entries: Array<{ name: string; path: string; type: "directory" | "file" }>;
  }> {
    const environmentId = requireExecutor(request.environmentId);
    if (!posix.isAbsolute(request.workspaceRoot))
      throw new Error("workspaceRoot must be an absolute executor path");
    const workspaceRoot = posix.resolve(request.workspaceRoot);
    const directory = posix.resolve(workspaceRoot, request.directoryPath ?? ".");
    const relative = posix.relative(workspaceRoot, directory);
    if (relative === ".." || relative.startsWith("../"))
      throw new Error("directoryPath must stay within workspaceRoot");
    const metadata = (metadataSchema as unknown as {
      parse(input: unknown): { isDirectory: boolean; isSymlink: boolean };
    }).parse(await this.sendRequest("fs/getMetadata", { environmentId, path: directory }));
    if (!metadata.isDirectory || (relative !== "" && metadata.isSymlink))
      throw new Error("directoryPath must point to a directory, not a symlink");
    const listing = (objectSchema({
      entries: arraySchema(objectSchema({ fileName: stringSchema(), isDirectory: booleanSchema(), isFile: booleanSchema() })),
    }) as unknown as { parse(input: unknown): { entries: Array<{ fileName: string; isDirectory: boolean }> } }).parse(
      await this.sendRequest("fs/readDirectory", { environmentId, path: directory }),
    );
    return {
      workspaceRoot,
      directoryPath: relative,
      parentPath: relative === "" ? null : posix.dirname(relative).replace(/^\.$/, ""),
      entries: listing.entries
        .filter((entry) => request.includeHidden || !entry.fileName.startsWith("."))
        .filter((entry) => !request.directoriesOnly || entry.isDirectory)
        .map((entry) => ({
          name: entry.fileName,
          path: posix.join(relative, entry.fileName),
          type: entry.isDirectory ? ("directory" as const) : ("file" as const),
        }))
        .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "directory" ? -1 : 1)),
    };
  }
}

/** fs/readFile 的 base64 解码（原 `rH`）。 */
async function readRemoteFile(sendRequest: SendRequest, request: { environmentId: string; path: string }): Promise<Buffer> {
  const response = (objectSchema({ dataBase64: stringSchema() }) as unknown as {
    parse(input: unknown): { dataBase64: string };
  }).parse(await sendRequest("fs/readFile", request));
  return Buffer.from(response.dataBase64, "base64");
}

/** executor 附着校验（原 `iH`）。 */
function requireExecutor(environmentId: string | null | undefined): string {
  if (environmentId == null || environmentId.length === 0)
    throw new Error("No executor is attached to this cloud task");
  return environmentId;
}

export { CloudEnvironmentFsService };
