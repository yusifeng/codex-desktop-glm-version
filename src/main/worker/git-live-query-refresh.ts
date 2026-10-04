import { resolveGitLiveQueryRefreshWaiters } from "./git-live-query-subscription-lifecycle";

type GitLiveQueryRefreshDependencies = {
  createAbortController?: () => AbortController;
  runShared: (state: any, signal: AbortSignal, trace: any, traceLinks: any[], onTracked: (result: any) => void) => Promise<any>;
  isCurrent: (state: any, generation: number) => boolean;
  publish: (state: any, generation: number, result: any, trace: any) => void;
  emit: (event: any) => void;
  now: () => number;
  scheduleRefresh: (state: any, delayMs?: number) => void;
  resolveRefreshWaiters?: (state: any) => void;
  mergeTrace?: (state: any, trace: any) => void;
  nextGeneration?: () => number;
  errorRetryDelayMs: number;
  maxErrorRetries: number;
};

/** Runs one live-query generation and preserves tracked/complete/retry ordering. */
function refreshGitLiveQuery(state: any, dependencies: GitLiveQueryRefreshDependencies) {
  if (state.inFlight != null || !state.dirty) return;
  const generation = state.generation;
  const abortController = (dependencies.createAbortController ?? (() => new AbortController()))();
  let retryDelayMs: number | null = null;
  const trace = state.trace;
  const traceLinks = state.traceLinks;
  state.trace = undefined;
  state.traceLinks = [];
  state.abortController = abortController;
  state.dirty = false;
  state.inFlight = Promise.resolve()
    .then(() => dependencies.runShared(state, abortController.signal, trace, traceLinks, (result) => {
      if (dependencies.isCurrent(state, generation))
        dependencies.publish(state, generation, { ...result, phase: `tracked` }, trace);
    }))
    .then((result) => {
      if (!dependencies.isCurrent(state, generation)) return;
      dependencies.publish(state, generation, { ...result, phase: `complete` }, trace);
      const shouldRetry =
        (result.method === `review-summary` || result.method === `status-summary`) &&
        result.result.type === `error`;
      if (shouldRetry && state.errorRetryCount < dependencies.maxErrorRetries) {
        state.errorRetryCount += 1;
        state.dirty = true;
        retryDelayMs = dependencies.errorRetryDelayMs;
        if (dependencies.mergeTrace != null) {
          dependencies.mergeTrace(state, trace);
          for (const link of traceLinks) dependencies.mergeTrace(state, link);
        }
      } else if (!shouldRetry) state.errorRetryCount = 0;
    })
    .catch(() => {
      if (dependencies.isCurrent(state, generation))
        dependencies.emit({
          type: `git-live-query-failed`,
          emittedAtMs: dependencies.now(),
          generation,
          method: state.query.method,
          subscriptionId: state.subscriptionId,
          ...(trace == null ? {} : { trace }),
        });
    })
    .finally(() => {
      state.abortController = null;
      state.inFlight = null;
      if (!dependencies.isCurrent(state, generation)) return;
      resolveGitLiveQueryRefreshWaiters(state);
      if (state.dirty) {
        if (retryDelayMs != null && state.generation === generation)
          state.generation = dependencies.nextGeneration?.() ?? (state.generation + 1);
        dependencies.scheduleRefresh(state, retryDelayMs ?? undefined);
      }
    });
  return state.inFlight;
}

export { refreshGitLiveQuery };
if (typeof module !== `undefined`) module.exports = { refreshGitLiveQuery };
