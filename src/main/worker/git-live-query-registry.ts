import {
  mergeLiveQueryTrace,
  shouldRefreshLiveQuery,
} from "./git-live-query-policy";
import {
  createGitLiveQueryState,
  getGitLiveQueryBranchDependencyKey,
} from "./git-live-query-state";
import { updateGitLiveQueryBranchDependency } from "./git-live-query-branch-dependency";
import { GitLiveQueryRunCoordinator } from "./git-live-query-run-coordinator";
import {
  cancelGitLiveQuerySubscription,
  scheduleGitLiveQueryRefresh,
} from "./git-live-query-subscription-lifecycle";
import { refreshGitLiveQuery } from "./git-live-query-refresh";
import { planGitLiveQueryRefresh } from "./git-live-query-refresh-plan";
import {
  selectGitLiveQueriesForRepoChange,
  selectGitLiveQueriesForRecovery,
  selectGitLiveQueriesForRepository,
} from "./git-live-query-selection-policy";

type GitLiveQueryRegistryDependencies = {
  emit: (event: any) => void;
  run: (...args: any[]) => Promise<any>;
  prepareRecovery: (root: string, host: any) => void;
  getActiveTrace: () => any;
  trace: <T>(options: any, operation: () => Promise<T>) => Promise<T>;
  createDeferred: () => any;
  now: () => number;
  setTimeout: (callback: () => void, delayMs: number) => any;
  clearTimeout: (timer: any) => void;
  localRefreshDelayMs: number;
  errorRetryDelayMs: number;
  maxErrorRetries: number;
};

class GitLiveQueryRegistry {
  dependencies: GitLiveQueryRegistryDependencies;
  nextGeneration = 1;
  localBranchDependencies = new Map<string, number>();
  states = new Map<any, any>();
  runCoordinator: GitLiveQueryRunCoordinator;

  constructor(dependencies: GitLiveQueryRegistryDependencies) {
    this.dependencies = dependencies;
    this.runCoordinator = new GitLiveQueryRunCoordinator(dependencies);
  }

  subscribe(params: any) {
    if (this.states.has(params.subscriptionId)) return;
    const state = createGitLiveQueryState(params, this.nextGeneration++);
    this.states.set(params.subscriptionId, state);
    this.updateLocalBranchDependency(state, 1);
    this.refresh(state);
  }

  unsubscribe(subscriptionId: any) {
    const state = this.states.get(subscriptionId);
    if (state == null) return;
    cancelGitLiveQuerySubscription(
      state,
      this.dependencies.clearTimeout,
    );
    this.updateLocalBranchDependency(state, -1);
    this.states.delete(subscriptionId);
  }

  hasLocalBranchDependency(params: any) {
    return this.localBranchDependencies.has(getGitLiveQueryBranchDependencyKey(params));
  }

  updateLocalBranchDependency(state: any, delta: number) {
    updateGitLiveQueryBranchDependency(
      this.localBranchDependencies,
      state,
      delta,
      getGitLiveQueryBranchDependencyKey,
    );
  }

  handleRepoChanged(event: any, onFanout?: (count: number) => void) {
    const states = selectGitLiveQueriesForRepoChange(
      [...this.states.values()], event, shouldRefreshLiveQuery,
    );
    onFanout?.(states.length);
    return this.refreshStates(states, `invalidation`, event.trace);
  }

  setRequiresRecovery(hostId: string, root: string, requiresRecovery: boolean) {
    const states = [...this.states.values()].filter((state) => {
      if (
        state.host.id !== hostId ||
        state.root !== root ||
        state.requiresRecovery === requiresRecovery
      )
        return false;
      state.requiresRecovery = requiresRecovery;
      return true;
    });
    this.refreshStates(
      states,
      `recovery`,
      this.dependencies.getActiveTrace() ?? undefined,
    );
  }

  recover(params: any) {
    const states = selectGitLiveQueriesForRecovery(
      [...this.states.values()], params,
    );
    const repositories = new Map<string, any>();
    for (const state of states)
      repositories.set(`${state.host.id}\0${state.root}`, state);
    for (const state of repositories.values())
      this.dependencies.prepareRecovery(state.root, state.host);
    return this.refreshStates(
      states,
      `recovery`,
      this.dependencies.getActiveTrace() ?? undefined,
    );
  }

  refreshRepository(hostId: string, root: string) {
    return this.refreshStates(
      selectGitLiveQueriesForRepository([...this.states.values()], hostId, root),
      `mutation`,
      this.dependencies.getActiveTrace() ?? undefined,
    );
  }

  refreshStates(states: any[], trigger: string, trace: any) {
    const waiters = planGitLiveQueryRefresh(states, trigger, trace, {
      nextGeneration: () => this.nextGeneration++,
      mergeTrace: mergeLiveQueryTrace,
    });
    states.forEach((state) => this.scheduleRefresh(state));
    return Promise.all(waiters).then(() => {});
  }

  scheduleRefresh(
    state: any,
    delayMs = state.host.isLocal
      ? this.dependencies.localRefreshDelayMs
      : 0,
  ) {
    scheduleGitLiveQueryRefresh(state, delayMs, {
      setTimeout: this.dependencies.setTimeout,
      refresh: () => this.refresh(state),
      isSubscribed: () => this.states.get(state.subscriptionId) === state,
    });
  }

  refresh(state: any) {
    return refreshGitLiveQuery(state, {
      runShared: (currentState, signal, trace, traceLinks, onTracked) =>
        this.runShared(currentState, signal, trace, traceLinks, onTracked),
      isCurrent: (currentState, generation) => this.isCurrent(currentState, generation),
      publish: (currentState, generation, result, trace) =>
        this.publish(currentState, generation, result, trace),
      emit: this.dependencies.emit,
      now: this.dependencies.now,
      scheduleRefresh: (currentState, delayMs) =>
        this.scheduleRefresh(currentState, delayMs),
      mergeTrace: mergeLiveQueryTrace,
      nextGeneration: () => this.nextGeneration++,
      errorRetryDelayMs: this.dependencies.errorRetryDelayMs,
      maxErrorRetries: this.dependencies.maxErrorRetries,
    });
  }

  runShared(
    state: any,
    signal: AbortSignal,
    trace: any,
    traceLinks: any[],
    onTracked: (result: any) => void,
  ) {
    return this.runCoordinator.run(state, signal, trace, traceLinks, onTracked);
  }

  isCurrent(state: any, generation: number) {
    return (
      this.states.get(state.subscriptionId) === state &&
      state.generation === generation
    );
  }

  publish(
    state: any,
    generation: number,
    result: any,
    trace: any,
  ) {
    this.dependencies.emit({
      type: `git-live-query-updated`,
      emittedAtMs: this.dependencies.now(),
      generation,
      requiresRecovery: state.requiresRecovery,
      subscriptionId: state.subscriptionId,
      ...(trace == null ? {} : { trace }),
      ...result,
    });
  }
}

export { GitLiveQueryRegistry };
if (typeof module !== `undefined`)
  module.exports = { GitLiveQueryRegistry };
