import {
  mergeLiveQueryTrace,
  shouldRefreshLiveQuery,
} from "./git-live-query-policy";
import {
  createGitLiveQueryState,
  getGitLiveQueryBranchDependencyKey,
} from "./git-live-query-state";
import { GitLiveQueryRunCoordinator } from "./git-live-query-run-coordinator";

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
    if (state.refreshTimer != null)
      this.dependencies.clearTimeout(state.refreshTimer);
    state.abortController?.abort();
    state.refreshWaiters.forEach((resolve: () => void) => resolve());
    this.updateLocalBranchDependency(state, -1);
    this.states.delete(subscriptionId);
  }

  hasLocalBranchDependency(params: any) {
    return this.localBranchDependencies.has(getGitLiveQueryBranchDependencyKey(params));
  }

  updateLocalBranchDependency(state: any, delta: number) {
    let baseBranch;
    if (state.query.method === `review-summary`) {
      if (state.query.params.source !== `branch`) return;
      baseBranch = state.query.params.baseBranch;
    } else if (
      state.query.method === `branch-diff-stats` ||
      state.query.method === `branch-commits`
    )
      baseBranch = state.query.params.baseBranch;
    else return;
    const trimmed = baseBranch?.trim();
    if (!trimmed) return;
    const branch = trimmed.startsWith(`refs/heads/`)
      ? trimmed.slice(11)
      : trimmed;
    const key = getGitLiveQueryBranchDependencyKey({
      hostId: state.host.id,
      commonDir: state.commonDir,
      root: state.root,
      branch,
    });
    const count = (this.localBranchDependencies.get(key) ?? 0) + delta;
    if (count === 0) this.localBranchDependencies.delete(key);
    else this.localBranchDependencies.set(key, count);
  }

  handleRepoChanged(event: any, onFanout?: (count: number) => void) {
    const states = [...this.states.values()].filter(
      (state) =>
        state.host.id === event.hostId &&
        state.commonDir === event.commonDir &&
        state.root === event.root &&
        shouldRefreshLiveQuery(state.query, event.changeType),
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
    const subscriptionIds = new Set(params.subscriptionIds);
    const states = [...this.states.values()].filter(
      (state) =>
        subscriptionIds.has(state.subscriptionId) &&
        state.host.id === params.hostId &&
        (params.root == null || state.root === params.root) &&
        state.requiresRecovery,
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
      [...this.states.values()].filter(
        (state) => state.host.id === hostId && state.root === root,
      ),
      `mutation`,
      this.dependencies.getActiveTrace() ?? undefined,
    );
  }

  refreshStates(states: any[], trigger: string, trace: any) {
    const waiters = states.map((state) => {
      state.generation = this.nextGeneration++;
      state.dirty = true;
      state.errorRetryCount = 0;
      state.trigger = trigger;
      mergeLiveQueryTrace(state, trace);
      const waiter = new Promise<void>((resolve) =>
        state.refreshWaiters.push(resolve),
      );
      this.scheduleRefresh(state);
      return waiter;
    });
    return Promise.all(waiters).then(() => {});
  }

  scheduleRefresh(
    state: any,
    delayMs = state.host.isLocal
      ? this.dependencies.localRefreshDelayMs
      : 0,
  ) {
    if (state.inFlight != null || state.refreshTimer != null) return;
    if (delayMs === 0) {
      this.refresh(state);
      return;
    }
    state.refreshTimer = this.dependencies.setTimeout(() => {
      state.refreshTimer = null;
      if (this.states.get(state.subscriptionId) === state)
        this.refresh(state);
    }, delayMs);
  }

  refresh(state: any) {
    if (state.inFlight != null || !state.dirty) return;
    const generation = state.generation;
    const abortController = new AbortController();
    let retryDelayMs = null;
    const trace = state.trace;
    const traceLinks = state.traceLinks;
    state.trace = undefined;
    state.traceLinks = [];
    state.abortController = abortController;
    state.dirty = false;
    state.inFlight = Promise.resolve()
      .then(() =>
        this.runShared(
          state,
          abortController.signal,
          trace,
          traceLinks,
          (result) => {
            if (this.isCurrent(state, generation))
              this.publish(
                state,
                generation,
                { ...result, phase: `tracked` },
                trace,
              );
          },
        ),
      )
      .then((result) => {
        if (!this.isCurrent(state, generation)) return;
        this.publish(
          state,
          generation,
          { ...result, phase: `complete` },
          trace,
        );
        const shouldRetry =
          (result.method === `review-summary` ||
            result.method === `status-summary`) &&
          result.result.type === `error`;
        if (
          shouldRetry &&
          state.errorRetryCount < this.dependencies.maxErrorRetries
        ) {
          state.errorRetryCount += 1;
          state.dirty = true;
          mergeLiveQueryTrace(state, trace);
          traceLinks.forEach((link: any) =>
            mergeLiveQueryTrace(state, link),
          );
          retryDelayMs = this.dependencies.errorRetryDelayMs;
        } else if (!shouldRetry) state.errorRetryCount = 0;
      })
      .catch(() => {
        if (this.isCurrent(state, generation))
          this.dependencies.emit({
            type: `git-live-query-failed`,
            emittedAtMs: this.dependencies.now(),
            generation,
            method: state.query.method,
            subscriptionId: state.subscriptionId,
            ...(trace == null ? {} : { trace }),
          });
      })
      .finally(() => {
        if (this.states.get(state.subscriptionId) !== state) return;
        state.abortController = null;
        state.inFlight = null;
        if (state.generation === generation) {
          const waiters = state.refreshWaiters;
          state.refreshWaiters = [];
          waiters.forEach((resolve: () => void) => resolve());
        }
        if (state.dirty) {
          if (retryDelayMs != null && state.generation === generation)
            state.generation = this.nextGeneration++;
          this.scheduleRefresh(state, retryDelayMs ?? undefined);
        }
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
