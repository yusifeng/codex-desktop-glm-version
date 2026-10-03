const MAX_REVIEW_METADATA_PATHS = 512;

type GitReviewMetadataDiffDependencies = {
  countDiffLines: (diff: string) => any;
  getBlobDiff: (
    reviewSnapshot: any,
    oldObject: string,
    newObject: string,
    options: any,
  ) => Promise<any>;
  getQueryMeta: () => any;
  gitStatusToReviewChangeKind: (status: string) => string;
  parseReviewMetadataDiff: (output: string) => any;
  reconcileRenameStats: (
    stats: any[],
    renames: any[],
    deletedPaths: Set<string>,
  ) => any[];
  reviewFileKey: (path: string, previousPath: string | null | undefined) => string;
  staleTime: number;
};

async function reconcileStagedReviewRenames(
  { diffArgs, hideWhitespace, metadata, renames, reviewSnapshot }: any,
  dependencies: GitReviewMetadataDiffDependencies,
) {
  const inferredRenames = await inferReviewRenames(
    {
      changedPaths: new Set(
        metadata.files
          .filter((file: any) => file.previousPath == null)
          .map((file: any) => file.path),
      ),
      diffArgs,
      existingRenameKeys: new Set(
        metadata.files
          .filter((file: any) => file.previousPath != null)
          .map((file: any) =>
            dependencies.reviewFileKey(file.path, file.previousPath),
          ),
      ),
      hideWhitespace,
      renames,
      reviewSnapshot,
    },
    dependencies,
  );
  if (inferredRenames.length === 0) return metadata;
  const renamesByPath = new Map<string, any>(
    inferredRenames.map((rename: any) => [rename.path, rename]),
  );
  const previousPaths = new Set(
    inferredRenames.map((rename: any) => rename.previousPath),
  );
  const entriesByPath = new Map<string, any>(
    metadata.rawEntries
      .filter((entry: any) => entry.previousPath == null)
      .map((entry: any) => [entry.path, entry]),
  );
  return {
    files: metadata.files
      .filter(
        (file: any) =>
          file.previousPath != null ||
          !previousPaths.has(file.path) ||
          file.changeKind !== `deleted`,
      )
      .map((file: any) => {
        const rename =
          file.previousPath == null ? renamesByPath.get(file.path) : null;
        return rename == null
          ? file
          : {
              ...file,
              changeKind: `renamed`,
              previousPath: rename.previousPath,
            };
      }),
    rawEntries: metadata.rawEntries
      .filter(
        (entry: any) =>
          entry.previousPath != null ||
          !previousPaths.has(entry.path) ||
          entry.status !== `D`,
      )
      .map((entry: any) => {
        const rename =
          entry.previousPath == null ? renamesByPath.get(entry.path) : null;
        const previousEntry =
          rename == null ? null : entriesByPath.get(rename.previousPath);
        return rename == null || previousEntry == null
          ? entry
          : {
              ...entry,
              oldMode: previousEntry.oldMode,
              oldOid: previousEntry.oldOid,
              previousPath: rename.previousPath,
              status: `R`,
            };
      }),
    stats: dependencies.reconcileRenameStats(
      metadata.stats,
      inferredRenames,
      new Set(
        metadata.rawEntries
          .filter((entry: any) => entry.status === `D`)
          .map((entry: any) => entry.path),
      ),
    ),
  };
}

async function inferReviewRenames(
  {
    changedPaths,
    diffArgs,
    existingRenameKeys,
    hideWhitespace,
    renames,
    reviewSnapshot,
  }: any,
  dependencies: GitReviewMetadataDiffDependencies,
) {
  const [base] = diffArgs;
  if (base == null) return [];
  return (
    await Promise.all(
      renames.map(async (rename: any) => {
        if (
          existingRenameKeys.has(
            dependencies.reviewFileKey(rename.path, rename.previousPath),
          ) ||
          !changedPaths.has(rename.previousPath) ||
          !changedPaths.has(rename.path)
        )
          return null;
        const result = await dependencies.getBlobDiff(
          reviewSnapshot,
          `${base}:${rename.previousPath}`,
          rename.path,
          { hideWhitespace },
        );
        if (!result.success || result.outputLimitExceeded) return null;
        const counts = dependencies.countDiffLines(result.stdout);
        return {
          ...rename,
          additions: counts?.additions ?? null,
          deletions: counts?.deletions ?? null,
        };
      }),
    )
  ).filter((rename) => rename != null);
}

async function readReviewDiffMetadata(
  { diffArgs, hideWhitespace, paths, reviewSnapshot }: any,
  dependencies: GitReviewMetadataDiffDependencies,
) {
  if (paths?.length === 0) return { files: [], rawEntries: [], stats: [] };
  const pathArgs = paths != null && paths.length > 0 ? [`--`, ...paths] : [];
  const whitespaceArgs = hideWhitespace ? [`--ignore-all-space`] : [];
  const result = await fetchReviewMetadataDiff(
    reviewSnapshot,
    [
      ...diffArgs,
      ...whitespaceArgs,
      `--find-renames`,
      `--raw`,
      `--no-abbrev`,
      `--numstat`,
      `-z`,
      ...pathArgs,
    ],
    dependencies,
  );
  if (!result.success) return null;
  const metadata = dependencies.parseReviewMetadataDiff(result.stdout);
  const visibleStats = hideWhitespace
    ? new Set(
        metadata.stats.map((stat: any) =>
          dependencies.reviewFileKey(stat.path, stat.previousPath),
        ),
      )
    : null;
  const rawEntries = metadata.rawEntries.filter(
    (entry: any) =>
      visibleStats == null ||
      entry.status === `A` ||
      entry.status === `U` ||
      visibleStats.has(
        dependencies.reviewFileKey(entry.path, entry.previousPath),
      ),
  );
  return {
    files: rawEntries.map(({ path, previousPath, status }: any) => ({
      additions: null,
      changeKind: dependencies.gitStatusToReviewChangeKind(status),
      deletions: null,
      path,
      previousPath,
    })),
    rawEntries,
    stats: metadata.stats,
  };
}

async function resolveReviewMetadataPaths(
  { diffArgs, requestedPaths, reviewSnapshot, source, statusPaths }: any,
  dependencies: GitReviewMetadataDiffDependencies,
) {
  if (source !== `branch` && source !== `uncommitted` && source !== `unstaged`)
    return { paths: requestedPaths };
  let paths = statusPaths;
  if (source === `branch` || source === `uncommitted`) {
    const [base] = diffArgs;
    if (base == null) return null;
    const result = await fetchReviewMetadataDiff(
      reviewSnapshot,
      [`--cached`, base, `--no-renames`, `--name-only`, `-z`],
      dependencies,
    );
    if (!result.success) return null;
    paths = [
      ...new Set([
        ...paths,
        ...result.stdout.split(`\0`).filter((path: string) => path.length > 0),
      ]),
    ];
  }
  if (requestedPaths != null) {
    const requestedPathSet = new Set(requestedPaths);
    paths = paths.filter((path: string) => requestedPathSet.has(path));
  }
  return {
    paths: paths.length > MAX_REVIEW_METADATA_PATHS ? requestedPaths : paths,
  };
}

function fetchReviewMetadataDiff(
  reviewSnapshot: any,
  args: string[],
  dependencies: GitReviewMetadataDiffDependencies,
) {
  return reviewSnapshot.worktreeRepo.queryClient.fetchQuery({
    queryKey: reviewSnapshot.queryKey(`review-metadata-diff`, args),
    meta: dependencies.getQueryMeta(),
    queryFn: () =>
      reviewSnapshot.gitDiff(args, {
        allowedNonZeroExitCodes: [0, 1],
        trim: false,
      }),
    staleTime: dependencies.staleTime,
  });
}

export {
  MAX_REVIEW_METADATA_PATHS,
  fetchReviewMetadataDiff,
  inferReviewRenames,
  readReviewDiffMetadata,
  reconcileStagedReviewRenames,
  resolveReviewMetadataPaths,
};

if (typeof module !== `undefined`)
  module.exports = {
    MAX_REVIEW_METADATA_PATHS,
    fetchReviewMetadataDiff,
    inferReviewRenames,
    readReviewDiffMetadata,
    reconcileStagedReviewRenames,
    resolveReviewMetadataPaths,
  };
