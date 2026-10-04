/** Pure selection rules for faning out Git live-query refreshes. */

function selectGitLiveQueriesForRepoChange(
  states: any[],
  event: { hostId: string; commonDir: string; root: string; changeType: string },
  shouldRefresh: (query: any, changeType: string) => boolean,
) {
  return states.filter(
    (state) =>
      state.host.id === event.hostId &&
      state.commonDir === event.commonDir &&
      state.root === event.root &&
      shouldRefresh(state.query, event.changeType),
  );
}

function selectGitLiveQueriesForRecovery(states: any[], params: { subscriptionIds: string[]; hostId: string; root?: string | null }) {
  const subscriptionIds = new Set(params.subscriptionIds);
  return states.filter(
    (state) =>
      subscriptionIds.has(state.subscriptionId) &&
      state.host.id === params.hostId &&
      (params.root == null || state.root === params.root) &&
      state.requiresRecovery,
  );
}

function selectGitLiveQueriesForRepository(states: any[], hostId: string, root: string) {
  return states.filter((state) => state.host.id === hostId && state.root === root);
}

export {
  selectGitLiveQueriesForRepoChange,
  selectGitLiveQueriesForRecovery,
  selectGitLiveQueriesForRepository,
};
if (typeof module !== `undefined`) module.exports = {
  selectGitLiveQueriesForRepoChange,
  selectGitLiveQueriesForRecovery,
  selectGitLiveQueriesForRepository,
};
