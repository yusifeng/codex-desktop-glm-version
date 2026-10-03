type WorktreeRequestDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  emit: (event: any) => void;
  scheduleRestore: (
    repoRoot: string,
    worktreePath: string,
    cwd: string,
    host: any,
    signal: AbortSignal,
  ) => Promise<boolean>;
  scheduleDelete: (params: any, host: any) => Promise<any>;
  unwatchRepository: (worktreePath: string, host: any) => void;
  normalizeWorktreePath: (worktreePath: string) => string;
  setOwnerThread: (repository: any, conversationId: string, signal: AbortSignal) => Promise<void>;
  warn: (message: string, detail: any) => void;
  moveToLocal: (params: any, options: any) => Promise<any>;
  moveToWorktree: (params: any, options: any) => Promise<any>;
  moveToHostWorktree: (params: any, options: any) => Promise<any>;
  createExecutionHost: (config: any) => any;
  cleanupHostTransfer: (rolloutPath: string, host: any) => Promise<void>;
};

type HandoffDirection = `to-local` | `to-worktree` | `to-host-worktree`;

function createHandoffProgressReporter(
  requestId: string | number,
  operationId: string | undefined,
  direction: HandoffDirection,
  emit: WorktreeRequestDependencies[`emit`],
) {
  const resolvedOperationId = operationId ?? String(requestId);
  return (step: any, status: any) => {
    emit({
      type: `worker-event`,
      event: {
        type: `thread-handoff-progress`,
        operationId: resolvedOperationId,
        direction,
        step,
        status,
      },
    });
  };
}

async function restoreWorktree(params: any, deps: WorktreeRequestDependencies) {
  const success = await deps.scheduleRestore(
    params.repoRoot,
    params.worktreePath,
    params.cwd,
    deps.host,
    deps.signal,
  );
  if (success) {
    try {
      await deps.setOwnerThread(
        deps.gitManager.getWorktreeRepositoryForRoot(deps.normalizeWorktreePath(params.worktreePath), deps.host),
        params.conversationId,
        deps.signal,
      );
    } catch (error) {
      deps.warn(`[worktree-restore] failed to set restored worktree owner thread`, {
        safe: {
          worktreePath: params.worktreePath,
          conversationId: params.conversationId,
        },
        sensitive: { error },
      });
    }
  }
  return { success };
}

async function deleteWorktree(params: any, deps: WorktreeRequestDependencies) {
  const worktreeId = await deps.scheduleDelete(params, deps.host);
  deps.unwatchRepository(params.worktree, deps.host);
  return { success: true, worktreeId };
}

async function moveThreadToLocal(
  params: any,
  requestId: string | number,
  deps: WorktreeRequestDependencies,
) {
  return deps.moveToLocal(params, {
    host: deps.host,
    gitManager: deps.gitManager,
    signal: deps.signal,
    onProgress: createHandoffProgressReporter(requestId, params.operationId, `to-local`, deps.emit),
  });
}

async function moveThreadToWorktree(
  params: any,
  requestId: string | number,
  deps: WorktreeRequestDependencies,
) {
  return deps.moveToWorktree(params, {
    host: deps.host,
    gitManager: deps.gitManager,
    signal: deps.signal,
    onProgress: createHandoffProgressReporter(requestId, params.operationId, `to-worktree`, deps.emit),
  });
}

async function moveThreadToHostWorktree(
  params: any,
  requestId: string | number,
  deps: WorktreeRequestDependencies,
) {
  const destinationHost = deps.createExecutionHost(params.destinationHostConfig);
  try {
    return await deps.moveToHostWorktree(params, {
      gitManager: deps.gitManager,
      sourceHost: deps.host,
      destinationHost,
      signal: deps.signal,
      onProgress: createHandoffProgressReporter(
        requestId,
        params.operationId,
        `to-host-worktree`,
        deps.emit,
      ),
    });
  } finally {
    deps.gitManager.invalidateUntrackedPathsCache(destinationHost);
    deps.gitManager.invalidateShortLivedGitReadCaches(destinationHost);
  }
}

async function cleanupHostHandoffTransfer(params: any, deps: WorktreeRequestDependencies) {
  await deps.cleanupHostTransfer(params.rolloutPath, deps.host);
  return { success: true };
}

export {
  cleanupHostHandoffTransfer,
  createHandoffProgressReporter,
  deleteWorktree,
  moveThreadToHostWorktree,
  moveThreadToLocal,
  moveThreadToWorktree,
  restoreWorktree,
};
if (typeof module !== `undefined`) module.exports = {
  cleanupHostHandoffTransfer,
  createHandoffProgressReporter,
  deleteWorktree,
  moveThreadToHostWorktree,
  moveThreadToLocal,
  moveThreadToWorktree,
  restoreWorktree,
};
