export async function dispatchBranchReadRequest(method: string, params: any, deps: any): Promise<unknown> {
  switch (method) {
    case `current-branch`: return deps.currentBranch(params.root);
    case `current-branch-snapshot`: return deps.currentBranchSnapshot(params.root, deps.signal);
    case `upstream-branch`: return deps.upstreamBranch(params.root, deps.signal);
    case `branch-ahead-count`: return deps.branchAheadCount(params.root, deps.signal);
    case `default-branch`: return deps.defaultBranch(params.root, deps.signal);
    case `base-branch`: return deps.baseBranch(params.root);
    default: return undefined;
  }
}
if (typeof module !== `undefined`) module.exports = { dispatchBranchReadRequest };
