export async function dispatchRepositoryContentRequest(method: string, params: any, deps: any): Promise<unknown> {
  switch (method) {
    case `repository-identity`: return deps.repositoryIdentity(params);
    case `commit-message-diff`: return deps.commitMessageDiff(params);
    case `submodule-paths`: return deps.submodulePaths(params);
    case `cat-file`: return deps.catFile(params);
    case `blame-file`: return deps.blameFile(params);
    case `index-info`: return deps.indexInfo(params);
    case `config-value`: return deps.configValue(params);
    default: return undefined;
  }
}
if (typeof module !== `undefined`) module.exports = { dispatchRepositoryContentRequest };
