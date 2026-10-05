type ApplyPatchDependencies = {
  copyIndexToTemporaryDirectory: (directory: string, context: any, host: any) => Promise<string>;
  createLogger: (tag: string) => any;
  createTemporaryDirectory: (
    host: any,
    prefix: string,
    signal?: AbortSignal,
  ) => Promise<string>;
  formatExecOutput: (params: any) => any;
  getIndexContext: (repository: any, signal?: AbortSignal) => Promise<any>;
  normalizeCwd: (cwd: string) => string;
  normalizePatchPath: (pathApi: any, root: string, base: string, path: string) => string;
  runGit: (root: string, args: string[], host: any, options?: any) => Promise<any>;
};

import { parseApplyPatchResult, parsePatchPaths } from './git-apply-patch-policy';

async function pathExists(path: string, host: any, signal?: AbortSignal) {
  signal?.throwIfAborted();
  try {
    await host.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function stageExistingPatchPaths(
  root: string,
  diff: string,
  host: any,
  {
    env,
    gitConfigOverrides = [],
    signal,
  }: { env?: any; gitConfigOverrides?: string[]; signal?: AbortSignal },
  dependencies: ApplyPatchDependencies,
) {
  const paths = parsePatchPaths(diff);
  if (paths.length === 0) return;
  const existing: string[] = [];
  const pathApi = await host.platformPath();
  await Promise.all(
    paths.map(async (path) => {
      const normalized = dependencies.normalizePatchPath(pathApi, root, root, path);
      if (await pathExists(pathApi.join(root, normalized), host, signal)) existing.push(normalized);
    }),
  );
  if (existing.length === 0) return;
  if (signal?.aborted) throw Error(`Apply patch canceled`);
  await dependencies.runGit(root, [`add`, `--`, ...existing], host, {
    configOverrides: gitConfigOverrides,
    env,
    signal,
  });
}

async function applyPatch(
  params: any,
  gitManager: any,
  host: any,
  {
    gitConfigOverrides = [],
    signal,
  }: { gitConfigOverrides?: string[]; signal?: AbortSignal } = {},
  dependencies: ApplyPatchDependencies,
) {
  const {
    cwd,
    env: originalEnvironment,
    diff,
    atomic,
    revert,
    target = `unstaged`,
    allowBinary,
  } = params;
  const logger = dependencies.createLogger(`applyPatch`);
  const normalizedCwd = dependencies.normalizeCwd(cwd);
  let repository = await gitManager.getWorktreeRepository(normalizedCwd, host);
  if (!repository) {
    gitManager.invalidateStableMetadata();
    repository = await gitManager.getWorktreeRepository(normalizedCwd, host);
  }
  if (!repository)
    return {
      status: `error`,
      appliedPaths: [],
      skippedPaths: [],
      conflictedPaths: [],
      errorCode: `not-git-repo`,
    };
  const root = repository.root;
  if (signal?.aborted)
    return { status: `error`, appliedPaths: [], skippedPaths: [], conflictedPaths: [] };
  const temporaryDirectory = await dependencies.createTemporaryDirectory(
    host,
    `codex-apply-`,
    signal,
  );
  const patchPath = (await host.platformPath()).join(temporaryDirectory, `patch.diff`);
  await host.writeFile(patchPath, diff, { signal });
  try {
    let environment = originalEnvironment;
    if (target === `unstaged` && !atomic) {
      const indexContext = await dependencies.getIndexContext(repository, signal);
      if (!indexContext)
        logger.warning(`[applyPatch] Unable to resolve git index path; applying without temp index`);
      else {
        const temporaryIndex = await dependencies.copyIndexToTemporaryDirectory(
          temporaryDirectory,
          indexContext,
          host,
        );
        environment = { ...originalEnvironment, GIT_INDEX_FILE: temporaryIndex };
        await stageExistingPatchPaths(
          root,
          diff,
          host,
          { env: environment, gitConfigOverrides, signal },
          dependencies,
        );
      }
    }
    const args = [`apply`];
    if (revert) args.push(`-R`);
    if (allowBinary) args.push(`--binary`);
    if (!atomic) args.push(`--3way`);
    if (target === `staged`) args.push(`--cached`);
    else if (target === `staged-and-unstaged`) args.push(`--index`);
    args.push(patchPath);
    const result = await dependencies.runGit(root, args, host, {
      configOverrides: gitConfigOverrides,
      env: environment,
      signal,
      allowedNonZeroExitCodes: [1],
    });
    const parsed = parseApplyPatchResult(result.stdout, result.stderr);
    logger.debug(`ApplyPatch result metadata`, {
      safe: {
        revert,
        target,
        code: result.code,
        stdoutLength: result.stdout.length,
        stderrLength: result.stderr.length,
        appliedCount: parsed.appliedPaths.length,
        skippedCount: parsed.skippedPaths.length,
        conflictedCount: parsed.conflictedPaths.length,
      },
      sensitive: {},
    });
    return {
      status:
        signal?.aborted || result.code == null
          ? `error`
          : result.code === 0
            ? `success`
            : result.code === 1 && !atomic
              ? `partial-success`
              : `error`,
      ...parsed,
      execOutput: dependencies.formatExecOutput({
        command: args.join(` `),
        stdout: result.stdout,
        stderr: result.stderr,
      }),
    };
  } finally {
    await host.remove(temporaryDirectory, { recursive: true, force: true });
  }
}

export { applyPatch, parseApplyPatchResult, parsePatchPaths, pathExists, stageExistingPatchPaths };
if (typeof module !== `undefined`)
  module.exports = {
    applyPatch,
    parseApplyPatchResult,
    parsePatchPaths,
    pathExists,
    stageExistingPatchPaths,
  };
