export async function dispatchWorktreeReadRequest(method: string, params: any, deps: any): Promise<unknown> {
  switch (method) {
    case `nearest-ancestor-branch`: return deps.nearestAncestorBranch(params);
    case `search-branches`: return deps.searchBranches(params);
    default: return undefined;
  }
}
if (typeof module !== `undefined`) module.exports = { dispatchWorktreeReadRequest };
