type HandoffDestinationDependencies = {
  getStatusConfig: (repository: any, signal: AbortSignal) => Promise<any>;
  getHeadCommit: (repository: any, signal: AbortSignal) => Promise<any>;
  runGit: (cwd: string, args: string[], host: any, options: any) => Promise<any>;
  getCurrentBranch: (repository: any) => Promise<string | null>;
  getDefaultRemoteBranch: (repository: any) => Promise<any>;
  checkoutBranch: (params: any, gitManager: any, host: any) => Promise<any>;
};

import { resolveDestinationCheckoutTarget } from './git-handoff-destination-policy';

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
  const cleanCommit = defaultBranch === params.branch && params.canDetachDefaultBranch
    ? await resolveCleanWorktreeCommit(repository, params.signal, deps)
    : null;
  const target = resolveDestinationCheckoutTarget(
    currentBranch, params.branch, defaultBranch, params.canDetachDefaultBranch,
    cleanCommit, params.sourceHeadSha,
  );
  if (target.error != null) {
    return {
      previousBranch: null,
      error: { message: target.error },
    };
  }
  if (target.checkoutTarget == null) return { previousBranch: null, error: null };
  const checkout = await deps.checkoutBranch(
    { cwd: params.cwd, branch: target.checkoutTarget, stashUncommitted: false },
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
