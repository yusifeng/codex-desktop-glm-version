type MoveToWorktreeDependencies = {
  getCurrentBranch: (repository: any) => Promise<string | null>;
  checkoutBranch: (
    params: any,
    gitManager: any,
    host: any,
    options?: any,
  ) => Promise<any>;
  applyStash: (params: any, host: any) => Promise<any>;
  restoreBranchAndStash: (params: any) => Promise<string[]>;
  removeWorktree: (
    root: string,
    host: any,
    force: boolean,
    signal: AbortSignal,
  ) => Promise<any>;
};

function ok(value: any) {
  return { type: `ok`, value };
}

async function moveThreadToWorktree(
  params: any,
  { host, gitManager, signal, onProgress }: any,
  deps: MoveToWorktreeDependencies,
) {
  const validation = validateMoveToWorktreeParams(params);
  if (`error` in validation) return ok(validation.error);
  const { worktreeCheckoutBranch, warnings } = validation;

  let sourceStashRef = null;
  let targetStashRef = null;
  let localPreviousBranch = null;
  let localCheckoutCompleted = false;
  let targetCheckoutCompleted = false;
  let sourceStashApplied = false;
  const restoreLocal = (stashRef: string | null) =>
    deps.restoreBranchAndStash({
      cwd: params.localCwd,
      branch: localPreviousBranch,
      stashRef,
      restoreBranchError: `restore-local-branch-failed`,
      restoreStashError: `restore-local-stash-failed`,
      gitManager,
      host,
    });
  const cleanupCreatedWorktree = async (errors: string[]) => {
    if (!params.createdWorktree) return;
    try {
      await deps.removeWorktree(params.worktreeGitRoot, host, true, signal);
    } catch {
      errors.push(`cleanup-created-worktree-failed`);
    }
  };

  try {
    const localRepository = await gitManager.getWorktreeRepository(
      params.localCwd,
      host,
    );
    if (localRepository == null)
      throw Error(`Unable to resolve move-to-worktree local repository`);
    localPreviousBranch = await deps.getCurrentBranch(localRepository);
    if (localPreviousBranch == null) {
      return ok({
        status: `error`,
        error: `local-not-on-branch`,
        message: `Local repository must be on a branch to move to a worktree`,
        rollbackErrors: [],
        warnings,
      });
    }

    if (localPreviousBranch === params.sourceBranch) {
      const sourceRequiresAlternateCheckout =
        (params.defaultBranch != null &&
          params.sourceBranch === params.defaultBranch) ||
        worktreeCheckoutBranch !== params.sourceBranch;
      const requestedLocalBranch = params.localCheckoutBranch?.trim() ?? ``;
      const localCheckoutBranch =
        requestedLocalBranch.length > 0
          ? requestedLocalBranch
          : sourceRequiresAlternateCheckout
            ? params.sourceBranch
            : null;
      if (localCheckoutBranch == null) {
        return ok({
          status: `error`,
          error: `invalid-params`,
          message: `Missing local checkout branch`,
          rollbackErrors: [],
          warnings,
        });
      }
      const localCheckout = await deps.checkoutBranch(
        {
          cwd: params.localCwd,
          branch: localCheckoutBranch,
          stashUncommitted: true,
        },
        gitManager,
        host,
        {
          onStashStatusChange: (status: any) =>
            onProgress?.(`stash-source-changes`, status),
          onCheckoutStatusChange: (status: any) =>
            onProgress?.(`checkout-local-branch`, status),
        },
      );
      if (localCheckout.status === `error`) {
        return ok({
          status: `error`,
          error: `checkout-local-failed`,
          message: localCheckout.error,
          rollbackErrors: [],
          warnings,
          execOutput: localCheckout.execOutput,
        });
      }
      sourceStashRef = localCheckout.stashRef;
      localCheckoutCompleted = true;
    } else {
      onProgress?.(`stash-source-changes`, `skipped`);
      onProgress?.(`checkout-local-branch`, `skipped`);
    }

    const targetCheckout = await deps.checkoutBranch(
      {
        cwd: params.worktreeWorkspaceRoot,
        branch: worktreeCheckoutBranch,
        stashUncommitted: params.stashTargetWorktree,
      },
      gitManager,
      host,
      {
        onStashStatusChange: params.stashTargetWorktree
          ? (status: any) =>
              onProgress?.(`stash-target-worktree-changes`, status)
          : undefined,
        onCheckoutStatusChange: (status: any) =>
          onProgress?.(`checkout-worktree-branch`, status),
      },
    );
    if (!params.stashTargetWorktree)
      onProgress?.(`stash-target-worktree-changes`, `skipped`);
    if (targetCheckout.status === `error`) {
      const rollbackErrors: string[] = [];
      if (localCheckoutCompleted)
        rollbackErrors.push(...(await restoreLocal(sourceStashRef)));
      await cleanupCreatedWorktree(rollbackErrors);
      return ok({
        status: `error`,
        error: `checkout-worktree-failed`,
        message: targetCheckout.error,
        rollbackErrors,
        warnings,
        execOutput: targetCheckout.execOutput,
      });
    }
    targetStashRef = targetCheckout.stashRef;
    targetCheckoutCompleted = true;
    if (targetStashRef != null)
      warnings.push(`stashed-target-worktree-changes`);

    if (sourceStashRef != null) {
      onProgress?.(`apply-changes-to-worktree`, `started`);
      const applied = await deps.applyStash(
        {
          cwd: params.worktreeWorkspaceRoot,
          stashRef: sourceStashRef,
          mode: `apply`,
        },
        host,
      );
      if (applied.status === `error`) {
        onProgress?.(`apply-changes-to-worktree`, `failed`);
        const rollbackErrors: string[] = [];
        if (targetStashRef != null) {
          const restoredTarget = await deps.applyStash(
            {
              cwd: params.worktreeWorkspaceRoot,
              stashRef: targetStashRef,
              mode: `pop`,
            },
            host,
          );
          if (restoredTarget.status === `error`)
            rollbackErrors.push(`restore-target-stash-failed`);
        }
        if (localCheckoutCompleted)
          rollbackErrors.push(...(await restoreLocal(sourceStashRef)));
        await cleanupCreatedWorktree(rollbackErrors);
        return ok({
          status: `error`,
          error: `apply-source-stash-failed`,
          message: applied.error,
          rollbackErrors,
          warnings,
          execOutput: applied.execOutput,
        });
      }
      onProgress?.(`apply-changes-to-worktree`, `completed`);
      sourceStashApplied = true;
    } else {
      onProgress?.(`apply-changes-to-worktree`, `skipped`);
    }

    if (targetStashRef != null) {
      const dropped = await deps.applyStash(
        {
          cwd: params.worktreeWorkspaceRoot,
          stashRef: targetStashRef,
          mode: `drop`,
        },
        host,
      );
      if (dropped.status === `error`) warnings.push(`drop-target-stash-failed`);
    }
    if (sourceStashRef != null) {
      const dropped = await deps.applyStash(
        { cwd: params.localCwd, stashRef: sourceStashRef, mode: `drop` },
        host,
      );
      if (dropped.status === `error`) warnings.push(`drop-source-stash-failed`);
    }
    return ok({ status: `success`, warnings });
  } catch {
    const rollbackErrors: string[] = [];
    if (!sourceStashApplied && targetStashRef != null) {
      const restoredTarget = await deps.applyStash(
        {
          cwd: params.worktreeWorkspaceRoot,
          stashRef: targetStashRef,
          mode: `pop`,
        },
        host,
      );
      if (restoredTarget.status === `error`)
        rollbackErrors.push(`restore-target-stash-failed`);
    }
    if (localCheckoutCompleted) {
      rollbackErrors.push(
        ...(await restoreLocal(sourceStashApplied ? null : sourceStashRef)),
      );
    }
    if (targetCheckoutCompleted && !sourceStashApplied)
      await cleanupCreatedWorktree(rollbackErrors);
    return ok({
      status: `error`,
      error: `unexpected-error`,
      message: `Failed to move thread to worktree`,
      rollbackErrors,
      warnings,
    });
  }
}

export { moveThreadToWorktree };
if (typeof module !== `undefined`) module.exports = { moveThreadToWorktree };
import { validateMoveToWorktreeParams } from './git-move-to-worktree-policy';
