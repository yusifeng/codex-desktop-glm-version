type GitReviewDiffDependencies = {
  byteLength: (value: string) => number;
  getBlobDiff: (
    reviewSnapshot: any,
    oldObject: string,
    newObject: string,
    options: any,
  ) => Promise<any>;
  getQueryMeta: () => any;
  getUntrackedWorkingTreeDiff: (
    reviewSnapshot: any,
    path: string,
    options: any,
  ) => Promise<any>;
  normalizePathFromRoot: (
    platformPath: any,
    sourceRoot: string,
    targetRoot: string,
    path: string,
  ) => string;
  parseDiffHeader: (header: string) => any;
  parseGitError: (result: any) => any;
  prepareReviewComparison: (params: any) => Promise<any>;
  rewriteRenameDiff: (
    diff: string,
    previousPath: string,
    path: string,
  ) => string;
};

async function getReviewDiff(
  reviewSnapshot: any,
  source: string,
  files: any[],
  {
    baseBranch,
    binary = false,
    commitSha,
    hideWhitespace = false,
  }: any = {},
  dependencies: GitReviewDiffDependencies,
) {
  const { worktreeRepo } = reviewSnapshot;
  const { root } = worktreeRepo;
  const platformPath = await worktreeRepo.host.platformPath();
  const normalizedFiles = files.map((file) => ({
    ...file,
    path: dependencies.normalizePathFromRoot(
      platformPath,
      root,
      root,
      file.path,
    ),
    previousPath:
      file.previousPath == null
        ? null
        : dependencies.normalizePathFromRoot(
            platformPath,
            root,
            root,
            file.previousPath,
          ),
    requestPath: file.path,
  }));
  const paths = [
    ...new Set(
      normalizedFiles.flatMap((file) =>
        file.previousPath == null
          ? [file.path]
          : [file.previousPath, file.path],
      ),
    ),
  ];
  const comparison = await dependencies.prepareReviewComparison({
    baseBranch,
    commitSha,
    includeUnmergedPaths: false,
    includeUntrackedFiles: normalizedFiles.some(
      (file) => file.changeKind === `untracked` || file.previousPath != null,
    ),
    paths,
    reviewSnapshot,
    source,
  });
  if (comparison.type !== `success`)
    return {
      source,
      diffs: Object.fromEntries(
        normalizedFiles.map((file) => [
          file.requestPath,
          reviewDiffError({ type: `unknown` }),
        ]),
      ),
    };

  const untrackedPaths = paths.filter((path) =>
    comparison.untrackedPathSet.has(path),
  );
  const trackedPaths = paths.filter(
    (path) => !comparison.untrackedPathSet.has(path),
  );
  const [trackedDiffs, untrackedDiffs] = await Promise.all([
    getTrackedReviewDiffs(
      {
        binary,
        diffArgs: comparison.diffArgs,
        hideWhitespace,
        paths: trackedPaths,
        reviewSnapshot,
      },
      dependencies,
    ),
    getUntrackedReviewDiffs(
      { binary, paths: untrackedPaths, reviewSnapshot },
      dependencies,
    ),
  ]);
  const diffs = new Map([...trackedDiffs, ...untrackedDiffs]);

  if (source === `branch` || source === `uncommitted` || source === `unstaged`) {
    const [base] = comparison.diffArgs;
    if (source === `unstaged` || base != null)
      await Promise.all(
        normalizedFiles.map(async (file) => {
          if (file.previousPath == null) return;
          const existing = diffs.get(file.path);
          if (
            existing?.type === `success` &&
            typeof existing.diff === `string` &&
            diffMatchesRename(
              existing.diff,
              file.previousPath,
              file.path,
              dependencies,
            )
          )
            return;
          const result = await dependencies.getBlobDiff(
            reviewSnapshot,
            source === `unstaged`
              ? `:${file.previousPath}`
              : `${base}:${file.previousPath}`,
            file.path,
            { binary, hideWhitespace },
          );
          if (result.outputLimitExceeded || !result.success) {
            diffs.set(file.path, reviewDiffError(dependencies.parseGitError(result)));
            return;
          }
          const diff = dependencies.rewriteRenameDiff(
            result.stdout,
            file.previousPath,
            file.path,
          );
          diffs.set(file.path, {
            type: `success`,
            diff,
            diffBytes: Buffer.byteLength(diff, `utf8`),
          });
        }),
      );
  }

  return reviewSnapshot.read(async () => ({
    source,
    diffs: Object.fromEntries(
      normalizedFiles.map((file) => [
        file.requestPath,
        diffs.get(file.path) ?? reviewDiffError({ type: `unknown` }),
      ]),
    ),
  }));
}

async function getUntrackedReviewDiffs(
  { binary, paths, reviewSnapshot }: any,
  dependencies: GitReviewDiffDependencies,
) {
  const diffs = new Map<string, any>();
  let index = 0;
  const worker = async () => {
    for (;;) {
      const path = paths[index];
      index += 1;
      if (path == null) return;
      const result = await dependencies.getUntrackedWorkingTreeDiff(
        reviewSnapshot,
        path,
        { binary },
      );
      diffs.set(
        path,
        result.type === `error`
          ? reviewDiffError(result.error)
          : {
              type: `success`,
              diff: result.unifiedDiff,
              diffBytes:
                result.unifiedDiffBytes ??
                Buffer.byteLength(result.unifiedDiff, `utf8`),
            },
      );
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(8, paths.length) }, () => worker()),
  );
  return diffs;
}

function diffMatchesRename(
  diff: string,
  previousPath: string,
  path: string,
  dependencies: GitReviewDiffDependencies,
) {
  const header = /^diff --(?:git|cc|combined) .*$/m.exec(diff)?.[0];
  const parsed =
    header == null ? null : dependencies.parseDiffHeader(header);
  return parsed?.oldPath === previousPath && parsed.newPath === path;
}

async function getTrackedReviewDiffs(
  { binary, diffArgs, hideWhitespace, paths, reviewSnapshot }: any,
  dependencies: GitReviewDiffDependencies,
) {
  if (paths.length === 0) return new Map();
  const result = await fetchTrackedReviewDiff(
    diffArgs,
    binary,
    hideWhitespace,
    paths,
    reviewSnapshot,
    dependencies,
  );
  if (result.outputLimitExceeded || !result.success) {
    const error = reviewDiffError(dependencies.parseGitError(result));
    return new Map(paths.map((path: string) => [path, error]));
  }
  const diffs = splitReviewDiffs(result.stdout, dependencies);
  if (!hideWhitespace) return diffs;
  for (const path of paths)
    if (!diffs.has(path))
      diffs.set(path, { type: `success`, diff: ``, diffBytes: 0 });
  return diffs;
}

function fetchTrackedReviewDiff(
  diffArgs: string[],
  binary: boolean,
  hideWhitespace: boolean,
  paths: string[],
  reviewSnapshot: any,
  dependencies: GitReviewDiffDependencies,
) {
  const args = [
    ...diffArgs,
    ...(hideWhitespace ? [`--ignore-all-space`] : []),
    `--full-index`,
    `--find-renames`,
    `--`,
    ...paths,
  ];
  return reviewSnapshot.worktreeRepo.queryClient.fetchQuery({
    queryKey: reviewSnapshot.queryKey(`review-diffs`, [
      ...(binary ? [`--binary`] : []),
      ...args,
    ]),
    gcTime: 250,
    meta: dependencies.getQueryMeta(),
    queryFn: () =>
      reviewSnapshot.gitDiff(args, {
        allowedNonZeroExitCodes: [0, 1],
        binary,
        trim: false,
      }),
    staleTime: 250,
  });
}

function createReviewDiffFallback(source: string, files: any[]) {
  return {
    source,
    diffs: Object.fromEntries(
      files.map((file) => [file.path, reviewDiffError({ type: `unknown` })]),
    ),
  };
}

function splitReviewDiffs(
  output: string,
  dependencies: GitReviewDiffDependencies,
) {
  const diffs = new Map<string, any>();
  const headers = Array.from(
    output.matchAll(/^diff --(?:git|cc|combined) .*$/gm),
  );
  for (const [index, header] of headers.entries()) {
    const paths = dependencies.parseDiffHeader(header[0]);
    if (paths == null) continue;
    const start = header.index ?? 0;
    const end =
      index + 1 < headers.length
        ? (headers[index + 1]?.index ?? output.length)
        : output.length;
    const diff = output.slice(start, end);
    const result = {
      type: `success`,
      diff,
      diffBytes: dependencies.byteLength(diff),
    };
    diffs.set(paths.oldPath, result);
    diffs.set(paths.newPath, result);
  }
  return diffs;
}

function reviewDiffError(error: any) {
  return { type: `error`, error };
}

export {
  createReviewDiffFallback,
  diffMatchesRename,
  fetchTrackedReviewDiff,
  getReviewDiff,
  getTrackedReviewDiffs,
  getUntrackedReviewDiffs,
  reviewDiffError,
  splitReviewDiffs,
};

if (typeof module !== `undefined`)
  module.exports = {
    createReviewDiffFallback,
    diffMatchesRename,
    fetchTrackedReviewDiff,
    getReviewDiff,
    getTrackedReviewDiffs,
    getUntrackedReviewDiffs,
    reviewDiffError,
    splitReviewDiffs,
  };
