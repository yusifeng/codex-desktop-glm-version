import { validateHostHandoffParams } from './git-host-handoff-validation';
import { createHostHandoffProgress } from './git-host-handoff-progress';

type HostHandoffDependencies = {
  randomUUID: () => string;
  resolveRepositoryMetadata: (
    gitManager: any,
    cwd: string,
    host: any,
  ) => Promise<any>;
  getTransferDirectory: (host: any, transferId: string) => Promise<string>;
  runGit: (
    cwd: string,
    args: string[],
    host: any,
    options?: any,
  ) => Promise<any>;
  inspectBranch: (params: any) => Promise<any>;
  getIndexTree: (repository: any, options: any) => Promise<string>;
  getUntrackedPaths: (repository: any) => Promise<any>;
  getCommitTree: (
    repository: any,
    commitSha: string,
    signal: AbortSignal,
  ) => Promise<string>;
  createSnapshotCommit: (
    gitRoot: string,
    treeSha: string,
    host: any,
    options: any,
  ) => Promise<any>;
  hasCommit: (
    gitRoot: string,
    commitSha: string,
    host: any,
    signal: AbortSignal,
  ) => Promise<boolean>;
  findSharedBase: (params: any) => Promise<string | null>;
  transferFile: (
    sourcePath: string,
    sourceHost: any,
    destinationPath: string,
    destinationHost: any,
    signal: AbortSignal,
  ) => Promise<void>;
  createWorktree: (params: any) => Promise<any>;
  resolveCleanWorktreeCommit: (
    repository: any,
    signal: AbortSignal,
  ) => Promise<string | null>;
  getCurrentBranch: (repository: any) => Promise<string | null>;
  getCurrentBranchSnapshot: (
    repository: any,
    signal: AbortSignal,
  ) => Promise<string | null>;
  checkoutBranch: (params: any, gitManager: any, host: any) => Promise<any>;
  prepareDestinationCheckout: (params: any) => Promise<any>;
  forceBranch: (params: any) => Promise<any>;
  ensureBranch: (params: any) => Promise<any>;
  rollbackWorktree: (params: any) => Promise<void>;
  applyStash: (params: any, host: any) => Promise<any>;
  formatExecOutput: (input: any) => any;
  warn: (message: string, detail: any) => void;
};

function ok(value: any) {
  return { type: `ok`, value };
}

function gitFailure(
  error: string,
  message: string,
  output: any,
  deps: HostHandoffDependencies,
) {
  return ok({
    status: `error`,
    error,
    message,
    execOutput: deps.formatExecOutput({
      command: output.command,
      stdout: output.stdout,
      stderr: output.stderr,
    }),
  });
}

async function moveThreadToHostWorktree(
  params: any,
  { gitManager, sourceHost, destinationHost, signal, onProgress }: any,
  deps: HostHandoffDependencies,
) {
  const validationError = validateHostHandoffParams(params);
  if (validationError != null) return ok(validationError);

  const transferId = deps.randomUUID();
  const [sourceMetadata, destinationMetadata] = await Promise.all([
    deps.resolveRepositoryMetadata(gitManager, params.sourceCwd, sourceHost),
    deps.resolveRepositoryMetadata(
      gitManager,
      params.destinationWorkspaceRoot,
      destinationHost,
    ),
  ]);
  if (sourceMetadata == null) {
    return ok({
      status: `error`,
      error: `source-not-in-repository`,
      message: `Source thread is not in a git repository`,
    });
  }
  if (destinationMetadata == null) {
    return ok({
      status: `error`,
      error: `destination-not-in-repository`,
      message: `Destination workspace is not in a git repository`,
    });
  }

  const sourceDirectory = await deps.getTransferDirectory(
    sourceHost,
    transferId,
  );
  const destinationDirectory = await deps.getTransferDirectory(
    destinationHost,
    transferId,
  );
  const sourcePath = await sourceHost.platformPath();
  const destinationPath = await destinationHost.platformPath();
  const sourceBundlePath = sourcePath.join(sourceDirectory, `handoff.bundle`);
  const destinationBundlePath = destinationPath.join(
    destinationDirectory,
    `handoff.bundle`,
  );
  const rolloutPath = destinationPath.join(
    destinationDirectory,
    `rollout.jsonl`,
  );
  const sourceRef = `refs/codex/handoff/source/${transferId}`;
  const destinationRef = `refs/codex/handoff/destination/${transferId}`;
  const sharedTransferDirectory =
    sourceHost.id === destinationHost.id &&
    sourceDirectory === destinationDirectory;
  let succeeded = false;
  const reusedWorktree =
    params.destinationWorktreeGitRoot != null &&
    params.destinationWorktreeWorkspaceRoot != null;
  let worktreeGitRoot = params.destinationWorktreeGitRoot;
  let worktreeWorkspaceRoot = params.destinationWorktreeWorkspaceRoot;
  let canDetachDefaultBranch = !reusedWorktree;
  let reusedWorktreePreviousCheckout = null;
  let reusedWorktreeStashRef = null;
  let destinationCheckoutPreviousBranch = null;
  const progressState = createHostHandoffProgress((step, status) => onProgress?.(step, status));
  const progress = progressState.progress;

  const rollback = () =>
    deps.rollbackWorktree({
      createdWorktree: !reusedWorktree,
      worktreeGitRoot,
      worktreeWorkspaceRoot,
      reusedWorktreePreviousCheckout,
      reusedWorktreeStashRef,
      destinationCheckoutGitRoot: destinationMetadata.root,
      destinationCheckoutPreviousBranch,
      gitManager,
      host: destinationHost,
    });

  try {
    progress(`prepare-host-transfer`, `started`);
    const sourceRepository = gitManager.getWorktreeRepositoryForRoot(
      sourceMetadata.root,
      sourceHost,
    );
    const headResult = await deps.runGit(
      sourceMetadata.root,
      [`rev-parse`, `HEAD`],
      sourceHost,
      {
        signal,
      },
    );
    if (!headResult.success || !headResult.stdout.trim()) {
      return gitFailure(
        `snapshot-failed`,
        `Unable to resolve source HEAD commit`,
        headResult,
        deps,
      );
    }
    const headSha = headResult.stdout.trim();
    const branchState = await deps.inspectBranch({
      branch: params.sourceBranch,
      cwd: destinationMetadata.root,
      commitSha: headSha,
      host: destinationHost,
    });
    if (branchState.status === `different-commit` && !reusedWorktree) {
      return ok({
        status: `error`,
        error: `destination-branch-exists`,
        message: branchState.message,
        execOutput: branchState.execOutput,
      });
    }

    const indexTree = await deps.getIndexTree(sourceRepository, {
      signal,
      untrackedPathsPromise: deps.getUntrackedPaths(sourceRepository),
    });
    const headTree = (
      await deps.getCommitTree(sourceRepository, headSha, signal)
    ).trim();
    let snapshotSha = headSha;
    if (headTree !== indexTree) {
      const snapshot = await deps.createSnapshotCommit(
        sourceMetadata.root,
        indexTree,
        sourceHost,
        {
          parentSha: headSha,
          message: `Codex host handoff snapshot`,
          signal,
        },
      );
      if (!snapshot.success) {
        return gitFailure(
          `snapshot-failed`,
          `Failed to create host handoff snapshot`,
          snapshot.error,
          deps,
        );
      }
      snapshotSha = snapshot.commitSha.trim();
    }

    const sourceRefResult = await deps.runGit(
      sourceMetadata.root,
      [`update-ref`, sourceRef, snapshotSha],
      sourceHost,
      { signal },
    );
    if (!sourceRefResult.success) {
      return gitFailure(
        `snapshot-failed`,
        `Failed to prepare host handoff snapshot ref`,
        sourceRefResult,
        deps,
      );
    }
    await Promise.all([
      sourceHost.createDirectory(sourceDirectory, { recursive: true }),
      destinationHost.createDirectory(destinationDirectory, {
        recursive: true,
      }),
    ]);

    const destinationHasSnapshot = await deps.hasCommit(
      destinationMetadata.root,
      snapshotSha,
      destinationHost,
      signal,
    );
    if (destinationHasSnapshot) {
      const destinationRefResult = await deps.runGit(
        destinationMetadata.root,
        [`update-ref`, destinationRef, snapshotSha],
        destinationHost,
        { signal },
      );
      if (!destinationRefResult.success) {
        return gitFailure(
          `bundle-import-failed`,
          `Failed to prepare destination handoff ref`,
          destinationRefResult,
          deps,
        );
      }
    } else {
      const sharedBase = await deps.findSharedBase({
        gitManager,
        sourceGitRoot: sourceMetadata.root,
        destinationGitRoot: destinationMetadata.root,
        headSha,
        sourceHost,
        destinationHost,
        signal,
      });
      if (sharedBase == null) {
        return ok({
          status: `error`,
          error: `bundle-export-failed`,
          message: `Could not find a shared Git base on the destination host`,
        });
      }
      const bundleResult = await deps.runGit(
        sourceMetadata.root,
        [`bundle`, `create`, sourceBundlePath, sourceRef, `^${sharedBase}`],
        sourceHost,
        { signal },
      );
      if (!bundleResult.success) {
        return gitFailure(
          `bundle-export-failed`,
          `Failed to export git handoff bundle`,
          bundleResult,
          deps,
        );
      }
      progress(`prepare-host-transfer`, `completed`);
      progress(`transfer-host-artifacts`, `started`);
      await deps.transferFile(
        sourceBundlePath,
        sourceHost,
        destinationBundlePath,
        destinationHost,
        signal,
      );
      const unbundleResult = await deps.runGit(
        destinationMetadata.root,
        [`bundle`, `unbundle`, destinationBundlePath],
        destinationHost,
        { signal },
      );
      if (!unbundleResult.success) {
        return gitFailure(
          `bundle-import-failed`,
          `Failed to import git handoff bundle`,
          unbundleResult,
          deps,
        );
      }
      const destinationRefResult = await deps.runGit(
        destinationMetadata.root,
        [`update-ref`, destinationRef, snapshotSha],
        destinationHost,
        { signal },
      );
      if (!destinationRefResult.success) {
        return gitFailure(
          `bundle-import-failed`,
          `Failed to prepare destination handoff ref`,
          destinationRefResult,
          deps,
        );
      }
    }

    if (destinationHasSnapshot) {
      progress(`prepare-host-transfer`, `completed`);
      progress(`transfer-host-artifacts`, `started`);
    }
    await deps.transferFile(
      params.sourceRolloutPath,
      sourceHost,
      rolloutPath,
      destinationHost,
      signal,
    );
    progress(`transfer-host-artifacts`, `completed`);

    if (worktreeGitRoot == null || worktreeWorkspaceRoot == null) {
      progress(`create-new-worktree`, `started`);
      const created = await deps.createWorktree({
        gitManager,
        workspaceRoot: params.destinationWorkspaceRoot,
        startingState: { type: `branch`, branchName: destinationRef },
        upstreamRefreshMode: `never`,
        localEnvironmentConfigPath: null,
        setUpSyncedBranch: false,
        useWorkspaceDir: params.useWorkspaceDir,
        host: destinationHost,
        signal,
      });
      if (!created.success) {
        return ok({
          status: `error`,
          error: `create-worktree-failed`,
          message: created.error.message,
        });
      }
      worktreeGitRoot = created.worktreeGitRoot;
      worktreeWorkspaceRoot = created.worktreeWorkspaceRoot;
      progress(`create-new-worktree`, `completed`);
    } else {
      const worktreeRepository = gitManager.getWorktreeRepositoryForRoot(
        worktreeGitRoot,
        destinationHost,
      );
      canDetachDefaultBranch =
        (await deps.resolveCleanWorktreeCommit(worktreeRepository, signal)) ===
        headSha;
      worktreeRepository.invalidateGitReadCachesForRepoChange(`head`);
      reusedWorktreePreviousCheckout =
        (await deps.getCurrentBranch(worktreeRepository)) ??
        (await deps.getCurrentBranchSnapshot(worktreeRepository, signal));
      const checkout = await deps.checkoutBranch(
        {
          cwd: worktreeWorkspaceRoot,
          branch: destinationRef,
          stashUncommitted: params.stashDestinationWorktree,
        },
        gitManager,
        destinationHost,
      );
      if (checkout.status === `error`) {
        return ok({
          status: `error`,
          error: `restore-worktree-state-failed`,
          message: checkout.error,
          execOutput: checkout.execOutput,
        });
      }
      reusedWorktreeStashRef = checkout.stashRef;
    }

    progress(`apply-changes-to-worktree`, `started`);
    const reset = await deps.runGit(
      worktreeGitRoot,
      [`reset`, `--mixed`, headSha],
      destinationHost,
      { signal },
    );
    if (!reset.success) {
      await rollback();
      return ok({
        status: `error`,
        error: `restore-worktree-state-failed`,
        message: `Failed to restore transferred git state in the worktree`,
        execOutput: deps.formatExecOutput({
          command: reset.command,
          stdout: reset.stdout,
          stderr: reset.stderr,
        }),
      });
    }

    const destinationCheckout = await deps.prepareDestinationCheckout({
      branch: params.sourceBranch,
      cwd: destinationMetadata.root,
      sourceHeadSha: headSha,
      canDetachDefaultBranch,
      gitManager,
      host: destinationHost,
      signal,
    });
    if (destinationCheckout.error != null) {
      await rollback();
      return ok({
        status: `error`,
        error: `restore-worktree-state-failed`,
        message: destinationCheckout.error.message,
        execOutput: destinationCheckout.error.execOutput,
      });
    }
    destinationCheckoutPreviousBranch = destinationCheckout.previousBranch;

    const branchError = reusedWorktree
      ? await deps.forceBranch({
          branch: params.sourceBranch,
          cwd: worktreeGitRoot,
          commitSha: headSha,
          host: destinationHost,
        })
      : await deps.ensureBranch({
          branch: params.sourceBranch,
          cwd: worktreeGitRoot,
          commitSha: headSha,
          host: destinationHost,
        });
    if (branchError != null) {
      await rollback();
      return ok({
        status: `error`,
        error: `restore-worktree-state-failed`,
        message: branchError.message,
        execOutput: branchError.execOutput,
      });
    }

    const checkout = await deps.checkoutBranch(
      {
        cwd: worktreeGitRoot,
        branch: params.sourceBranch,
        stashUncommitted: false,
      },
      gitManager,
      destinationHost,
    );
    if (checkout.status === `error`) {
      await rollback();
      return ok({
        status: `error`,
        error: `restore-worktree-state-failed`,
        message: checkout.error,
        execOutput: checkout.execOutput,
      });
    }
    if (reusedWorktreeStashRef != null) {
      const dropped = await deps.applyStash(
        {
          cwd: worktreeWorkspaceRoot,
          stashRef: reusedWorktreeStashRef,
          mode: `drop`,
        },
        destinationHost,
      );
      if (dropped.status === `error`) {
        deps.warn(`[host-handoff] failed to drop reused worktree stash`, {
          safe: {},
          sensitive: { error: dropped.error },
        });
      }
    }
    progress(`apply-changes-to-worktree`, `completed`);
    succeeded = true;
    return ok({
      status: `success`,
      rolloutPath,
      worktreeGitRoot,
      worktreeWorkspaceRoot,
    });
  } catch (error) {
    if (
      destinationCheckoutPreviousBranch != null &&
      worktreeGitRoot != null &&
      worktreeWorkspaceRoot != null
    ) {
      await rollback().catch(() => undefined);
    }
    return ok({
      status: `error`,
      error: `unexpected-error`,
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    progressState.failActive();
    await Promise.allSettled([
      deps.runGit(
        sourceMetadata.root,
        [`update-ref`, `-d`, sourceRef],
        sourceHost,
        { signal },
      ),
      deps.runGit(
        destinationMetadata.root,
        [`update-ref`, `-d`, destinationRef],
        destinationHost,
        {
          signal,
        },
      ),
      sharedTransferDirectory && succeeded
        ? Promise.resolve()
        : sourceHost.remove(sourceDirectory, { recursive: true, force: true }),
      succeeded
        ? destinationHost.remove(destinationBundlePath, {
            recursive: false,
            force: true,
          })
        : destinationHost.remove(destinationDirectory, {
            recursive: true,
            force: true,
          }),
    ]);
  }
}

export { moveThreadToHostWorktree };
if (typeof module !== `undefined`)
  module.exports = { moveThreadToHostWorktree };
