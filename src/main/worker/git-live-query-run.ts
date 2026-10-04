import { appendTraceLink } from "./git-live-query-policy";
import {
  getGitLiveQueryRepositoryKey,
  getGitLiveQuerySharedKey,
} from "./git-live-query-state";

type GitLiveQueryRunDependencies = {
  run: (...args: any[]) => Promise<any>;
  trace: <T>(options: any, operation: () => Promise<T>) => Promise<T>;
  createDeferred: () => any;
};

/**
 * Attach one subscription to the repository-queued/shared live-query run.
 *
 * The maps are supplied by the coordinator so this function owns only the
 * execution and consumer lifecycle, while the coordinator remains the state
 * owner.  Keeping this boundary explicit makes abort, replay and trace-link
 * behavior independently testable without constructing the registry.
 */
function runGitLiveQuery(
  state: any,
  signal: AbortSignal,
  trace: any,
  traceLinks: any[],
  onTracked: (result: any) => void,
  dependencies: GitLiveQueryRunDependencies,
  repositoryRuns: Map<string, any>,
  sharedRuns: Map<string, any>,
) {
  const repositoryKey = getGitLiveQueryRepositoryKey(state);
  const sharedKey = getGitLiveQuerySharedKey(state);
  let shared = sharedRuns.get(sharedKey);
  if (shared == null || shared.abortController.signal.aborted) {
    shared = {
      abortController: new AbortController(),
      consumers: new Set(),
      result: dependencies.createDeferred(),
      trackedResult: null,
      trace,
    };
    sharedRuns.set(sharedKey, shared);
    const currentShared = shared;
    const repositoryRun = repositoryRuns.get(repositoryKey);
    const completion = (
      repositoryRun == null
        ? Promise.resolve()
        : dependencies.trace(
            {
              attributes: {
                "git.operation": state.query.method,
                "git.trigger": state.trigger,
                "worker.id": `git`,
                "worker.method": `subscribe-live-query`,
              },
              links: repositoryRun.trace == null ? [] : [repositoryRun.trace],
              name: `git.repository_queue_wait`,
              op: `codex.git.repository_queue_wait`,
              trace,
            },
            () => repositoryRun.completion,
          )
    )
      .then(async () => {
        if (currentShared.abortController.signal.aborted) {
          currentShared.result.reject(currentShared.abortController.signal.reason);
          return;
        }
        try {
          currentShared.result.resolve(
            await dependencies.run(
              state.query,
              state.root,
              state.host,
              currentShared.abortController.signal,
              (result: any) => {
                currentShared.trackedResult = result;
                currentShared.consumers.forEach((consumer: any) => consumer(result));
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
        if (sharedRuns.get(sharedKey) === currentShared) sharedRuns.delete(sharedKey);
        if (repositoryRuns.get(repositoryKey)?.completion === completion)
          repositoryRuns.delete(repositoryKey);
      });
    repositoryRuns.set(repositoryKey, { completion, trace });
  }

  shared.consumers.add(onTracked);
  if (shared.trackedResult != null) onTracked(shared.trackedResult);
  const abort = () => {
    shared.consumers.delete(onTracked);
    if (shared.consumers.size === 0) shared.abortController.abort(signal.reason);
  };
  signal.addEventListener(`abort`, abort, { once: true });
  if (signal.aborted) abort();
  const result = shared.result.promise.finally(() => {
    signal.removeEventListener(`abort`, abort);
    shared.consumers.delete(onTracked);
  });
  if (
    trace == null ||
    (shared.trace?.traceparent === trace.traceparent && traceLinks.length === 0)
  ) return result;
  const links: any[] = [];
  if (shared.trace != null && shared.trace.traceparent !== trace.traceparent)
    appendTraceLink(links, shared.trace);
  traceLinks.forEach((link) => appendTraceLink(links, link));
  return dependencies.trace(
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

export { runGitLiveQuery };
if (typeof module !== `undefined`) module.exports = { runGitLiveQuery };
