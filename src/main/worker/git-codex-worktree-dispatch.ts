type CodexWorktreeDispatchDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  listCodexWorktrees: (
    gitManager: any,
    host: any,
    worktreesRoot: string | null | undefined,
    signal: AbortSignal,
  ) => Promise<unknown>;
};

/**
 * Dispatch the read-only managed-worktree query without embedding its
 * host/root/signal plumbing in the worker request switch.
 */
async function dispatchCodexWorktreeRequest(
  method: string,
  params: any,
  deps: CodexWorktreeDispatchDependencies,
) {
  if (method !== `codex-worktrees`) return { handled: false, result: undefined };
  return {
    handled: true,
    result: {
      worktrees: await deps.listCodexWorktrees(
        deps.gitManager,
        deps.host,
        params.worktreesRoot,
        deps.signal,
      ),
    },
  };
}

export { dispatchCodexWorktreeRequest };
if (typeof module !== `undefined`)
  module.exports = { dispatchCodexWorktreeRequest };
