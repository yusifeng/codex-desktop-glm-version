type HostHandoffValidation = { status: `error`; error: `invalid-params`; message: string } | null;

/** Validate the path/branch contract before starting a cross-host transfer. */
function validateHostHandoffParams(params: any): HostHandoffValidation {
  if (typeof params?.sourceRolloutPath !== `string` || params.sourceRolloutPath.trim().length === 0)
    return { status: `error`, error: `invalid-params`, message: `Missing source rollout path` };
  if (typeof params?.sourceBranch !== `string` || params.sourceBranch.trim().length === 0)
    return { status: `error`, error: `invalid-params`, message: `Missing source branch` };
  if ((params.destinationWorktreeGitRoot == null) !== (params.destinationWorktreeWorkspaceRoot == null))
    return {
      status: `error`,
      error: `invalid-params`,
      message: `Destination worktree roots must be provided together`,
    };
  return null;
}

export { validateHostHandoffParams };

if (typeof module !== `undefined`) module.exports = { validateHostHandoffParams };
