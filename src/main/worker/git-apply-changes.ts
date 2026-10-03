type ApplyChangesDependencies = {
  applyPatch: (
    params: any,
    gitManager: any,
    host: any,
    options: { signal: AbortSignal },
  ) => Promise<any>;
  createLogger: (tag: string) => any;
  getTemporaryIndexContext: (
    gitManager: any,
    root: string,
    host: any,
  ) => Promise<any>;
  normalizeCommitSha: (sha: string) => any;
  parsePatchPaths: (diff: string) => string[];
  runDiff: (
    root: string,
    refs: string[],
    host: any,
    options: Record<string, unknown>,
  ) => Promise<any>;
  runGit: (
    root: string,
    args: string[],
    host: any,
    options?: Record<string, unknown>,
  ) => Promise<any>;
  serializeExecResult: (result: any) => any;
  withTemporaryIndex: (
    context: any,
    callback: (environment: Record<string, string>) => Promise<any>,
    host: any,
  ) => Promise<any>;
};

async function applyGitChangesBetweenTrees(
  {
    sourceHeadRef,
    sourceTreeRef,
    destinationRoot,
    destinationHeadRef,
    gitManager,
    host,
    signal,
  }: any,
  dependencies: ApplyChangesDependencies,
) {
  const logger = dependencies.createLogger(`applyChanges`);
  const mergeBase = await resolveApplyChangesMergeBase(
    destinationRoot,
    sourceHeadRef,
    destinationHeadRef,
    host,
    signal,
    dependencies,
  );
  if (mergeBase == null) return { status: `command-error` };

  const diffResult = await dependencies.runDiff(
    destinationRoot,
    [mergeBase, sourceTreeRef],
    host,
    {
      binary: true,
      trim: false,
      allowedNonZeroExitCodes: [0, 1],
      signal,
    },
  );
  if (diffResult.outputLimitExceeded || !diffResult.success)
    return {
      status: `command-error`,
      execOutput: dependencies.serializeExecResult(diffResult),
    };
  if (!diffResult.stdout) return { status: `success` };

  const result = await stageAndApplyGitChanges({
    root: destinationRoot,
    diff: diffResult.stdout,
    gitManager,
    host,
    signal,
    logger,
  }, dependencies);
  if (result.status === `error`)
    return {
      status: `command-error`,
      execOutput: result.execOutput,
    };
  if (result.status === `partial-success`)
    return {
      status: `partial-success`,
      appliedPaths: result.appliedPaths,
      skippedPaths: result.skippedPaths,
      conflictedPaths: result.conflictedPaths,
    };
  return { status: `success` };
}

async function resolveApplyChangesMergeBase(
  root: string,
  sourceHeadRef: string,
  destinationHeadRef: string,
  host: any,
  signal: AbortSignal,
  dependencies: ApplyChangesDependencies,
) {
  const result = await dependencies.runGit(
    root,
    [`merge-base`, sourceHeadRef, destinationHeadRef],
    host,
    { allowedNonZeroExitCodes: [1], signal },
  );
  if (!result.success || !result.stdout) return null;
  const sha = result.stdout.trim();
  return sha ? dependencies.normalizeCommitSha(sha) : null;
}

async function stageAndApplyGitChanges(
  { root, diff, gitManager, host, signal, logger }: any,
  dependencies: ApplyChangesDependencies,
) {
  const context = await dependencies.getTemporaryIndexContext(
    gitManager,
    root,
    host,
  );
  if (context)
    return dependencies.withTemporaryIndex(
      context,
      (environment) =>
        stageTargetAndApplyGitChanges(
          root,
          diff,
          gitManager,
          host,
          signal,
          logger,
          environment,
          dependencies,
        ),
      host,
    );
  logger?.warning(`Unable to resolve git index path; applying without temp index`);
  return stageTargetAndApplyGitChanges(
    root,
    diff,
    gitManager,
    host,
    signal,
    logger,
    undefined,
    dependencies,
  );
}

async function stageTargetAndApplyGitChanges(
  root: string,
  diff: string,
  gitManager: any,
  host: any,
  signal: AbortSignal,
  logger: any,
  environment: Record<string, string> | undefined,
  dependencies: ApplyChangesDependencies,
) {
  const staged = await stageExistingPatchPaths(
    root,
    diff,
    host,
    signal,
    environment,
    dependencies,
  );
  if (!staged.success) logger?.error(`Failed to stage target worktree changes`);
  return dependencies.applyPatch(
    {
      cwd: root,
      diff,
      allowBinary: true,
      revert: false,
      env: environment,
    },
    gitManager,
    host,
    { signal },
  );
}

async function stageExistingPatchPaths(
  root: string,
  diff: string,
  host: any,
  signal: AbortSignal,
  environment: Record<string, string> | undefined,
  dependencies: ApplyChangesDependencies,
) {
  const patchPaths = dependencies.parsePatchPaths(diff);
  if (patchPaths.length === 0)
    return { success: true, command: `git add`, stdout: ``, stderr: `` };
  const existingPaths = await filterExistingGitPaths(root, patchPaths, host);
  if (existingPaths.length === 0)
    return { success: true, command: `git add`, stdout: ``, stderr: `` };
  return dependencies.runGit(
    root,
    [`add`, `--`, ...existingPaths],
    host,
    { env: environment, signal },
  );
}

async function filterExistingGitPaths(
  root: string,
  paths: string[],
  host: any,
) {
  const pathApi = await host.platformPath();
  const existingPaths: string[] = [];
  await Promise.all(
    paths.map(async (path: string) => {
      try {
        await host.stat(pathApi.join(root, path));
        existingPaths.push(path);
      } catch {
        return;
      }
    }),
  );
  return existingPaths;
}

export {
  applyGitChangesBetweenTrees,
  filterExistingGitPaths,
  resolveApplyChangesMergeBase,
  stageAndApplyGitChanges,
  stageExistingPatchPaths,
  stageTargetAndApplyGitChanges,
};
if (typeof module !== `undefined`)
  module.exports = {
    applyGitChangesBetweenTrees,
    filterExistingGitPaths,
    resolveApplyChangesMergeBase,
    stageAndApplyGitChanges,
    stageExistingPatchPaths,
    stageTargetAndApplyGitChanges,
  };
