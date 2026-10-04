/** Plans a live-query refresh generation and exposes its completion waiter. */

type LiveQueryRefreshPlanDependencies = {
  nextGeneration: () => number;
  mergeTrace: (state: any, trace: any) => void;
};

/**
 * Marks each selected subscription dirty before scheduling asynchronous work.
 * Keeping this transition together is important: a refresh can be requested
 * while an older generation is in flight, and the new generation must retain
 * its trace and waiter rather than being silently dropped.
 */
function planGitLiveQueryRefresh(
  states: any[],
  trigger: string,
  trace: any,
  dependencies: LiveQueryRefreshPlanDependencies,
) {
  return states.map((state) => {
    state.generation = dependencies.nextGeneration();
    state.dirty = true;
    state.errorRetryCount = 0;
    state.trigger = trigger;
    dependencies.mergeTrace(state, trace);
    return new Promise<void>((resolve) => state.refreshWaiters.push(resolve));
  });
}

export { planGitLiveQueryRefresh };
if (typeof module !== `undefined`) module.exports = { planGitLiveQueryRefresh };
