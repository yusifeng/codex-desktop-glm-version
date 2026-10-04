export async function dispatchBranchExtraReadRequest(method: string, params: any, deps: any): Promise<unknown> {
  switch (method) {
    case `recent-branches`: return deps.recentBranches(params);
    case `resolve-worktree-starting-ref`: return deps.resolveStartingRef(params.root, params.ref);
    case `branch-commits`: return deps.branchCommits(params.root, params.baseBranch);
    case `review-commit-line-counts`: return deps.reviewCommitLineCounts(params.root, params.commits, params.hideWhitespace);
    default: return undefined;
  }
}
if (typeof module !== `undefined`) module.exports = { dispatchBranchExtraReadRequest };
