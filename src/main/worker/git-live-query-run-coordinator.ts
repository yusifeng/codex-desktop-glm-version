import { runGitLiveQuery } from "./git-live-query-run";

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
    return runGitLiveQuery(
      state,
      signal,
      trace,
      traceLinks,
      onTracked,
      this.dependencies,
      this.repositoryRuns,
      this.sharedRuns,
    );
  }
}

export { GitLiveQueryRunCoordinator };
if (typeof module !== `undefined`)
  module.exports = { GitLiveQueryRunCoordinator };
