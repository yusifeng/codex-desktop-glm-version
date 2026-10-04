import { createWorktreeRequest } from "./git-worktree-create-request";

type WorktreeCreateDispatchDependencies = Parameters<typeof createWorktreeRequest>[1];

/** Select the worktree creation request at the worker protocol boundary. */
async function dispatchWorktreeCreateRequest(
  method: string,
  params: any,
  deps: WorktreeCreateDispatchDependencies,
) {
  if (method !== `create-worktree`)
    return { handled: false, result: undefined };
  return {
    handled: true,
    result: await createWorktreeRequest(params, deps),
  };
}

export { dispatchWorktreeCreateRequest };
if (typeof module !== `undefined`)
  module.exports = { dispatchWorktreeCreateRequest };
