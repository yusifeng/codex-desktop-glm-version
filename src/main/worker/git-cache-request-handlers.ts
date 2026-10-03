type CacheDependencies = {
  gitManager: any;
  host: any;
  invalidateUntrackedPathsCache: (repository: any) => void;
  refreshRepository: (hostId: string, root: string) => unknown;
};

function invalidateStableMetadata(deps: CacheDependencies) {
  deps.gitManager.invalidateStableMetadata();
  return { success: true };
}

function invalidateGitReadCaches(params: any, deps: CacheDependencies) {
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(params.root, deps.host);
  if (params.clearUntrackedPathsCache) deps.invalidateUntrackedPathsCache(repository);
  repository.clearShortLivedGitReadCaches();
  if (params.clearUntrackedPathsCache) deps.refreshRepository(deps.host.id, params.root);
  return { success: true };
}

export { invalidateGitReadCaches, invalidateStableMetadata };
if (typeof module !== `undefined`) module.exports = { invalidateGitReadCaches, invalidateStableMetadata };
