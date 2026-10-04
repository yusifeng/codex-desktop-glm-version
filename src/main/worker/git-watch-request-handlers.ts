import { selectGitWatchSubscriptionState } from "./git-watch-subscription-policy";
import { prepareGitLiveQuerySubscription } from "./git-live-query-subscription-setup";
import { recoverGitLiveQueries } from "./git-live-query-recovery";

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

async function subscribeGitLiveQuery(
  params: { query: any; subscriptionId: string; trace?: any },
  deps: WatchRequestDependencies,
) {
  const setup = await prepareGitLiveQuerySubscription(params, deps);
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
