import {
  MAX_REVIEW_COMMITS,
  MAX_REVIEW_COMMIT_OUTPUT_BYTES,
  parseBranchCommits,
  parseReviewCommitLineCounts,
} from './git-review-commit-queries-policy';

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
          : parseReviewCommitLineCounts(result.stdout, dependencies.normalizeCommitSha);
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
        : parseBranchCommits(result.stdout, dependencies.normalizeCommitSha);
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
