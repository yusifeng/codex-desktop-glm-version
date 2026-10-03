type HandoffRollbackDependencies = {
  checkoutBranch: (params: any, gitManager: any, host: any) => Promise<any>;
  applyStash: (params: any, host: any) => Promise<any>;
  removeWorktree: (worktreeRoot: string, host: any, force: boolean) => Promise<any>;
};

async function restoreHandoffBranchAndStash(params: any, deps: HandoffRollbackDependencies) {
  const errors = [];
  if (params.branch == null) {
    errors.push(params.restoreBranchError);
    return errors;
  }
  const checkout = await deps.checkoutBranch(
    { cwd: params.cwd, branch: params.branch, stashUncommitted: false },
    params.gitManager,
    params.host,
  );
  if (checkout.status === `error`) errors.push(params.restoreBranchError);
  if (params.stashRef != null) {
    const stash = await deps.applyStash(
      { cwd: params.cwd, stashRef: params.stashRef, mode: `pop` },
      params.host,
    );
    if (stash.status === `error`) errors.push(params.restoreStashError);
  }
  return errors;
}

async function restoreHandoffSource(params: any, deps: HandoffRollbackDependencies) {
  if (params.branch != null) {
    return restoreHandoffBranchAndStash(
      {
        ...params,
        restoreBranchError: `restore-source-branch-failed`,
        restoreStashError: `restore-source-stash-failed`,
      },
      deps,
    );
  }
  if (params.stashRef == null) return [];
  const stash = await deps.applyStash(
    { cwd: params.cwd, stashRef: params.stashRef, mode: `pop` },
    params.host,
  );
  return stash.status === `error` ? [`restore-source-stash-failed`] : [];
}

async function restoreCheckoutBranch(params: any, deps: HandoffRollbackDependencies) {
  if (params.branch == null) return;
  await deps.checkoutBranch(
    { cwd: params.cwd, branch: params.branch, stashUncommitted: false },
    params.gitManager,
    params.host,
  ).catch(() => undefined);
}

async function rollbackHostHandoffWorktree(params: any, deps: HandoffRollbackDependencies) {
  if (params.createdWorktree) {
    await deps.removeWorktree(params.worktreeGitRoot, params.host, true).catch(() => undefined);
    await restoreCheckoutBranch(
      {
        branch: params.destinationCheckoutPreviousBranch,
        cwd: params.destinationCheckoutGitRoot,
        gitManager: params.gitManager,
        host: params.host,
      },
      deps,
    );
    return;
  }
  if (params.reusedWorktreePreviousCheckout != null) {
    await deps.checkoutBranch(
      {
        cwd: params.worktreeWorkspaceRoot,
        branch: params.reusedWorktreePreviousCheckout,
        stashUncommitted: false,
      },
      params.gitManager,
      params.host,
    );
  }
  if (params.reusedWorktreeStashRef != null) {
    await deps.applyStash(
      {
        cwd: params.worktreeWorkspaceRoot,
        stashRef: params.reusedWorktreeStashRef,
        mode: `pop`,
      },
      params.host,
    );
  }
  await restoreCheckoutBranch(
    {
      branch: params.destinationCheckoutPreviousBranch,
      cwd: params.destinationCheckoutGitRoot,
      gitManager: params.gitManager,
      host: params.host,
    },
    deps,
  );
}

export {
  restoreHandoffBranchAndStash,
  restoreHandoffSource,
  rollbackHostHandoffWorktree,
};
if (typeof module !== `undefined`) module.exports = {
  restoreHandoffBranchAndStash,
  restoreHandoffSource,
  rollbackHostHandoffWorktree,
};
