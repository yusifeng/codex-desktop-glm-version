export async function dispatchSyncedBranchRequest(method: string, params: any, deps: any): Promise<unknown> {
  switch (method) {
    case `synced-branch`: return deps.syncedBranch(params.cwd);
    case `synced-branch-state`: return deps.syncedBranchState(params.cwd);
    case `overwrite-repo`: return deps.overwriteRepository(params);
    default: return undefined;
  }
}
if (typeof module !== `undefined`) module.exports = { dispatchSyncedBranchRequest };
