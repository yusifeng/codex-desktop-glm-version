import { shouldRefreshLiveQuery } from "./git-live-query-policy";
import {
  selectGitLiveQueriesForRecovery,
  selectGitLiveQueriesForRepoChange,
  selectGitLiveQueriesForRepository,
} from "./git-live-query-selection-policy";

type RegistryRefreshBoundary = {
  states: Map<any, any>;
  dependencies: {
    getActiveTrace: () => any;
    prepareRecovery: (root: string, host: any) => void;
  };
  refreshStates: (states: any[], trigger: string, trace: any) => Promise<void>;
};

/**
 * Coordinates the registry-wide refresh triggers.  Keeping recovery and
 * repository invalidation together preserves the one-refresh-per-state
 * contract while leaving subscription and timer ownership in the registry.
 */
function handleGitLiveQueryRepoChanged(
  registry: RegistryRefreshBoundary,
  event: any,
  onFanout?: (count: number) => void,
) {
  const states = selectGitLiveQueriesForRepoChange(
    [...registry.states.values()], event, shouldRefreshLiveQuery,
  );
  onFanout?.(states.length);
  return registry.refreshStates(states, `invalidation`, event.trace);
}

function setGitLiveQueryRecovery(
  registry: RegistryRefreshBoundary,
  hostId: string,
  root: string,
  requiresRecovery: boolean,
) {
  const states = [...registry.states.values()].filter((state) => {
    if (
      state.host.id !== hostId ||
      state.root !== root ||
      state.requiresRecovery === requiresRecovery
    ) return false;
    state.requiresRecovery = requiresRecovery;
    return true;
  });
  return registry.refreshStates(
    states,
    `recovery`,
    registry.dependencies.getActiveTrace() ?? undefined,
  );
}

function recoverGitLiveQueries(registry: RegistryRefreshBoundary, params: any) {
  const states = selectGitLiveQueriesForRecovery(
    [...registry.states.values()], params,
  );
  const repositories = new Map<string, any>();
  for (const state of states)
    repositories.set(`${state.host.id}\0${state.root}`, state);
  for (const state of repositories.values())
    registry.dependencies.prepareRecovery(state.root, state.host);
  return registry.refreshStates(
    states,
    `recovery`,
    registry.dependencies.getActiveTrace() ?? undefined,
  );
}

function refreshGitLiveQueryRepository(
  registry: RegistryRefreshBoundary,
  hostId: string,
  root: string,
) {
  return registry.refreshStates(
    selectGitLiveQueriesForRepository([...registry.states.values()], hostId, root),
    `mutation`,
    registry.dependencies.getActiveTrace() ?? undefined,
  );
}

export {
  handleGitLiveQueryRepoChanged,
  recoverGitLiveQueries,
  refreshGitLiveQueryRepository,
  setGitLiveQueryRecovery,
};
if (typeof module !== "undefined") module.exports = {
  handleGitLiveQueryRepoChanged,
  recoverGitLiveQueries,
  refreshGitLiveQueryRepository,
  setGitLiveQueryRecovery,
};
