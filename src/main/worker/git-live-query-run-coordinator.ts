import {
  appendTraceLink,
} from "./git-live-query-policy";
import {
  getGitLiveQueryRepositoryKey,
  getGitLiveQuerySharedKey,
} from "./git-live-query-state";

type GitLiveQueryRunCoordinatorDependencies = {
  run: (...args: any[]) => Promise<any>;
  trace: <T>(options: any, operation: () => Promise<T>) => Promise<T>;
  createDeferred: () => any;
};

/** Coordinates repository-queued and shared live-query executions. */
class GitLiveQueryRunCoordinator {
  dependencies: GitLiveQueryRunCoordinatorDependencies;
  repositoryRuns = new Map<string, any>();
  sharedRuns = new Map<string, any>();

  constructor(dependencies: GitLiveQueryRunCoordinatorDependencies) {
    this.dependencies = dependencies;
  }

  run(
    state: any,
    signal: AbortSignal,
    trace: any,
    traceLinks: any[],
    onTracked: (result: any) => void,
  ) {
    const repositoryKey = getGitLiveQueryRepositoryKey(state);
    const sharedKey = getGitLiveQuerySharedKey(state);
    let shared = this.sharedRuns.get(sharedKey);
    if (shared == null || shared.abortController.signal.aborted) {
      shared = {
        abortController: new AbortController(),
        consumers: new Set(),
        result: this.dependencies.createDeferred(),
        trackedResult: null,
        trace,
      };
      this.sharedRuns.set(sharedKey, shared);
      const currentShared = shared;
      const repositoryRun = this.repositoryRuns.get(repositoryKey);
      const completion = (
        repositoryRun == null
          ? Promise.resolve()
          : this.dependencies.trace(
              {
                attributes: {
                  "git.operation": state.query.method,
                  "git.trigger": state.trigger,
                  "worker.id": `git`,
                  "worker.method": `subscribe-live-query`,
                },
                links:
                  repositoryRun.trace == null ? [] : [repositoryRun.trace],
                name: `git.repository_queue_wait`,
                op: `codex.git.repository_queue_wait`,
                trace,
              },
              () => repositoryRun.completion,
            )
      )
        .then(async () => {
          if (currentShared.abortController.signal.aborted) {
            currentShared.result.reject(
              currentShared.abortController.signal.reason,
            );
            return;
          }
          try {
            currentShared.result.resolve(
              await this.dependencies.run(
                state.query,
                state.root,
                state.host,
                currentShared.abortController.signal,
                (result: any) => {
                  currentShared.trackedResult = result;
                  currentShared.consumers.forEach((consumer: any) =>
                    consumer(result),
                  );
                },
                state.trigger,
                state.commonDir,
                trace,
                traceLinks,
                state.errorRetryCount,
              ),
            );
          } catch (error) {
            currentShared.result.reject(error);
          }
        })
        .finally(() => {
          if (this.sharedRuns.get(sharedKey) === currentShared)
            this.sharedRuns.delete(sharedKey);
          if (
            this.repositoryRuns.get(repositoryKey)?.completion === completion
          )
            this.repositoryRuns.delete(repositoryKey);
        });
      this.repositoryRuns.set(repositoryKey, { completion, trace });
    }

    shared.consumers.add(onTracked);
    if (shared.trackedResult != null) onTracked(shared.trackedResult);
    const abort = () => {
      shared.consumers.delete(onTracked);
      if (shared.consumers.size === 0)
        shared.abortController.abort(signal.reason);
    };
    signal.addEventListener(`abort`, abort, { once: true });
    if (signal.aborted) abort();
    const result = shared.result.promise.finally(() => {
      signal.removeEventListener(`abort`, abort);
      shared.consumers.delete(onTracked);
    });
    if (
      trace == null ||
      (shared.trace?.traceparent === trace.traceparent &&
        traceLinks.length === 0)
    )
      return result;
    const links: any[] = [];
    if (
      shared.trace != null &&
      shared.trace.traceparent !== trace.traceparent
    )
      appendTraceLink(links, shared.trace);
    traceLinks.forEach((link) => appendTraceLink(links, link));
    return this.dependencies.trace(
      {
        attributes: {
          "git.operation": state.query.method,
          "git.shared": true,
          "worker.id": `git`,
          "worker.method": `subscribe-live-query`,
        },
        links,
        name: `git.shared_query_wait`,
        op: `codex.git.shared_query_wait`,
        trace,
      },
      () => result,
    );
  }
}

export { GitLiveQueryRunCoordinator };
if (typeof module !== `undefined`)
  module.exports = { GitLiveQueryRunCoordinator };
