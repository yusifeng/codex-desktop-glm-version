export type WorkspaceFileRuntimeSupportDependencies = {
  fsPromises: {
    stat(path: string): Promise<{ mode: number }>;
    open(path: string, flags: string, mode: number): Promise<any>;
    rename(from: string, to: string): Promise<void>;
    rm(path: string, options: { force: boolean }): Promise<void>;
  };
  path: any;
  randomUUID(): string;
  createHash(algorithm: string): any;
  classifySample(buffer: Uint8Array): Promise<string>;
  statPath(path: unknown, executionHost: unknown, options: Record<string, any>): Promise<any>;
  isRemoteHostConfig(hostConfig: unknown): boolean;
  convertPathForDesktopHost(path: unknown, useWslPaths: boolean): string;
  getUseWslPaths(hostConfig: unknown): boolean;
  getPrimaryWorkspaceRoot(value: unknown): string | null;
  getSelectedProject(globalState: unknown): { rootPaths?: unknown } | null | undefined;
  getLocalProjects(globalState: unknown): { roots: string[] };
  existsSync(path: string): boolean;
};

function hasErrorCode(error: unknown, code: string) {
  return error instanceof Error && `code` in error && error.code === code;
}

/** Owns workspace-file atomic writes, content projection, ETags, and host path mapping. */
export function createWorkspaceFileRuntimeSupport(
  dependencies: WorkspaceFileRuntimeSupportDependencies,
) {
  const atomicDownloadWrite = async (targetPath: string, load: () => Promise<any> | any) => {
    let existingMode: number | undefined;
    try {
      existingMode = (await dependencies.fsPromises.stat(targetPath)).mode & 0o777;
    } catch (error) {
      if (!hasErrorCode(error, `ENOENT`)) throw error;
    }
    const temporaryPath = dependencies.path.join(
      dependencies.path.dirname(targetPath),
      `${dependencies.path.basename(targetPath).slice(0, 64)}.${dependencies.randomUUID()}.chatgptdownload`,
    );
    const file = await dependencies.fsPromises.open(
      temporaryPath,
      `wx`,
      existingMode == null ? 0o666 : 0o600,
    );
    try {
      await file.writeFile(await load());
      if (existingMode != null) await file.chmod(existingMode);
      await file.close();
      await dependencies.fsPromises.rename(temporaryPath, targetPath);
    } finally {
      await file.close();
      await dependencies.fsPromises.rm(temporaryPath, { force: true });
    }
  };

  const classifyBuffer = async (buffer: Buffer) =>
    (await dependencies.classifySample(buffer.subarray(0, 4_096))) === `text`
      ? { text: buffer.toString(`utf8`) }
      : { blob: buffer.toString(`base64`) };

  const normalizeBase64 = (value: string | Buffer) =>
    typeof value === `string` ? value : value.toString(`base64`);

  const decodeBase64 = (value: string | Buffer) =>
    typeof value === `string` ? Buffer.from(value, `base64`) : value;

  const statIfExists = async (path: unknown, executionHost: unknown) => {
    try {
      return await dependencies.statPath(path, executionHost, { bypassCache: true });
    } catch (error) {
      if (hasErrorCode(error, `ENOENT`)) return null;
      throw error;
    }
  };

  const createEtag = (stat: { mtimeMs: number; ctimeMs: number; size: number } | null) =>
    stat == null
      ? `missing`
      : `stat:${dependencies
          .createHash(`sha256`)
          .update(`${stat.mtimeMs}:${stat.ctimeMs}:${stat.size}`)
          .digest(`base64url`)}`;

  const normalizeWorkspacePath = (
    inputPath: unknown,
    fallbackRoot: string | null,
    pathApi = dependencies.path,
  ) => {
    const normalized = pathApi.normalize(
      pathApi.sep === `\\` ? String(inputPath).replaceAll(`/`, `\\`) : inputPath,
    );
    if (pathApi.isAbsolute(normalized) || fallbackRoot == null) return normalized;
    const segments = normalized.split(pathApi.sep).filter(Boolean);
    if (segments.length === 0) return fallbackRoot;
    const directPath = pathApi.join(fallbackRoot, ...segments);
    if (dependencies.existsSync(directPath)) return directPath;
    const rootNameIndex = segments.indexOf(pathApi.basename(fallbackRoot));
    return rootNameIndex === -1
      ? directPath
      : pathApi.join(fallbackRoot, ...segments.slice(rootNameIndex + 1));
  };

  const resolveLocalWorkspacePath = (
    inputPath: unknown,
    executionHost: { hostConfig: unknown },
    globalState: unknown,
  ) => {
    const desktopPath = dependencies.convertPathForDesktopHost(
      inputPath,
      dependencies.getUseWslPaths(executionHost.hostConfig),
    );
    const selectedProjectRoot = dependencies.getPrimaryWorkspaceRoot(
      dependencies.getSelectedProject(globalState)?.rootPaths,
    );
    const fallbackRoot =
      selectedProjectRoot ?? dependencies.getLocalProjects(globalState).roots[0] ?? null;
    return normalizeWorkspacePath(desktopPath, fallbackRoot);
  };

  const resolveWorkspacePath = async (
    inputPath: unknown,
    executionHost: { hostConfig: unknown; platformPath(): Promise<any> },
    globalState: unknown,
  ) =>
    dependencies.isRemoteHostConfig(executionHost.hostConfig)
      ? normalizeWorkspacePath(inputPath, null, await executionHost.platformPath())
      : resolveLocalWorkspacePath(inputPath, executionHost, globalState);

  return {
    atomicDownloadWrite,
    classifyBuffer,
    createEtag,
    decodeBase64,
    normalizeBase64,
    normalizeWorkspacePath,
    resolveLocalWorkspacePath,
    resolveWorkspacePath,
    statIfExists,
  };
}

if (typeof module !== `undefined`) {
  module.exports = { createWorkspaceFileRuntimeSupport };
}
