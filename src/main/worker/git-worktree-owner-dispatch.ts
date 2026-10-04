type WorktreeOwnerDispatchDependencies = {
  gitManager: {
    getWorktreeRepositoryForRoot: (root: string, host: any) => any;
  };
  host: any;
  signal: AbortSignal;
  setOwnerThread: (repository: any, conversationId: string, signal: AbortSignal) => Promise<void>;
};

/**
 * Dispatch the mutating owner-thread request at the worker boundary.
 * Repository lookup and thread-config writing remain injected so this module
 * owns only method selection and the success envelope.
 */
async function dispatchWorktreeOwnerRequest(
  method: string,
  params: any,
  deps: WorktreeOwnerDispatchDependencies,
) {
  if (method !== `set-worktree-owner-thread`) return { handled: false, result: undefined };
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(params.worktree, deps.host);
  await deps.setOwnerThread(repository, params.conversationId, deps.signal);
  return { handled: true, result: { success: true } };
}

export { dispatchWorktreeOwnerRequest };
if (typeof module !== `undefined`) module.exports = { dispatchWorktreeOwnerRequest };
