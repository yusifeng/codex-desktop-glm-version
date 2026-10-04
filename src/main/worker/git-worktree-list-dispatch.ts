type WorktreeListDispatchDependencies = {
  listWorktrees: (cwd: string, host: any, signal: AbortSignal) => Promise<unknown>;
  host: any;
  signal: AbortSignal;
};

async function dispatchWorktreeListRequest(
  method: string,
  params: any,
  deps: WorktreeListDispatchDependencies,
) {
  if (method !== `list-worktrees`) return { handled: false, result: undefined };
  return {
    handled: true,
    result: await deps.listWorktrees(params.cwd, deps.host, deps.signal),
  };
}

export { dispatchWorktreeListRequest };
if (typeof module !== `undefined`)
  module.exports = { dispatchWorktreeListRequest };
