/** Branch dependency bookkeeping shared by Git live-query subscriptions. */

type GitLiveQueryBranchDependencyState = {
  host: { id: string };
  commonDir: string;
  root: string;
  query: { method: string; params?: { source?: string; baseBranch?: string } };
};

type GitLiveQueryBranchDependency = {
  hostId: string;
  commonDir: string;
  root: string;
  branch: string;
};

function getGitLiveQueryBranchDependency(
  state: GitLiveQueryBranchDependencyState,
): GitLiveQueryBranchDependency | null {
  let baseBranch: string | undefined;
  if (state.query.method === `review-summary`) {
    if (state.query.params?.source !== `branch`) return null;
    baseBranch = state.query.params.baseBranch;
  } else if (
    state.query.method === `branch-diff-stats` ||
    state.query.method === `branch-commits`
  ) {
    baseBranch = state.query.params?.baseBranch;
  } else return null;

  const trimmed = baseBranch?.trim();
  if (!trimmed) return null;
  return {
    hostId: state.host.id,
    commonDir: state.commonDir,
    root: state.root,
    branch: trimmed.startsWith(`refs/heads/`)
      ? trimmed.slice(`refs/heads/`.length)
      : trimmed,
  };
}

function updateGitLiveQueryBranchDependency(
  dependencies: Map<string, number>,
  state: GitLiveQueryBranchDependencyState,
  delta: number,
  getKey: (params: GitLiveQueryBranchDependency) => string,
): void {
  const dependency = getGitLiveQueryBranchDependency(state);
  if (dependency == null) return;
  const key = getKey(dependency);
  const count = (dependencies.get(key) ?? 0) + delta;
  if (count === 0) dependencies.delete(key);
  else dependencies.set(key, count);
}

export {
  getGitLiveQueryBranchDependency,
  updateGitLiveQueryBranchDependency,
};
if (typeof module !== `undefined`)
  module.exports = {
    getGitLiveQueryBranchDependency,
    updateGitLiveQueryBranchDependency,
  };
