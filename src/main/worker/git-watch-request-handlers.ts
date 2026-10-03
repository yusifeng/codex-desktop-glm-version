type WatchRequestDependencies = {
  gitManager: any;
  host: any;
  liveQueryRegistry: any;
  disposeGitInitWatcher: (cwd: string, host: any) => void;
  getExistingWatch: (root: string) => any;
  ensureWatching: (metadata: { commonDir: string; root: string }, host: any) => Promise<unknown>;
  trace: (options: any, operation: () => Promise<unknown>) => Promise<unknown>;
  unwatchRepo: (root: string, host: any) => void;
};

function disposeGitInitWatch(cwd: string, deps: WatchRequestDependencies) {
  deps.disposeGitInitWatcher(cwd, deps.host);
  return { success: true };
}

async function watchGitRepository(params: { commonDir: string; root: string }, deps: WatchRequestDependencies) {
  const metadata = { commonDir: params.commonDir, root: params.root };
  const existingWatch = deps.getExistingWatch(metadata.root);
  await deps.trace(
    {
      attributes: {
        "git.watcher_reused": existingWatch != null,
        "worker.id": `git`,
        "worker.method": `watch-repo`,
      },
      links: existingWatch?.startTrace == null ? [] : [existingWatch.startTrace],
      name: `git.watcher_start`,
      op: `codex.git.watcher_start`,
    },
    () => deps.ensureWatching(metadata, deps.host),
  );
  return { success: true };
}

async function recoverGitLiveQueries(
  params: { cwd?: string | null; subscriptionIds: string[] },
  deps: WatchRequestDependencies,
) {
  const metadata = params.cwd == null
    ? null
    : await deps.gitManager.getStableMetadata(params.cwd, deps.host);
  if (params.cwd == null || metadata != null) {
    await deps.liveQueryRegistry.recover({
      hostId: deps.host.id,
      root: metadata?.root,
      subscriptionIds: params.subscriptionIds,
    });
  }
}

function unwatchGitRepository(root: string, deps: WatchRequestDependencies) {
  deps.unwatchRepo(root, deps.host);
  return { success: true };
}

export { disposeGitInitWatch, recoverGitLiveQueries, unwatchGitRepository, watchGitRepository };
if (typeof module !== `undefined`) module.exports = {
  disposeGitInitWatch,
  recoverGitLiveQueries,
  unwatchGitRepository,
  watchGitRepository,
};
