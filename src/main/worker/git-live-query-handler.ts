type GitLiveQueryHandlerDependencies = {
  gitManager: any;
  getWorktreeRepositoryForRoot: (root: string, host: any) => any;
  getWatch: (root: string, host: any) => any;
  getStatusSummary: (repository: any, includeUntracked: boolean, options: any, signal: AbortSignal) => Promise<any>;
  getReviewSummary: (params: any) => Promise<any>;
  getBranchDiffStats: (...args: any[]) => Promise<any>;
  getRecentBranches: (repository: any, limit: number, signal: AbortSignal, options: any) => Promise<string[]>;
  getCurrentBranch: (root: string, host: any) => Promise<any>;
  getUpstreamBranch: (root: string, args: { host: any; signal: AbortSignal }) => Promise<any>;
  getBranchAheadCount: (root: string, args: { host: any; signal: AbortSignal }) => Promise<any>;
  getDefaultBranch: (root: string, host: any, signal: AbortSignal, options?: { live?: boolean }) => Promise<any>;
  getBaseBranch: (root: string, host: any) => Promise<any>;
  getBranchCommits: (repository: any, baseBranch: string, signal: AbortSignal) => Promise<any[]>;
  resolveWorktreeList: (cwd: string, host: any, signal: AbortSignal) => Promise<any>;
  getMaxUntrackedFiles: (source: any) => number;
  runWithUntracked: (without: () => Promise<any>, withUntracked: () => Promise<any>, emit: (result: any) => void) => Promise<any>;
};

async function handleGitLiveQuery(
  query: any,
  root: string,
  host: any,
  signal: AbortSignal,
  emitIntermediate: (result: any) => void,
  deps: GitLiveQueryHandlerDependencies,
) {
  switch (query.method) {
    case `status-summary`: {
      const repository = deps.getWorktreeRepositoryForRoot(root, host);
      if (!query.params.includeUntrackedFiles)
        return { method: `status-summary`, result: await deps.getStatusSummary(repository, false, undefined, signal) };
      const tracked = await deps.getStatusSummary(repository, false, undefined, signal);
      emitIntermediate({ method: `status-summary`, result: tracked });
      return tracked.type === `error`
        ? { method: `status-summary`, result: tracked }
        : { method: `status-summary`, result: await deps.getStatusSummary(repository, true, undefined, signal) };
    }
    case `review-summary`: {
      const repository = deps.getWorktreeRepositoryForRoot(root, host);
      const maxUntrackedFiles = deps.getMaxUntrackedFiles(query.params.operationSource);
      let trackedResult: any = null;
      if (
        query.params.includeUntrackedFiles !== false &&
        (query.params.source === `branch` || query.params.source === `uncommitted` || query.params.source === `unstaged`)
      ) {
        trackedResult = await deps.getReviewSummary({ ...query.params, includeUntrackedFiles: false, maxUntrackedFiles, worktreeRepo: repository });
        if (trackedResult.type === `success` && trackedResult.files.length > 0)
          emitIntermediate({ method: `review-summary`, result: trackedResult });
        if (trackedResult.type !== `success`) return { method: `review-summary`, result: trackedResult };
        const complete = await deps.getReviewSummary({ ...query.params, maxUntrackedFiles, worktreeRepo: repository });
        return { method: `review-summary`, result: complete.type === `error` && trackedResult != null ? trackedResult : complete };
      }
      return { method: `review-summary`, result: await deps.getReviewSummary({ ...query.params, maxUntrackedFiles, worktreeRepo: repository }) };
    }
    case `branch-diff-stats`: {
      const maxUntrackedFiles = deps.getMaxUntrackedFiles(query.params.operationSource);
      const run = (includeUntrackedFiles: boolean) => deps.getBranchDiffStats(query.params.cwd, deps.gitManager, host, query.params.baseBranch, query.params.hideWhitespace, includeUntrackedFiles, maxUntrackedFiles);
      return query.params.includeUntrackedFiles
        ? { method: `branch-diff-stats`, result: await deps.runWithUntracked(() => run(false), () => run(true), (result) => emitIntermediate({ method: `branch-diff-stats`, result })) }
        : { method: `branch-diff-stats`, result: await run(query.params.includeUntrackedFiles) };
    }
    case `recent-branches`: {
      const limit = Math.max(1, Math.min(query.params.limit ?? 10, 100));
      const repository = deps.getWorktreeRepositoryForRoot(root, host);
      const watch = deps.getWatch(root, host);
      return { method: `recent-branches`, result: { branches: await deps.getRecentBranches(repository, limit, signal, getLiveQueryWatchOptions(watch)) } };
    }
    case `current-branch`: return { method: `current-branch`, result: await deps.getCurrentBranch(query.params.root, host) };
    case `upstream-branch`: return { method: `upstream-branch`, result: await deps.getUpstreamBranch(query.params.root, { host, signal }) };
    case `branch-ahead-count`: return { method: `branch-ahead-count`, result: await deps.getBranchAheadCount(query.params.root, { host, signal }) };
    case `default-branch`: {
      const watch = deps.getWatch(root, host);
      return { method: `default-branch`, result: await deps.getDefaultBranch(query.params.root, host, signal, getLiveQueryWatchOptions(watch)) };
    }
    case `base-branch`: return { method: `base-branch`, result: await deps.getBaseBranch(query.params.root, host) };
    case `branch-commits`: return { method: `branch-commits`, result: { commits: await deps.getBranchCommits(deps.getWorktreeRepositoryForRoot(root, host), query.params.baseBranch, signal) } };
    case `list-worktrees`: return { method: `list-worktrees`, result: await deps.resolveWorktreeList(query.params.cwd, host, signal) };
    default: return undefined;
  }
}

export { handleGitLiveQuery };
if (typeof module !== `undefined`) module.exports = { handleGitLiveQuery };
import { getLiveQueryWatchOptions } from "./git-live-query-watch-options";
