type GitRequestFinalizationDependencies = {
  request: any;
  tracked: boolean;
  host: any;
  refreshRoot: string | null;
  resolveInvalidationTarget: (request: any) => { type: string; cwd?: string } | null;
  invalidateUntrackedPaths: (cwd: string, host: any) => Promise<void>;
  invalidateUntrackedHost: (host: any) => void;
  isMutation: (method: string) => boolean;
  resolveMutationRoot: (request: any) => string | null;
  invalidateMutationCaches: (root: string, host: any) => Promise<void>;
  getStableMetadata: (cwd: string, host: any) => Promise<any>;
  invalidateRepositoryCaches: (repository: any) => void;
  refreshRepository: (hostId: string, root: string) => Promise<void>;
  getRepository: (root: string, host: any) => any;
  finishRequest: (id: string, tracked: boolean) => void;
};

/** Finalizes a Git request's cache invalidation, refresh fanout, and lifecycle bookkeeping. */
async function finalizeGitRequest(dependencies: GitRequestFinalizationDependencies): Promise<void> {
  const { request, tracked, host, refreshRoot, resolveInvalidationTarget, invalidateUntrackedPaths, invalidateUntrackedHost,
    isMutation, resolveMutationRoot, invalidateMutationCaches, getStableMetadata, invalidateRepositoryCaches,
    refreshRepository, getRepository, finishRequest } = dependencies;
  const target = resolveInvalidationTarget(request);
  if (target?.type === `exact`) await invalidateUntrackedPaths(target.cwd!, host);
  else if (target?.type === `host`) invalidateUntrackedHost(host);
  if (isMutation(request.method)) {
    const mutationRoot = resolveMutationRoot(request);
    if (mutationRoot != null) {
      try { await invalidateMutationCaches(mutationRoot, host); } catch {}
    }
  }
  if (refreshRoot != null) {
    try {
      const metadata = await getStableMetadata(refreshRoot, host);
      if (metadata != null) {
        invalidateRepositoryCaches(getRepository(metadata.root, host));
        await refreshRepository(host.id, metadata.root);
      }
    } catch {}
  }
  finishRequest(request.id, tracked);
}

export { finalizeGitRequest };
if (typeof module !== `undefined`) module.exports = { finalizeGitRequest };
