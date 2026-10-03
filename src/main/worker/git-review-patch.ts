type GitReviewPatchDependencies = {
  collectNonEmptySections: (
    ...groups: Array<Array<string | null | undefined>>
  ) => string[];
  collectUntrackedDiffSections: (
    readDiff: (path: string, signal: AbortSignal) => Promise<any>,
    untrackedPaths: any,
    signal: AbortSignal,
  ) => Promise<any>;
  getQueryMeta: () => any;
  getUntrackedWorkingTreeDiff: (
    reviewSnapshot: any,
    path: string,
  ) => Promise<any>;
  parseGitError: (result: any) => any;
  resolveReviewComparisonForRepository: (params: any) => Promise<any>;
  utf8ByteLength: (value: string) => number;
};

function unknownReviewPatchDiff() {
  return { type: `error`, error: { type: `unknown` } };
}

function getCachedTrackedReviewDiff(
  diffArgs: string[],
  reviewSnapshot: any,
  dependencies: GitReviewPatchDependencies,
) {
  return reviewSnapshot.worktreeRepo.queryClient.fetchQuery({
    queryKey: reviewSnapshot.queryKey(`review-patch-diff`, diffArgs),
    gcTime: 250,
    meta: dependencies.getQueryMeta(),
    queryFn: () =>
      reviewSnapshot.gitDiff(diffArgs, {
        allowedNonZeroExitCodes: [0, 1],
        trim: false,
      }),
    staleTime: 250,
  });
}

async function getReviewPatch(
  cwd: string,
  source: string,
  gitManager: any,
  host: any,
  _signal: AbortSignal | undefined,
  baseBranch: string | undefined,
  commitSha: string | undefined,
  maxUntrackedFiles: number | undefined,
  dependencies: GitReviewPatchDependencies,
) {
  const comparison =
    await dependencies.resolveReviewComparisonForRepository({
      host,
      baseBranch,
      commitSha,
      cwd,
      gitManager,
      includeUntrackedFiles: true,
      maxUntrackedFiles,
      source,
    });
  if (comparison.type !== `success`)
    return { source, diff: unknownReviewPatchDiff() };

  const [trackedDiff, untrackedDiff] = await Promise.all([
    getCachedTrackedReviewDiff(
      comparison.diffArgs,
      comparison.reviewSnapshot,
      dependencies,
    ),
    dependencies.collectUntrackedDiffSections(
      (path) =>
        dependencies.getUntrackedWorkingTreeDiff(
          comparison.reviewSnapshot,
          path,
        ),
      comparison.untrackedPaths,
      comparison.reviewSnapshot.signal,
    ),
  ]);
  if (trackedDiff.outputLimitExceeded || !trackedDiff.success)
    return {
      source,
      diff: { type: `error`, error: dependencies.parseGitError(trackedDiff) },
    };
  if (!untrackedDiff.success)
    return {
      source,
      diff: { type: `error`, error: untrackedDiff.error },
    };

  const unifiedDiff = dependencies
    .collectNonEmptySections([trackedDiff.stdout], untrackedDiff.sections)
    .join(`\n`);
  return comparison.reviewSnapshot.read(async () => ({
    source,
    diff: {
      type: `success`,
      unifiedDiff,
      unifiedDiffBytes: dependencies.utf8ByteLength(unifiedDiff),
    },
  }));
}

export {
  getCachedTrackedReviewDiff,
  getReviewPatch,
  unknownReviewPatchDiff,
};

if (typeof module !== `undefined`)
  module.exports = {
    getCachedTrackedReviewDiff,
    getReviewPatch,
    unknownReviewPatchDiff,
  };
