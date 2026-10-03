type CommitMessageDiffDependencies = {
  collectTrackedUncommittedDiff: (
    repository: any,
    configOverrides: string[],
    signal: AbortSignal | undefined,
  ) => Promise<any>;
  getReviewPatch: (
    cwd: string,
    source: string,
    gitManager: any,
    host: any,
    signal: AbortSignal | undefined,
  ) => Promise<any>;
  getSafeAttributeFilterOverrides: (
    repository: any,
    signal: AbortSignal | undefined,
  ) => Promise<string[]>;
  normalizeCwd: (cwd: string) => string;
};

const unknownDiffError = () => ({ type: `error`, error: { type: `unknown` } });

async function getCommitMessageDiff(
  cwd: string,
  includeUnstaged: boolean,
  gitManager: any,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: CommitMessageDiffDependencies,
) {
  if (!includeUnstaged)
    return (
      await dependencies.getReviewPatch(cwd, `staged`, gitManager, host, signal)
    ).diff;

  const repository = await gitManager.getWorktreeRepository(
    dependencies.normalizeCwd(cwd),
    host,
  );
  if (repository == null) return unknownDiffError();

  let configOverrides: string[];
  try {
    configOverrides = await dependencies.getSafeAttributeFilterOverrides(
      repository,
      signal,
    );
  } catch {
    return unknownDiffError();
  }
  return dependencies.collectTrackedUncommittedDiff(
    repository,
    configOverrides,
    signal,
  );
}

export { getCommitMessageDiff, unknownDiffError };
if (typeof module !== `undefined`)
  module.exports = { getCommitMessageDiff, unknownDiffError };
