type HandoffDestinationDependencies = {
  getStatusConfig: (repository: any, signal: AbortSignal) => Promise<any>;
  getHeadCommit: (repository: any, signal: AbortSignal) => Promise<any>;
  runGit: (cwd: string, args: string[], host: any, options: any) => Promise<any>;
  getCurrentBranch: (repository: any) => Promise<string | null>;
  getDefaultRemoteBranch: (repository: any) => Promise<any>;
  checkoutBranch: (params: any, gitManager: any, host: any) => Promise<any>;
};

async function resolveCleanWorktreeCommit(
  repository: any,
  signal: AbortSignal,
  deps: HandoffDestinationDependencies,
) {
  try {
    const configOverrides = await deps.getStatusConfig(repository, signal);
    const [headCommit, status] = await Promise.all([
      deps.getHeadCommit(repository, signal),
      deps.runGit(
        repository.root,
        [`status`, `--porcelain=v1`, `--untracked-files=normal`],
        repository.host,
        { configOverrides, signal },
      ),
    ]);
    return status.success && status.stdout.length === 0 ? headCommit : null;
  } catch {
    return null;
  }
}

async function prepareHandoffDestinationCheckout(
  params: any,
  deps: HandoffDestinationDependencies,
) {
  const repository = params.gitManager.getWorktreeRepositoryForRoot(params.cwd, params.host);
  repository.invalidateGitReadCachesForRepoChange(`head`);
  const currentBranch = await deps.getCurrentBranch(repository);
  if (currentBranch !== params.branch) return { previousBranch: null, error: null };

  const defaultBranch = (await deps.getDefaultRemoteBranch(repository))?.branch ?? null;
  let checkoutTarget = defaultBranch;
  if (defaultBranch === params.branch) {
    const cleanCommit = params.canDetachDefaultBranch
      ? await resolveCleanWorktreeCommit(repository, params.signal, deps)
      : null;
    checkoutTarget = cleanCommit === params.sourceHeadSha ? cleanCommit : null;
  }
  if (checkoutTarget == null) {
    return {
      previousBranch: null,
      error: {
        message: `Destination checkout is already using the handoff branch, and Codex could not switch it to a default branch`,
      },
    };
  }
  const checkout = await deps.checkoutBranch(
    { cwd: params.cwd, branch: checkoutTarget, stashUncommitted: false },
    params.gitManager,
    params.host,
  );
  return checkout.status === `error`
    ? { previousBranch: null, error: { message: checkout.error, execOutput: checkout.execOutput } }
    : { previousBranch: currentBranch, error: null };
}

export { prepareHandoffDestinationCheckout, resolveCleanWorktreeCommit };
if (typeof module !== `undefined`) module.exports = {
  prepareHandoffDestinationCheckout,
  resolveCleanWorktreeCommit,
};
