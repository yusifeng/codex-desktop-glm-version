/** Dispatch the read-only worktree resolution request while keeping its
 * repository and filesystem dependencies at the worker boundary. */
export async function dispatchWorktreeResolutionRequest(
  method: string,
  params: any,
  deps: { resolveWorktreeForThread: (params: any) => Promise<unknown> },
): Promise<{ handled: boolean; result: unknown }> {
  if (method !== `resolve-worktree-for-thread`) return { handled: false, result: undefined };
  return { handled: true, result: await deps.resolveWorktreeForThread(params) };
}

if (typeof module !== `undefined`) module.exports = { dispatchWorktreeResolutionRequest };
