/** Side-effect boundaries for a live-query subscription's timer and waiters. */

type LiveQuerySubscriptionState = {
  abortController?: AbortController | null;
  refreshTimer?: any;
  refreshWaiters: Array<() => void>;
};

type LiveQuerySubscriptionLifecycleDependencies = {
  setTimeout: (callback: () => void, delayMs: number) => any;
  refresh: () => void;
  isSubscribed: () => boolean;
};

function cancelGitLiveQuerySubscription(
  state: LiveQuerySubscriptionState,
  clearTimeout: (timer: any) => void,
) {
  if (state.refreshTimer != null) {
    clearTimeout(state.refreshTimer);
    state.refreshTimer = null;
  }
  state.abortController?.abort();
  const waiters = state.refreshWaiters;
  state.refreshWaiters = [];
  waiters.forEach((resolve) => resolve());
  return waiters.length;
}

function scheduleGitLiveQueryRefresh(
  state: any,
  delayMs: number,
  dependencies: LiveQuerySubscriptionLifecycleDependencies,
) {
  if (state.inFlight != null || state.refreshTimer != null) return false;
  if (delayMs === 0) {
    dependencies.refresh();
    return true;
  }
  state.refreshTimer = dependencies.setTimeout(() => {
    state.refreshTimer = null;
    if (dependencies.isSubscribed()) dependencies.refresh();
  }, delayMs);
  return true;
}

function resolveGitLiveQueryRefreshWaiters(state: LiveQuerySubscriptionState) {
  const waiters = state.refreshWaiters;
  state.refreshWaiters = [];
  waiters.forEach((resolve) => resolve());
  return waiters.length;
}

export {
  cancelGitLiveQuerySubscription,
  resolveGitLiveQueryRefreshWaiters,
  scheduleGitLiveQueryRefresh,
};
if (typeof module !== `undefined`)
  module.exports = {
    cancelGitLiveQuerySubscription,
    resolveGitLiveQueryRefreshWaiters,
    scheduleGitLiveQueryRefresh,
  };
