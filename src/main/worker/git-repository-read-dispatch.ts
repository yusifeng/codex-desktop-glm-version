export async function dispatchRepositoryReadRequest(method: string, params: any, deps: any): Promise<unknown> {
  switch (method) {
    case `clone-state`: return deps.cloneState(params.root);
    case `branch-metadata`: return deps.branchMetadata(params.cwd);
    case `branch-exists`: return deps.branchExists(params.root, params.branch);
    default: return undefined;
  }
}
if (typeof module !== `undefined`) module.exports = { dispatchRepositoryReadRequest };
