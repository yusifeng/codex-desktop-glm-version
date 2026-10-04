type MoveToWorktreeValidation =
  | { error: { status: `error`; error: string; message: string; rollbackErrors: string[]; warnings: string[] } }
  | { worktreeCheckoutBranch: string; warnings: string[] };

/**
 * Validate the branch selection before move-to-worktree starts mutating either
 * checkout. Keeping this gate pure makes the destructive operation's entry
 * contract explicit and keeps progress/rollback code focused on I/O.
 */
function validateMoveToWorktreeParams(params: any): MoveToWorktreeValidation {
  const warnings: string[] = [];
  if (params.sourceBranch.trim().length === 0) {
    return {
      error: {
        status: `error`,
        error: `invalid-params`,
        message: `Missing source branch`,
        rollbackErrors: [],
        warnings,
      },
    };
  }
  const worktreeCheckoutBranch = (
    params.worktreeCheckoutBranch ?? params.sourceBranch
  ).trim();
  if (worktreeCheckoutBranch.length === 0) {
    return {
      error: {
        status: `error`,
        error: `invalid-params`,
        message: `Missing worktree checkout branch`,
        rollbackErrors: [],
        warnings,
      },
    };
  }
  if (
    params.defaultBranch != null &&
    params.defaultBranch === worktreeCheckoutBranch
  ) {
    return {
      error: {
        status: `error`,
        error: `default-branch-blocked`,
        message: `Move to worktree is not available on the default branch`,
        rollbackErrors: [],
        warnings,
      },
    };
  }
  return { worktreeCheckoutBranch, warnings };
}

export { validateMoveToWorktreeParams };
if (typeof module !== `undefined`)
  module.exports = { validateMoveToWorktreeParams };
