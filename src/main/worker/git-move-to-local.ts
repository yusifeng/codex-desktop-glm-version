type MoveToLocalDependencies = {
  getCurrentBranch: (repository: any) => Promise<string | null>;
  listWorktrees: (repository: any, signal: AbortSignal) => Promise<any[]>;
  getHeadCommit: (
    repository: any,
    signal: AbortSignal,
  ) => Promise<string | null>;
  checkoutBranch: (
    params: any,
    gitManager: any,
    host: any,
    options?: any,
  ) => Promise<any>;
  getStatus: (repository: any) => Promise<any>;
  ensureBranch: (params: any) => Promise<any>;
  restoreSource: (params: any) => Promise<string[]>;
  restoreBranchAndStash: (params: any) => Promise<string[]>;
  applyStash: (params: any, host: any) => Promise<any>;
};

function ok(value: any) {
  return { type: `ok`, value };
}

async function moveThreadToLocal(
  params: any,
  { host, gitManager, signal, onProgress }: any,
  deps: MoveToLocalDependencies,
) {
  const warnings: string[] = [];
  if (params.sourceBranch.trim().length === 0) {
    return ok({
      status: `error`,
      error: `invalid-params`,
      message: `Missing source branch`,
      rollbackErrors: [],
      warnings,
    });
  }

  let sourceStashRef = null;
  let sourcePreviousBranch = null;
  let localPreviousBranch = null;
  let sourceDetached = false;
  let localBranchChanged = false;

  const restoreSource = () =>
    deps.restoreSource({
      cwd: params.sourceWorktreeCwd,
      branch: sourcePreviousBranch,
      stashRef: sourceStashRef,
      gitManager,
      host,
    });
  const restoreLocal = () =>
    deps.restoreBranchAndStash({
      cwd: params.localGitRoot,
      branch: localPreviousBranch,
      stashRef: null,
      restoreBranchError: `restore-local-branch-failed`,
      restoreStashError: `restore-local-stash-failed`,
      gitManager,
      host,
    });

  try {
    const sourceRepository = await gitManager.getWorktreeRepository(
      params.sourceWorktreeCwd,
      host,
    );
    const localRepository = gitManager.getWorktreeRepositoryForRoot(
      params.localGitRoot,
      host,
    );
    if (sourceRepository == null || localRepository == null) {
      throw Error(`Unable to resolve move-to-local repositories`);
    }

    sourcePreviousBranch = await deps.getCurrentBranch(sourceRepository);
    const platformPath = await host.platformPath();
    const localRoot = platformPath.normalize(
      platformPath.resolve(params.localGitRoot),
    );
    const sourceRoot = platformPath.normalize(
      platformPath.resolve(params.sourceWorktreeRoot),
    );
    const branchCheckedOutElsewhere = (
      await deps.listWorktrees(localRepository, signal)
    ).some((worktree) => {
      if (
        worktree.headRef.type !== `branch` ||
        worktree.headRef.string !== params.sourceBranch
      ) {
        return false;
      }
      const root = platformPath.normalize(platformPath.resolve(worktree.root));
      return root !== localRoot && root !== sourceRoot;
    });
    if (branchCheckedOutElsewhere) {
      return ok({
        status: `error`,
        error: `branch-checked-out-elsewhere`,
        message: `Branch is already checked out in another worktree`,
        rollbackErrors: [],
        warnings,
      });
    }

    localPreviousBranch = await deps.getCurrentBranch(localRepository);
    const sourceHead = await deps.getHeadCommit(sourceRepository, signal);
    if (sourceHead == null) {
      return ok({
        status: `error`,
        error: `source-detach-failed`,
        message: `Unable to resolve worktree HEAD commit`,
        rollbackErrors: [],
        warnings,
      });
    }
    const detach = await deps.checkoutBranch(
      {
        cwd: params.sourceWorktreeCwd,
        branch: sourceHead,
        stashUncommitted: true,
      },
      gitManager,
      host,
      {
        onStashStatusChange: (status: any) =>
          onProgress?.(`stash-source-changes`, status),
        onCheckoutStatusChange: (status: any) =>
          onProgress?.(`detach-worktree-branch`, status),
      },
    );
    if (detach.status === `error`) {
      return ok({
        status: `error`,
        error: `source-detach-failed`,
        message: detach.error,
        rollbackErrors: [],
        warnings,
        execOutput: detach.execOutput,
      });
    }
    sourceStashRef = detach.stashRef;
    sourceDetached = true;

    const localStatus = await deps.getStatus(localRepository);
    if (localStatus.type !== `success` || localStatus.untrackedCount == null) {
      return ok({
        status: `error`,
        error: `local-status-check-failed`,
        message: `Failed to read destination local status`,
        rollbackErrors: await restoreSource(),
        warnings,
      });
    }
    if (
      localStatus.stagedCount +
        localStatus.unstagedCount +
        localStatus.untrackedCount >
      0
    ) {
      return ok({
        status: `error`,
        error: `local-destination-has-tracked-changes`,
        message: `You have uncommitted local changes. Commit or stash them first.`,
        rollbackErrors: await restoreSource(),
        warnings,
      });
    }

    if (localPreviousBranch !== params.sourceBranch) {
      const branchError = await deps.ensureBranch({
        branch: params.sourceBranch,
        cwd: params.localGitRoot,
        commitSha: sourceHead,
        host,
      });
      if (branchError != null) {
        return ok({
          status: `error`,
          error: `local-branch-head-mismatch`,
          message: branchError.message,
          rollbackErrors: await restoreSource(),
          warnings,
          execOutput: branchError.execOutput,
        });
      }
      const checkout = await deps.checkoutBranch(
        {
          cwd: params.localGitRoot,
          branch: params.sourceBranch,
          stashUncommitted: false,
        },
        gitManager,
        host,
        {
          onCheckoutStatusChange: (status: any) =>
            onProgress?.(`checkout-local-branch`, status),
        },
      );
      if (checkout.status === `error`) {
        return ok({
          status: `error`,
          error: `checkout-local-failed`,
          message: checkout.error,
          rollbackErrors: await restoreSource(),
          warnings,
          execOutput: checkout.execOutput,
        });
      }
      localBranchChanged = true;
    } else {
      onProgress?.(`checkout-local-branch`, `skipped`);
    }

    if (sourceStashRef != null) {
      onProgress?.(`apply-changes-to-local`, `started`);
      const applied = await deps.applyStash(
        { cwd: params.localGitRoot, stashRef: sourceStashRef, mode: `apply` },
        host,
      );
      if (applied.status === `error`) {
        onProgress?.(`apply-changes-to-local`, `failed`);
        const rollbackErrors = [
          ...(await restoreLocal()),
          ...(await restoreSource()),
        ];
        return ok({
          status: `error`,
          error: `apply-source-stash-failed`,
          message: applied.error,
          rollbackErrors,
          warnings,
          execOutput: applied.execOutput,
        });
      }
      onProgress?.(`apply-changes-to-local`, `completed`);
      const dropped = await deps.applyStash(
        { cwd: params.localGitRoot, stashRef: sourceStashRef, mode: `drop` },
        host,
      );
      if (dropped.status === `error`) warnings.push(`drop-source-stash-failed`);
    } else {
      onProgress?.(`apply-changes-to-local`, `skipped`);
    }
    return ok({ status: `success`, warnings });
  } catch {
    const rollbackErrors: string[] = [];
    if (localBranchChanged) rollbackErrors.push(...(await restoreLocal()));
    if (sourceDetached) rollbackErrors.push(...(await restoreSource()));
    return ok({
      status: `error`,
      error: `unexpected-error`,
      message: `Failed to move thread to local`,
      rollbackErrors,
      warnings,
    });
  }
}

export { moveThreadToLocal };
if (typeof module !== `undefined`) module.exports = { moveThreadToLocal };
