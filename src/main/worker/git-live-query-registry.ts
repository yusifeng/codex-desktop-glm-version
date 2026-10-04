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
import { createGitLiveQueryUpdatedEvent } from "./git-live-query-events";
import {
  handleGitLiveQueryRepoChanged,
  recoverGitLiveQueries,
  refreshGitLiveQueryRepository,
  setGitLiveQueryRecovery,
} from "./git-live-query-registry-refresh";

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
    return handleGitLiveQueryRepoChanged(this, event, onFanout);
  }

  setRequiresRecovery(hostId: string, root: string, requiresRecovery: boolean) {
    return setGitLiveQueryRecovery(this, hostId, root, requiresRecovery);
  }

  recover(params: any) {
    return recoverGitLiveQueries(this, params);
  }

  refreshRepository(hostId: string, root: string) {
    return refreshGitLiveQueryRepository(this, hostId, root);
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
    this.dependencies.emit(createGitLiveQueryUpdatedEvent(
      state,
      generation,
      result,
      this.dependencies.now(),
      trace,
    ));
  }
}

export { GitLiveQueryRegistry };
if (typeof module !== `undefined`)
  module.exports = { GitLiveQueryRegistry };
