const EMPTY_GIT_TREE_SHA = `4b825dc642cb6eb9a060e54bf8d69288fbee4904`;

export function createEmptyUntrackedPaths(root: string) {
  return { success: true, gitRoot: root, paths: [] };
}

type ReviewComparisonPolicyDependencies = {
  findMergeBase: (repository: any, branch: string) => Promise<any>;
  getDefaultBranch: (repository: any) => Promise<any>;
  getHeadCommit: (repository: any, ref: string, signal?: AbortSignal) => Promise<any>;
  getQueryMeta?: () => any;
  queryKey?: (root: string, host: any, type: string, ...parts: string[]) => any;
  normalizeCommitSha: (sha: string) => any;
  runGit: (root: string, args: string[], host: any, options?: Record<string, unknown>) => Promise<any>;
  validateObjectId: (sha: string) => boolean;
};

function normalizeOptionalHeadSha(sha: string | null, dependencies: Pick<ReviewComparisonPolicyDependencies, `normalizeCommitSha` | `validateObjectId`>) {
  if (sha && !dependencies.validateObjectId(sha)) throw Error(`Unexpected HEAD SHA: ${sha}`);
  return sha ? dependencies.normalizeCommitSha(sha) : null;
}

async function resolveReviewComparisonArgs({ baseBranch, commitSha, signal, source, worktreeRepo }: any, dependencies: ReviewComparisonPolicyDependencies) {
  switch (source) {
    case `branch`: {
      if (worktreeRepo == null) return { type: `error`, failureReason: `review_comparison` };
      if (baseBranch != null) {
        const mergeBase = await dependencies.findMergeBase(worktreeRepo, baseBranch);
        return mergeBase == null ? { type: `expected`, reason: `merge_base_unavailable` } : { type: `success`, args: [mergeBase] };
      }
      const defaultBranch = await dependencies.getDefaultBranch(worktreeRepo);
      if (defaultBranch == null) return { type: `expected`, reason: `default_branch_unavailable` };
      let branch = defaultBranch.branch;
      if (!branch.includes(`/`)) branch = `${defaultBranch.remote}/${branch}`;
      const mergeBase = await dependencies.findMergeBase(worktreeRepo, branch);
      return mergeBase == null ? { type: `expected`, reason: `merge_base_unavailable` } : { type: `success`, args: [mergeBase] };
    }
    case `commit`:
      return commitSha == null || worktreeRepo == null
        ? { type: `error`, failureReason: `review_comparison` }
        : { type: `success`, args: [(await getCommitParentSha(worktreeRepo, commitSha, signal, dependencies)) ?? EMPTY_GIT_TREE_SHA, commitSha] };
    case `staged`: return { type: `success`, args: [`--cached`] };
    case `uncommitted`:
      return worktreeRepo == null ? { type: `error`, failureReason: `review_comparison` } : { type: `success`, args: [(await readCurrentHeadSnapshot(worktreeRepo, signal, dependencies)) == null ? EMPTY_GIT_TREE_SHA : `HEAD`] };
    case `unstaged`: return { type: `success`, args: [] };
    default: return { type: `error`, failureReason: `review_comparison` };
  }
}

async function getCommitParentSha(repository: any, commitSha: string, signal: AbortSignal, dependencies: Pick<ReviewComparisonPolicyDependencies, `runGit` | `getQueryMeta` | `queryKey`>) {
  const read = async () => {
    const result = await dependencies.runGit(repository.root, [`rev-parse`, `--verify`, `--quiet`, `${commitSha}^`], repository.host, { allowedNonZeroExitCodes: [1, 128], signal });
    return result.success ? result.stdout.trim() : null;
  };
  if (repository.queryClient == null || dependencies.queryKey == null) return read();
  return repository.queryClient.fetchQuery({ queryKey: dependencies.queryKey(repository.root, repository.host, `commit-parent-sha`, commitSha), queryFn: read, staleTime: Infinity });
}

async function readCurrentHeadSnapshot(repository: any, signal: AbortSignal, dependencies: Pick<ReviewComparisonPolicyDependencies, `runGit` | `normalizeCommitSha` | `validateObjectId`>) {
  const result = await dependencies.runGit(repository.root, [`rev-parse`, `--verify`, `--quiet`, `HEAD`], repository.host, { allowedNonZeroExitCodes: [1, 128], signal });
  return normalizeOptionalHeadSha(result.success ? result.stdout.trim() : null, dependencies);
}

export { EMPTY_GIT_TREE_SHA, getCommitParentSha, normalizeOptionalHeadSha, readCurrentHeadSnapshot, resolveReviewComparisonArgs };
if (typeof module !== `undefined`) module.exports = { EMPTY_GIT_TREE_SHA, createEmptyUntrackedPaths, getCommitParentSha, normalizeOptionalHeadSha, readCurrentHeadSnapshot, resolveReviewComparisonArgs };
