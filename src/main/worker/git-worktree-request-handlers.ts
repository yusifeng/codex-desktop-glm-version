import { dispatchWorktreeOwnerRequest } from "./git-worktree-owner-dispatch";
export {
  cleanupHostHandoffTransfer,
  createHandoffProgressReporter,
  moveThreadToHostWorktree,
  moveThreadToLocal,
  moveThreadToWorktree,
} from "./git-worktree-handoff-dispatch";

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
  upstreamRefreshControllers: Map<any, AbortController>;
  listCodexWorktrees: (gitManager: any, host: any, worktreesRoot: string) => Promise<any>;
  listWorktrees: (cwd: string, host: any, signal: AbortSignal) => Promise<any>;
};

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

function cancelWorktreeUpstreamRefresh(params: any, deps: WorktreeRequestDependencies) {
  const controller = deps.upstreamRefreshControllers.get(params.pendingWorktreeId);
  controller?.abort();
  return { success: controller != null };
}

async function resolveCodexWorktrees(params: any, deps: WorktreeRequestDependencies) {
  return {
    worktrees: await deps.listCodexWorktrees(deps.gitManager, deps.host, params.worktreesRoot),
  };
}

async function resolveWorktrees(params: any, deps: WorktreeRequestDependencies) {
  return deps.listWorktrees(params.cwd, deps.host, deps.signal);
}

// Compatibility adapter for restore-era callers/tests; owner mutation semantics
// live in the dedicated dispatcher and remain on the same success/error contract.
async function setWorktreeOwnerThread(params: any, deps: WorktreeRequestDependencies) {
  return (await dispatchWorktreeOwnerRequest(`set-worktree-owner-thread`, params, deps)).result;
}

export {
  cancelWorktreeUpstreamRefresh,
  deleteWorktree,
  resolveCodexWorktrees,
  resolveWorktrees,
  restoreWorktree,
  setWorktreeOwnerThread,
};
if (typeof module !== `undefined`) module.exports = {
  cancelWorktreeUpstreamRefresh,
  deleteWorktree,
  resolveCodexWorktrees,
  resolveWorktrees,
  restoreWorktree,
  setWorktreeOwnerThread,
  ...require("./git-worktree-handoff-dispatch"),
};
