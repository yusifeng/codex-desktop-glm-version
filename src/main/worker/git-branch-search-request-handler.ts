type BranchSearchRequestDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  searchBranches: (params: any) => Promise<any>;
};

/** Resolve the worker's `search-branches` request against the host-scoped worktree. */
async function resolveBranchSearchRequest(
  params: { root: string; query: string; limit?: number; preserveRemoteRefs?: boolean },
  deps: BranchSearchRequestDependencies,
) {
  return deps.searchBranches({
    worktreeRepo: deps.gitManager.getWorktreeRepositoryForRoot(params.root, deps.host),
    query: params.query,
    limit: params.limit ?? 20,
    preserveRemoteRefs: params.preserveRemoteRefs,
    signal: deps.signal,
  });
}

export { resolveBranchSearchRequest };
if (typeof module !== `undefined`) module.exports = { resolveBranchSearchRequest };
