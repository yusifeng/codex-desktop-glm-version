const MAX_REVIEW_COMMITS = 100;
const MAX_REVIEW_COMMIT_OUTPUT_BYTES = 2_097_152;

type GitReviewCommitQueryDependencies = {
  fetchQueryWithSignal: (
    queryClient: any,
    options: any,
    signal: AbortSignal | undefined,
  ) => Promise<any>;
  getQueryMeta: () => any;
  normalizeCommitSha: (sha: string) => string;
  queryKey: (...parts: any[]) => any;
  resolveReviewComparisonArgs: (params: any) => Promise<any>;
  runGit: (
    cwd: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
  staleTime: number;
};

function parseReviewCommitLineCounts(
  output: string,
  dependencies: GitReviewCommitQueryDependencies,
) {
  return output.split(`\x1e`).flatMap((record) => {
    const [sha, ...lines] = record.trim().split(/\r?\n/);
    if (!sha) return [];
    let additions: number | null = 0;
    let deletions: number | null = 0;
    for (const line of lines) {
      if (line.length === 0) continue;
      const [added, deleted, path] = line.split(`\t`);
      if (
        added == null ||
        deleted == null ||
        path == null ||
        added === `-` ||
        deleted === `-`
      ) {
        additions = null;
        deletions = null;
        break;
      }
      const addedCount = Number(added);
      const deletedCount = Number(deleted);
      if (
        !Number.isSafeInteger(addedCount) ||
        !Number.isSafeInteger(deletedCount)
      ) {
        additions = null;
        deletions = null;
        break;
      }
      additions += addedCount;
      deletions += deletedCount;
    }
    return [
      {
        additions,
        deletions,
        sha: dependencies.normalizeCommitSha(sha),
      },
    ];
  });
}

function parseBranchCommits(
  output: string,
  dependencies: GitReviewCommitQueryDependencies,
) {
  return output
    .split(`\x1e`)
    .map((record) => {
      const [sha, committedAt, subject, message] = record.trim().split(`\0`);
      return !sha || !committedAt || subject == null || message == null
        ? null
        : {
            committedAt,
            message,
            sha: dependencies.normalizeCommitSha(sha),
            subject,
          };
    })
    .filter((commit) => commit != null);
}

async function getBranchCommits(
  repository: any,
  baseBranch: string,
  signal: AbortSignal,
  dependencies: GitReviewCommitQueryDependencies,
) {
  const comparison = await dependencies.resolveReviewComparisonArgs({
    baseBranch,
    signal,
    source: `branch`,
    worktreeRepo: repository,
  });
  const resolvedBase =
    comparison.type === `success` ? comparison.args[0] : null;
  return resolvedBase == null
    ? []
    : readBranchCommits(repository, resolvedBase, signal, dependencies);
}

function getReviewCommitLineCounts(
  repository: any,
  commits: string[],
  hideWhitespace = false,
  signal: AbortSignal | undefined,
  dependencies: GitReviewCommitQueryDependencies,
) {
  if (commits.length === 0 || commits.length > MAX_REVIEW_COMMITS)
    return Promise.resolve([]);
  return dependencies.fetchQueryWithSignal(
    repository.queryClient,
    {
      queryKey: dependencies.queryKey(
        repository.root,
        repository.host,
        `review-commit-line-counts`,
        commits,
        hideWhitespace ? `ignore-whitespace` : `include-whitespace`,
      ),
      gcTime: 250,
      meta: dependencies.getQueryMeta(),
      staleTime: dependencies.staleTime,
      queryFn: async (querySignal: AbortSignal) => {
        const result = await dependencies.runGit(
          repository.root,
          [
            `log`,
            `--no-walk=unsorted`,
            `--format=%x1e%H`,
            `--numstat`,
            ...(hideWhitespace ? [`--ignore-all-space`] : []),
            `--diff-merges=first-parent`,
            ...commits,
            `--`,
          ],
          repository.host,
          {
            maxOutputBytes: MAX_REVIEW_COMMIT_OUTPUT_BYTES,
            signal: querySignal,
          },
        );
        return !result.success || !result.stdout
          ? []
          : parseReviewCommitLineCounts(result.stdout, dependencies);
      },
    },
    signal,
  );
}

function readBranchCommits(
  repository: any,
  base: string,
  signal: AbortSignal,
  dependencies: GitReviewCommitQueryDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(
      repository.root,
      repository.host,
      `branch-commits`,
      base,
    ),
    gcTime: 250,
    meta: dependencies.getQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [
          `log`,
          `--max-count=${MAX_REVIEW_COMMITS}`,
          `--format=%H%x00%cI%x00%s%x00%B%x1e`,
          `${base}..HEAD`,
        ],
        repository.host,
        {
          maxOutputBytes: MAX_REVIEW_COMMIT_OUTPUT_BYTES,
          signal,
        },
      );
      return !result.success || !result.stdout
        ? []
        : parseBranchCommits(result.stdout, dependencies);
    },
    staleTime: 250,
  });
}

export {
  MAX_REVIEW_COMMITS,
  MAX_REVIEW_COMMIT_OUTPUT_BYTES,
  getBranchCommits,
  getReviewCommitLineCounts,
  parseBranchCommits,
  parseReviewCommitLineCounts,
  readBranchCommits,
};

if (typeof module !== `undefined`)
  module.exports = {
    MAX_REVIEW_COMMITS,
    MAX_REVIEW_COMMIT_OUTPUT_BYTES,
    getBranchCommits,
    getReviewCommitLineCounts,
    parseBranchCommits,
    parseReviewCommitLineCounts,
    readBranchCommits,
  };
