import { createHash, randomUUID } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  promises as fs,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { z } from "zod";
import {
  getLanguageServerRuntimeSpec,
  type LanguageServerRuntimeSpec,
  type PlatformResource,
} from "./runtime-resources";

const DEFAULT_DOWNLOAD_TIMEOUT_MS = 300_000;
const runtimeManifestSchema = z.object({
  expectedPaths: z.array(z.string()),
  version: z.string(),
});

type RuntimeInstallerDependencies = {
  extractTar(options: { cwd: string; file: string; strict: true }): Promise<unknown>;
  extractZip(archivePath: string, options: { dir: string }): Promise<unknown>;
  logger(): { warning(message: string, fields: unknown): void };
};

type RuntimeInstallerOptions = {
  cacheRoot?: string;
  fetchImpl(url: string, options: { signal: AbortSignal }): Promise<any>;
  getSpec?: typeof getLanguageServerRuntimeSpec;
};

async function pathExists(targetPath: string): Promise<boolean> {
  return fs.stat(targetPath).then(
    () => true,
    () => false,
  );
}

async function expectedPathsExist(root: string, expectedPaths: string[]): Promise<boolean> {
  const entries = await Promise.all(
    expectedPaths.map((entry) => fs.stat(path.join(root, entry)).catch(() => null)),
  );
  return entries.every((entry) => entry != null);
}

async function readRuntimeManifest(root: string) {
  try {
    return runtimeManifestSchema.parse(
      JSON.parse(await fs.readFile(path.join(root, "runtime.json"), "utf8")),
    );
  } catch {
    return null;
  }
}

async function isCachedRuntimeCurrent(
  root: string,
  spec: LanguageServerRuntimeSpec,
): Promise<boolean> {
  return (
    (await readRuntimeManifest(root))?.version === spec.version &&
    (await expectedPathsExist(root, spec.expectedPaths))
  );
}

async function downloadPinnedResource(
  fetchImpl: RuntimeInstallerOptions["fetchImpl"],
  resource: PlatformResource,
  destination: string,
): Promise<void> {
  const signal = AbortSignal.timeout(resource.downloadTimeoutMs ?? DEFAULT_DOWNLOAD_TIMEOUT_MS);
  const response = await fetchImpl(resource.url, { signal });
  if (!response.ok || response.body == null)
    throw Error(`Failed to download language-server runtime (${response.status}).`);

  const digest = createHash("sha256");
  let downloadedBytes = 0;
  const verifier = new Transform({
    transform(chunk, _encoding, callback) {
      downloadedBytes += chunk.length;
      if (downloadedBytes > resource.sizeBytes) {
        callback(Error(`Language-server runtime exceeded its pinned size.`));
        return;
      }
      digest.update(chunk);
      callback(null, chunk);
    },
  });
  await pipeline(
    Readable.from(response.body),
    verifier,
    createWriteStream(destination),
    { signal },
  );
  if (downloadedBytes !== resource.sizeBytes || digest.digest("hex") !== resource.sha256)
    throw Error(`Language-server runtime digest verification failed.`);
}

export function createLanguageServerRuntimeInstallerClass(
  dependencies: RuntimeInstallerDependencies,
) {
  async function installResource({
    downloadsRoot,
    fetchImpl,
    index,
    payloadRoot,
    resource,
  }: {
    downloadsRoot: string;
    fetchImpl: RuntimeInstallerOptions["fetchImpl"];
    index: number;
    payloadRoot: string;
    resource: PlatformResource;
  }): Promise<void> {
    const archivePath = path.join(downloadsRoot, `${index}.archive`);
    await downloadPinnedResource(fetchImpl, resource, archivePath);
    const targetPath = path.join(payloadRoot, resource.targetPath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    if (resource.format === "gzip") {
      await pipeline(
        createReadStream(archivePath),
        createGunzip(),
        createWriteStream(targetPath, { mode: 0o755 }),
      );
    } else {
      const extractedRoot = path.join(downloadsRoot, `${index}-extracted`);
      await fs.mkdir(extractedRoot, { recursive: true });
      if (resource.format === "zip")
        await dependencies.extractZip(archivePath, { dir: extractedRoot });
      else await dependencies.extractTar({ cwd: extractedRoot, file: archivePath, strict: true });
      await fs.cp(path.join(extractedRoot, resource.sourcePath ?? "."), targetPath, {
        recursive: true,
      });
    }
    if (resource.executable === true && process.platform !== "win32")
      await fs.chmod(targetPath, 0o755);
  }

  return class LanguageServerRuntimeInstaller {
    private readonly options: RuntimeInstallerOptions;
    private readonly expiredRuntimes = new Set<string>();
    private readonly installs = new Map<string, Promise<string | null>>();
    private readonly cacheRoot: string;
    private readonly getSpec: typeof getLanguageServerRuntimeSpec;

    constructor(options: RuntimeInstallerOptions) {
      this.options = options;
      this.cacheRoot =
        options.cacheRoot ?? path.join(homedir(), ".cache", "codex-runtimes", "language-servers");
      this.getSpec = options.getSpec ?? getLanguageServerRuntimeSpec;
    }

    getRuntimeRoot(id: string): Promise<string | null> {
      if (this.expiredRuntimes.has(id)) return Promise.resolve(null);
      const pending = this.installs.get(id);
      if (pending != null) return pending;
      const install = this.install(id)
        .catch(async (error) => {
          dependencies.logger().warning(`language_server_runtime_install_failed`, {
            safe: { id },
            sensitive: { error },
          });
          return this.getCachedRuntimeRoot(id);
        })
        .finally(() => this.installs.delete(id));
      this.installs.set(id, install);
      return install;
    }

    markRuntimeExpired(id: string): void {
      this.expiredRuntimes.add(id);
    }

    async install(id: string): Promise<string | null> {
      const spec = this.getSpec(id);
      if (spec == null) return null;
      const runtimeRoot = path.join(this.cacheRoot, id);
      if (await isCachedRuntimeCurrent(runtimeRoot, spec)) return runtimeRoot;
      await fs.mkdir(this.cacheRoot, { recursive: true });
      const stagingRoot = path.join(this.cacheRoot, `.${id}-install-${randomUUID()}`);
      const payloadRoot = path.join(stagingRoot, "payload");
      const downloadsRoot = path.join(stagingRoot, "downloads");
      await Promise.all([
        fs.mkdir(payloadRoot, { recursive: true }),
        fs.mkdir(downloadsRoot, { recursive: true }),
      ]);
      try {
        await Promise.all(
          spec.resources.map((resource, index) =>
            installResource({
              downloadsRoot,
              fetchImpl: this.options.fetchImpl,
              index,
              payloadRoot,
              resource,
            }),
          ),
        );
        await fs.writeFile(
          path.join(payloadRoot, "runtime.json"),
          `${JSON.stringify({ expectedPaths: spec.expectedPaths, version: spec.version })}\n`,
        );
        if (!(await expectedPathsExist(payloadRoot, spec.expectedPaths)))
          throw Error(`Downloaded ${id} runtime is incomplete.`);

        const previousRoot = `${runtimeRoot}.previous-${randomUUID()}`;
        if (await pathExists(runtimeRoot)) await fs.rename(runtimeRoot, previousRoot);
        try {
          await fs.rename(payloadRoot, runtimeRoot);
        } catch (error) {
          if (await pathExists(previousRoot)) await fs.rename(previousRoot, runtimeRoot);
          throw error;
        }
        await fs.rm(previousRoot, { force: true, recursive: true });
        return runtimeRoot;
      } finally {
        await fs.rm(stagingRoot, { force: true, recursive: true });
      }
    }

    async getCachedRuntimeRoot(id: string): Promise<string | null> {
      const runtimeRoot = path.join(this.cacheRoot, id);
      const manifest = await readRuntimeManifest(runtimeRoot);
      return manifest != null && (await expectedPathsExist(runtimeRoot, manifest.expectedPaths))
        ? runtimeRoot
        : null;
    }
  };
}

export {
  DEFAULT_DOWNLOAD_TIMEOUT_MS,
  downloadPinnedResource,
  expectedPathsExist,
  isCachedRuntimeCurrent,
  pathExists,
  readRuntimeManifest,
};

if (typeof module !== "undefined")
  module.exports = {
    DEFAULT_DOWNLOAD_TIMEOUT_MS,
    createLanguageServerRuntimeInstallerClass,
    downloadPinnedResource,
    expectedPathsExist,
    isCachedRuntimeCurrent,
    pathExists,
    readRuntimeManifest,
  };
