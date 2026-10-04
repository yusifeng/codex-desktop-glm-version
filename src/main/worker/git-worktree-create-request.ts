type WorktreeCreateRequestDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  emit: (event: any) => void;
  upstreamRefreshControllers: Map<any, AbortController>;
  createWorktree: (params: any) => Promise<any>;
};

async function createWorktreeRequest(params: any, deps: WorktreeCreateRequestDependencies) {
  const emit = deps.emit;
  const streamId = params.streamId;
  const upstreamRefreshController = new AbortController();

  if (params.pendingWorktreeId != null) {
    deps.upstreamRefreshControllers.set(params.pendingWorktreeId, upstreamRefreshController);
  }

  const result = await deps
    .createWorktree({
      gitManager: deps.gitManager,
      workspaceRoot: params.cwd,
      name: params.name,
      startingState: params.startingState,
      upstreamRefreshMode: params.upstreamRefreshMode,
      localEnvironmentConfigPath: params.localEnvironmentConfigPath,
      allowSetupFailure: params.allowSetupFailure,
      setUpSyncedBranch: params.setUpSyncedBranch ?? true,
      host: deps.host,
      signal: deps.signal,
      upstreamRefreshSignal: upstreamRefreshController.signal,
      worktreesRoot: params.worktreesRoot,
      useWorkspaceDir: params.useWorkspaceDir,
      onWorktreePathAllocated: (worktreeGitRoot: string) => {
        if (deps.signal.aborted) return;
        emit({
          type: `worker-event`,
          event: {
            type: `create-worktree-path`,
            hostId: deps.host.id,
            streamId,
            worktreeGitRoot,
          },
        });
      },
      onSetupStart: () => {
        if (deps.signal.aborted) return;
        emit({
          type: `worker-event`,
          event: { type: `create-worktree-setup-started`, streamId },
        });
      },
      onLog: (stream: any, data: any) => {
        if (deps.signal.aborted) return;
        emit({
          type: `worker-event`,
          event: { type: `create-worktree-stream`, streamId, stream, data },
        });
      },
    })
    .finally(() => {
      if (
        params.pendingWorktreeId != null &&
        deps.upstreamRefreshControllers.get(params.pendingWorktreeId) ===
          upstreamRefreshController
      ) {
        deps.upstreamRefreshControllers.delete(params.pendingWorktreeId);
      }
    });

  return result.success
    ? {
        type: `ok`,
        value: {
          worktreeGitRoot: result.worktreeGitRoot,
          worktreeWorkspaceRoot: result.worktreeWorkspaceRoot,
          setupError: result.setupError?.message ?? null,
        },
      }
    : {
        type: `error`,
        error: { message: result.error instanceof Error ? result.error.message : String(result.error) },
      };
}

export { createWorktreeRequest };
if (typeof module !== `undefined`) module.exports = { createWorktreeRequest };
