export async function dispatchCacheWatchRequest(method: string, params: any, deps: any): Promise<unknown> {
  switch (method) {
    case `invalidate-stable-metadata`: return deps.invalidateStableMetadata();
    case `invalidate-git-read-caches`: return deps.invalidateGitReadCaches(params);
    case `dispose-git-init-watch`: return deps.disposeGitInitWatch(params.cwd);
    case `watch-repo`: return deps.watchRepository(params);
    case `subscribe-live-query`: return deps.subscribeLiveQuery(params);
    case `recover-live-queries`: return deps.recoverLiveQueries(params);
    case `unwatch-repo`: return deps.unwatchRepository(params.root);
    case `git-init-repo`: return deps.initializeRepository(params);
    default: return undefined;
  }
}
if (typeof module !== `undefined`) module.exports = { dispatchCacheWatchRequest };
