import {
  EMPTY_GIT_TREE_SHA,
  getCommitParentSha,
  normalizeOptionalHeadSha,
  readCurrentHeadSnapshot,
  resolveReviewComparisonArgs,
} from './git-review-comparison-policy';

type ReviewComparisonDependencies = {
  findMergeBase: (repository: any, branch: string) => Promise<any>;
  getDefaultBranch: (repository: any) => Promise<any>;
  getHeadCommit: (
    repository: any,
    ref: string,
    signal?: AbortSignal,
  ) => Promise<any>;
  getQueryMeta: () => any;
  getUntrackedPaths: (
    repository: any,
    paths: string[] | undefined,
    reviewSnapshot: any,
  ) => Promise<any>;
  normalizeCommitSha: (sha: string) => any;
  normalizeCwd: (cwd: string) => any;
  queryKey: (root: string, host: any, type: string, ...parts: string[]) => any;
  runGit: (
    root: string,
    args: string[],
    host: any,
    options?: Record<string, unknown>,
  ) => Promise<any>;
  validateObjectId: (sha: string) => boolean;
};

async function hasGitMergeConflicts(
  repository: any,
  signal: AbortSignal,
  dependencies: ReviewComparisonDependencies,
) {
  return (
    await getGitMergeConflictPaths(repository, signal, dependencies)
  ).length > 0;
}

function getGitMergeConflictPaths(
  repository: any,
  signal: AbortSignal,
  dependencies: ReviewComparisonDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(
      repository.root,
      repository.host,
      `merge-conflict-status`,
    ),
    gcTime: 250,
    meta: dependencies.getQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`ls-files`, `-u`, `-z`],
        repository.host,
        { signal },
      );
      if (!result.success) return [];
      const paths = new Set<string>();
      for (const entry of result.stdout.split(`\0`)) {
        const separator = entry.indexOf(`\t`);
        if (separator !== -1) paths.add(entry.slice(separator + 1));
      }
      return [...paths];
    },
    staleTime: 250,
  });
}

async function getCurrentHeadSnapshot(
  repository: any,
  signal: AbortSignal,
  dependencies: ReviewComparisonDependencies,
) {
  return normalizeOptionalHeadSha(
    await dependencies.getHeadCommit(repository, `HEAD`, signal),
    dependencies,
  );
}


async function resolveReviewComparisonForRepository(
  {
    host,
    baseBranch,
    commitSha,
    cwd,
    gitManager,
    includeUntrackedFiles,
    maxUntrackedFiles,
    paths,
    source,
  }: any,
  dependencies: ReviewComparisonDependencies,
) {
  const repository = await gitManager.getWorktreeRepository(
    dependencies.normalizeCwd(cwd),
    host,
  );
  return repository == null
    ? { type: `error`, failureReason: `repository_unavailable` }
    : prepareReviewComparison(
        {
          baseBranch,
          commitSha,
          includeUntrackedFiles,
          maxUntrackedFiles,
          paths,
          reviewSnapshot: repository.reviewSnapshot,
          source,
        },
        dependencies,
      );
}

async function prepareReviewComparison(
  {
    baseBranch,
    commitSha,
    includeUnmergedPaths = true,
    includeUntrackedFiles,
    maxUntrackedFiles,
    paths,
    reviewSnapshot,
    source,
  }: any,
  dependencies: ReviewComparisonDependencies,
) {
  const { worktreeRepo } = reviewSnapshot;
  const scansWorkingTree =
    source === `branch` || source === `uncommitted` || source === `unstaged`;
  const [comparison, untrackedPaths, unmergedPaths] = await Promise.all([
    resolveReviewComparisonArgs(
      {
        baseBranch,
        commitSha,
        signal: reviewSnapshot.signal,
        source,
        worktreeRepo,
      },
      dependencies,
    ),
    scansWorkingTree && includeUntrackedFiles
      ? dependencies.getUntrackedPaths(worktreeRepo, paths, reviewSnapshot)
      : Promise.resolve(emptyUntrackedPaths(worktreeRepo.root)),
    (source === `uncommitted` || source === `unstaged`) &&
    includeUnmergedPaths
      ? getGitMergeConflictPaths(
          worktreeRepo,
          reviewSnapshot.signal,
          dependencies,
        )
      : Promise.resolve(null),
  ]);
  if (comparison.type !== `success`) return comparison;
  if (!untrackedPaths.success)
    return { type: `error`, failureReason: `untracked_paths` };
  const limitedUntrackedPaths =
    maxUntrackedFiles != null && untrackedPaths.paths.length > maxUntrackedFiles
      ? { ...untrackedPaths, paths: [] }
      : untrackedPaths;
  return {
    type: `success`,
    diffArgs: comparison.args,
    gitRoot: worktreeRepo.root,
    reviewSnapshot,
    unmergedPaths:
      unmergedPaths == null
        ? { type: `not-scanned` }
        : {
            type: `scanned`,
            pathSet: new Set(
              paths == null
                ? unmergedPaths
                : unmergedPaths.filter((path: string) => paths.includes(path)),
            ),
          },
    untrackedPaths: limitedUntrackedPaths,
    untrackedPathSet: new Set(limitedUntrackedPaths.paths),
  };
}

function emptyUntrackedPaths(root: string) {
  return { success: true, gitRoot: root, paths: [] };
}

export {
  EMPTY_GIT_TREE_SHA,
  emptyUntrackedPaths,
  getCommitParentSha,
  getCurrentHeadSnapshot,
  getGitMergeConflictPaths,
  hasGitMergeConflicts,
  normalizeOptionalHeadSha,
  prepareReviewComparison,
  readCurrentHeadSnapshot,
  resolveReviewComparisonArgs,
  resolveReviewComparisonForRepository,
};
if (typeof module !== `undefined`)
  module.exports = {
    EMPTY_GIT_TREE_SHA,
    emptyUntrackedPaths,
    getCommitParentSha,
    getCurrentHeadSnapshot,
    getGitMergeConflictPaths,
    hasGitMergeConflicts,
    normalizeOptionalHeadSha,
    prepareReviewComparison,
    readCurrentHeadSnapshot,
    resolveReviewComparisonArgs,
    resolveReviewComparisonForRepository,
  };
