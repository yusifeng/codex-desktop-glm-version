type SyncedBranchDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  getSyncedBranch: (repository: any, signal: AbortSignal) => Promise<any>;
  getSyncedBranchState: (cwd: string, gitManager: any, host: any, signal: AbortSignal) => Promise<any>;
  overwriteRepository: (args: any) => Promise<any>;
};

async function resolveSyncedBranch(cwd: string, deps: SyncedBranchDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(cwd, deps.host);
  return repository == null
    ? { branch: null, base: null, hasConflicts: false }
    : deps.getSyncedBranch(repository, deps.signal);
}

async function resolveSyncedBranchState(cwd: string, deps: SyncedBranchDependencies) {
  return deps.getSyncedBranchState(cwd, deps.gitManager, deps.host, deps.signal);
}

async function overwriteSyncedBranchRepository(params: any, deps: SyncedBranchDependencies) {
  const result = await deps.overwriteRepository({
    ...params,
    gitManager: deps.gitManager,
    host: deps.host,
    signal: deps.signal,
  });
  return {
    result,
    refreshRoot: result.status === `command-error` ? null : params.targetRoot ?? params.gitRoot,
  };
}

export { overwriteSyncedBranchRepository, resolveSyncedBranch, resolveSyncedBranchState };
if (typeof module !== `undefined`) module.exports = { overwriteSyncedBranchRepository, resolveSyncedBranch, resolveSyncedBranchState };
