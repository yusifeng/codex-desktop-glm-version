const REPOSITORY_OPERATION_MARKERS = [
  `MERGE_HEAD`,
  `CHERRY_PICK_HEAD`,
  `REVERT_HEAD`,
  `REBASE_HEAD`,
  `rebase-merge`,
  `rebase-apply`,
  `sequencer`,
];

type GitReviewBranchStatsDependencies = {
  getDiffMetadata: (params: any) => Promise<any>;
  getGitDir: (repository: any, signal: AbortSignal) => Promise<string | null>;
  getOmittedUntrackedFiles: (
    count: number | undefined,
    limit: number | undefined,
  ) => any;
  getStatusSummary: (...args: any[]) => Promise<any>;
  getUntrackedMetadata: (reviewSnapshot: any, paths: string[]) => Promise<any>;
  inferRenames: (params: any) => Promise<any[]>;
  isMissingPathError: (error: unknown) => boolean;
  mergeReviewMetadata: (left: any, right: any) => any;
  normalizeCwd: (cwd: string) => string;
  prepareReviewComparison: (params: any) => Promise<any>;
  reconcileRenameStats: (
    stats: any[],
    renames: any[],
    deletedPaths: Set<string>,
  ) => any[];
  reconcileUntrackedRenames: (metadata: any, paths: Set<string>) => any;
  resolveReviewPaths: (params: any) => Promise<any>;
  reviewFileKey: (path: string, previousPath: string | null | undefined) => string;
};

async function hasRepositoryOperationInProgress(
  repository: any,
  signal: AbortSignal,
  dependencies: GitReviewBranchStatsDependencies,
) {
  const [gitDir, platformPath] = await Promise.all([
    dependencies.getGitDir(repository, signal),
    repository.host.platformPath(),
  ]);
  const paths: string[] = [];
  if (gitDir != null) {
    paths.push(platformPath.join(gitDir, `index.lock`));
    for (const marker of REPOSITORY_OPERATION_MARKERS)
      paths.push(platformPath.join(gitDir, marker));
  }
  for (const status of await Promise.all(
    paths.map((path) => readRepositoryOperationPathStatus(path, repository.host, dependencies)),
  ))
    if (status === `exists` || status === `unknown`) return true;
  return false;
}

async function readRepositoryOperationPathStatus(
  path: string,
  host: any,
  dependencies: GitReviewBranchStatsDependencies,
) {
  try {
    await host.stat(path, { bypassCache: true });
    return `exists`;
  } catch (error) {
    return dependencies.isMissingPathError(error) ? `missing` : `unknown`;
  }
}

async function getBranchDiffStats(
  cwd: string,
  gitManager: any,
  host: any,
  baseBranch: string | undefined,
  hideWhitespace = false,
  includeUntrackedFiles = true,
  maxUntrackedFiles: number | undefined,
  dependencies: GitReviewBranchStatsDependencies,
) {
  const repository = await gitManager.getWorktreeRepository(
    dependencies.normalizeCwd(cwd),
    host,
  );
  if (repository == null) return null;
  const reviewSnapshot = repository.reviewSnapshot;
  if (
    await reviewSnapshot.read(() =>
      hasRepositoryOperationInProgress(
        repository,
        reviewSnapshot.signal,
        dependencies,
      ),
    )
  )
    return null;
  const comparison = await dependencies.prepareReviewComparison({
    baseBranch,
    includeUntrackedFiles,
    reviewSnapshot,
    source: `branch`,
  });
  if (comparison.type !== `success`) return null;
  const untrackedFilesOmitted = dependencies.getOmittedUntrackedFiles(
    comparison.untrackedPaths.paths.length,
    maxUntrackedFiles,
  );
  const [status, untrackedMetadata] = await Promise.all([
    dependencies.getStatusSummary(repository, false, reviewSnapshot),
    dependencies.getUntrackedMetadata(
      reviewSnapshot,
      untrackedFilesOmitted == null ? comparison.untrackedPaths.paths : [],
    ),
  ]);
  if (status.type !== `success` || untrackedMetadata == null) return null;
  const reviewPaths = await dependencies.resolveReviewPaths({
    diffArgs: comparison.diffArgs,
    reviewSnapshot,
    source: `branch`,
    statusPaths: status.trackedPaths,
  });
  if (reviewPaths == null) return null;
  const diffMetadata = await dependencies.getDiffMetadata({
    diffArgs: comparison.diffArgs,
    hideWhitespace,
    paths: reviewPaths.paths,
    reviewSnapshot,
  });
  if (diffMetadata == null) return null;
  const metadata = dependencies.reconcileUntrackedRenames(
    dependencies.mergeReviewMetadata(diffMetadata, untrackedMetadata),
    comparison.untrackedPathSet,
  );
  let { stats } = metadata;
  stats = await reconcileBranchRenameStats(
    {
      diffArgs: comparison.diffArgs,
      hideWhitespace,
      metadata,
      renames: status.stagedRenames,
      reviewSnapshot,
    },
    dependencies,
  );
  if (stats.length === 0 && untrackedFilesOmitted == null) return null;
  let additions = 0;
  let deletions = 0;
  for (const stat of stats) {
    additions += stat.additions ?? 0;
    deletions += stat.deletions ?? 0;
  }
  return reviewSnapshot.read(async () => ({
    additions,
    deletions,
    fileCount: stats.length,
    untrackedFilesOmitted,
  }));
}

async function reconcileBranchRenameStats(
  { diffArgs, hideWhitespace, renames, metadata, reviewSnapshot }: any,
  dependencies: GitReviewBranchStatsDependencies,
) {
  const inferredRenames = await dependencies.inferRenames({
    changedPaths: new Set(
      metadata.stats
        .filter((stat: any) => stat.previousPath == null)
        .map((stat: any) => stat.path),
    ),
    diffArgs,
    existingRenameKeys: new Set(
      metadata.stats
        .filter((stat: any) => stat.previousPath != null)
        .map((stat: any) =>
          dependencies.reviewFileKey(stat.path, stat.previousPath),
        ),
    ),
    hideWhitespace,
    renames,
    reviewSnapshot,
  });
  return inferredRenames.length === 0
    ? metadata.stats
    : dependencies.reconcileRenameStats(
        metadata.stats,
        inferredRenames,
        new Set(
          metadata.rawEntries
            .filter((entry: any) => entry.status === `D`)
            .map((entry: any) => entry.path),
        ),
      );
}

export {
  REPOSITORY_OPERATION_MARKERS,
  getBranchDiffStats,
  hasRepositoryOperationInProgress,
  readRepositoryOperationPathStatus,
  reconcileBranchRenameStats,
};

if (typeof module !== `undefined`)
  module.exports = {
    REPOSITORY_OPERATION_MARKERS,
    getBranchDiffStats,
    hasRepositoryOperationInProgress,
    readRepositoryOperationPathStatus,
    reconcileBranchRenameStats,
  };
