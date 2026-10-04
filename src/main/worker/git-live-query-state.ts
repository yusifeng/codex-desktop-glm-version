/** Session state and cache-key helpers for live Git queries. */

function createGitLiveQueryState(params: any, generation: number): Record<string, any> {
  return {
    abortController: null,
    commonDir: params.commonDir,
    dirty: true,
    errorRetryCount: 0,
    generation,
    host: params.host,
    inFlight: null,
    query: params.query,
    requiresRecovery: params.requiresRecovery,
    refreshTimer: null,
    refreshWaiters: [],
    root: params.root,
    subscriptionId: params.subscriptionId,
    trace: params.trace,
    traceLinks: [],
    trigger: `subscription`,
  };
}

function getGitLiveQueryRepositoryKey(state: { host: { id: string }; commonDir: string }): string {
  return `${state.host.id}\0${state.commonDir}`;
}

function getGitLiveQuerySharedKey(state: { host: { id: string }; commonDir: string; root: string; query: { method: string; params: unknown } }): string {
  return `${getGitLiveQueryRepositoryKey(state)}\0${state.root}\0${JSON.stringify([
    state.query.method,
    state.query.params,
  ])}`;
}

function getGitLiveQueryBranchDependencyKey(params: { hostId: string; commonDir: string; root: string; branch: string }): string {
  return `${params.hostId}\0${params.commonDir}\0${params.root}\0${params.branch}`;
}

export {
  createGitLiveQueryState,
  getGitLiveQueryBranchDependencyKey,
  getGitLiveQueryRepositoryKey,
  getGitLiveQuerySharedKey,
};
if (typeof module !== `undefined`)
  module.exports = {
    createGitLiveQueryState,
    getGitLiveQueryBranchDependencyKey,
    getGitLiveQueryRepositoryKey,
    getGitLiveQuerySharedKey,
  };
