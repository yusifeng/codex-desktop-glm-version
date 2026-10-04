import {
  cancelWorktreeUpstreamRefresh,
  deleteWorktree,
  restoreWorktree,
} from "./git-worktree-request-handlers";
import {
  cleanupHostHandoffTransfer,
  moveThreadToHostWorktree,
  moveThreadToLocal,
  moveThreadToWorktree,
} from "./git-worktree-handoff-dispatch";
import { getWorktreeMutationMethod } from "./git-worktree-request-policy";

type WorktreeMutationDispatchDependencies = Parameters<typeof restoreWorktree>[1];

/**
 * Dispatches the worktree lifecycle and handoff mutations at one protocol
 * boundary. The request handlers retain the operation semantics; this module
 * owns only method selection and request-id forwarding for progress events.
 */
async function dispatchWorktreeMutationRequest(
  method: string,
  params: any,
  requestId: string | number,
  deps: WorktreeMutationDispatchDependencies,
) {
  switch (getWorktreeMutationMethod(method)) {
    case `restore-worktree`:
      return { handled: true, result: await restoreWorktree(params, deps), wrapped: true };
    case `delete-worktree`:
      return { handled: true, result: await deleteWorktree(params, deps), wrapped: true };
    case `cancel-worktree-upstream-refresh`:
      return { handled: true, result: cancelWorktreeUpstreamRefresh(params, deps), wrapped: true };
    case `move-thread-to-local`:
      return { handled: true, result: await moveThreadToLocal(params, requestId, deps), wrapped: false };
    case `move-thread-to-worktree`:
      return { handled: true, result: await moveThreadToWorktree(params, requestId, deps), wrapped: false };
    case `move-thread-to-host-worktree`:
      return { handled: true, result: await moveThreadToHostWorktree(params, requestId, deps), wrapped: false };
    case `cleanup-host-handoff-transfer`:
      return { handled: true, result: await cleanupHostHandoffTransfer(params, deps), wrapped: true };
    default:
      return { handled: false, result: undefined, wrapped: false };
  }
}

export { dispatchWorktreeMutationRequest };
if (typeof module !== `undefined`)
  module.exports = { dispatchWorktreeMutationRequest };
