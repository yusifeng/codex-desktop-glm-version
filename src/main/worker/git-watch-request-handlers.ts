import { selectGitWatchSubscriptionState } from "./git-watch-subscription-policy";

type WatchRequestDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  liveQueryRegistry: any;
  disposeGitInitWatcher: (cwd: string, host: any) => void;
  getExistingWatch: (root: string) => any;
  ensureWatching: (metadata: { commonDir: string; root: string }, host: any, signal?: AbortSignal) => Promise<any>;
  resolveQueryRoot: (query: any) => string;
  trace: <T>(options: any, operation: () => Promise<T>) => Promise<T>;
  unwatchRepo: (root: string, host: any) => void;
  waitForAbort: (signal: AbortSignal) => Promise<void>;
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

async function subscribeGitLiveQuery(
  params: { query: any; subscriptionId: string; trace?: any },
  deps: WatchRequestDependencies,
) {
  const setup = await deps.trace(
    {
      attributes: {
        "git.operation": params.query.method,
        "worker.id": `git`,
        "worker.method": `subscribe-live-query`,
      },
      name: `git.subscription_setup`,
      op: `codex.git.subscription_setup`,
      trace: params.trace,
    },
    async () => {
      const root = deps.resolveQueryRoot(params.query);
      const pendingMetadataTrace = deps.gitManager.getPendingStableMetadataTrace(root, deps.host);
      const metadata = await deps.trace(
        {
          attributes: {
            "git.metadata_coalesced": pendingMetadataTrace != null,
            "git.operation": params.query.method,
            "worker.id": `git`,
            "worker.method": `subscribe-live-query`,
          },
          links: pendingMetadataTrace == null ? [] : [pendingMetadataTrace],
          name: `git.metadata_lookup`,
          op: `codex.git.metadata_lookup`,
        },
        () => deps.gitManager.getStableMetadata(root, deps.host),
      ) as { commonDir: string; root: string } | null;
      if (deps.signal.aborted) return null;
      if (metadata == null) throw new Error(`Live Git query requires repository metadata`);
      const existingWatch = deps.getExistingWatch(metadata.root);
      return {
        metadata,
        releaseWatch: await deps.trace(
          {
            attributes: {
              "git.operation": params.query.method,
              "git.watcher_reused": existingWatch != null,
              "worker.id": `git`,
              "worker.method": `subscribe-live-query`,
            },
            links: existingWatch?.startTrace == null ? [] : [existingWatch.startTrace],
            name: `git.watcher_start`,
            op: `codex.git.watcher_start`,
          },
          () => deps.ensureWatching(metadata, deps.host, deps.signal),
        ),
      };
    },
  );
  if (setup == null) return;

  const { metadata, releaseWatch } = setup;
  try {
    if (!deps.signal.aborted) {
      deps.liveQueryRegistry.subscribe({
        ...selectGitWatchSubscriptionState({ metadata, watch: deps.getExistingWatch(metadata.root) }),
        host: deps.host,
        query: params.query,
        subscriptionId: params.subscriptionId,
        trace: params.trace,
      });
      try {
        await deps.waitForAbort(deps.signal);
      } finally {
        deps.liveQueryRegistry.unsubscribe(params.subscriptionId);
      }
    }
  } finally {
    releaseWatch();
  }
}

function unwatchGitRepository(root: string, deps: WatchRequestDependencies) {
  deps.unwatchRepo(root, deps.host);
  return { success: true };
}

export { disposeGitInitWatch, recoverGitLiveQueries, subscribeGitLiveQuery, unwatchGitRepository, watchGitRepository };
if (typeof module !== `undefined`) module.exports = {
  disposeGitInitWatch,
  recoverGitLiveQueries,
  subscribeGitLiveQuery,
  unwatchGitRepository,
  watchGitRepository,
};
