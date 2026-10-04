type HandoffDirection = `to-local` | `to-worktree` | `to-host-worktree`;

type WorktreeHandoffDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  emit: (event: any) => void;
  moveToLocal: (params: any, options: any) => Promise<any>;
  moveToWorktree: (params: any, options: any) => Promise<any>;
  moveToHostWorktree: (params: any, options: any) => Promise<any>;
  createExecutionHost: (config: any) => any;
  cleanupHostTransfer: (rolloutPath: string, host: any) => Promise<void>;
};

function createHandoffProgressReporter(requestId: string | number, operationId: string | undefined, direction: HandoffDirection, emit: WorktreeHandoffDependencies[`emit`]) {
  const resolvedOperationId = operationId ?? String(requestId);
  return (step: any, status: any) => emit({ type: `worker-event`, event: { type: `thread-handoff-progress`, operationId: resolvedOperationId, direction, step, status } });
}

async function moveThreadToLocal(params: any, requestId: string | number, deps: WorktreeHandoffDependencies) {
  return deps.moveToLocal(params, { host: deps.host, gitManager: deps.gitManager, signal: deps.signal, onProgress: createHandoffProgressReporter(requestId, params.operationId, `to-local`, deps.emit) });
}
async function moveThreadToWorktree(params: any, requestId: string | number, deps: WorktreeHandoffDependencies) {
  return deps.moveToWorktree(params, { host: deps.host, gitManager: deps.gitManager, signal: deps.signal, onProgress: createHandoffProgressReporter(requestId, params.operationId, `to-worktree`, deps.emit) });
}
async function moveThreadToHostWorktree(params: any, requestId: string | number, deps: WorktreeHandoffDependencies) {
  const destinationHost = deps.createExecutionHost(params.destinationHostConfig);
  try {
    return await deps.moveToHostWorktree(params, { gitManager: deps.gitManager, sourceHost: deps.host, destinationHost, signal: deps.signal, onProgress: createHandoffProgressReporter(requestId, params.operationId, `to-host-worktree`, deps.emit) });
  } finally {
    deps.gitManager.invalidateUntrackedPathsCache(destinationHost);
    deps.gitManager.invalidateShortLivedGitReadCaches(destinationHost);
  }
}
async function cleanupHostHandoffTransfer(params: any, deps: WorktreeHandoffDependencies) {
  await deps.cleanupHostTransfer(params.rolloutPath, deps.host);
  return { success: true };
}

export { cleanupHostHandoffTransfer, createHandoffProgressReporter, moveThreadToHostWorktree, moveThreadToLocal, moveThreadToWorktree };
if (typeof module !== `undefined`) module.exports = { cleanupHostHandoffTransfer, createHandoffProgressReporter, moveThreadToHostWorktree, moveThreadToLocal, moveThreadToWorktree };
