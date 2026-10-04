type WorktreeMutationMethod =
  | `restore-worktree`
  | `delete-worktree`
  | `cancel-worktree-upstream-refresh`
  | `move-thread-to-local`
  | `move-thread-to-worktree`
  | `move-thread-to-host-worktree`
  | `cleanup-host-handoff-transfer`;

/**
 * Classifies the worktree mutation methods handled by the dedicated request
 * boundary. Keeping this table separate makes the protocol surface explicit
 * without pulling operation side effects into the dispatcher.
 */
function getWorktreeMutationMethod(method: string): WorktreeMutationMethod | null {
  switch (method) {
    case `restore-worktree`:
    case `delete-worktree`:
    case `cancel-worktree-upstream-refresh`:
    case `move-thread-to-local`:
    case `move-thread-to-worktree`:
    case `move-thread-to-host-worktree`:
    case `cleanup-host-handoff-transfer`:
      return method;
    default:
      return null;
  }
}

export { getWorktreeMutationMethod };
if (typeof module !== `undefined`) module.exports = { getWorktreeMutationMethod };
