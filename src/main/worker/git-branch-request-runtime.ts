type BranchRequestRuntimeDependencies = {
  gitManager: any;
  getCurrentBranch: (repository: any) => Promise<string | null>;
  getCurrentBranchState: (repository: any) => Promise<any>;
  getUpstreamRef: (repository: any, ref: string, signal: AbortSignal) => Promise<string | null>;
  getBranchAheadCount: (root: string, gitManager: any, host: any, signal: AbortSignal, dependencies?: any) => Promise<unknown>;
  getDefaultRemoteBranch: (repository: any, dependencies?: any) => Promise<{ branch?: string | null; remote?: string | null } | null>;
  getRecentBranches: (repository: any, limit: number, signal: AbortSignal, options: { live?: boolean }, dependencies?: any) => Promise<string[]>;
  branchAheadDependencies?: any;
  recentBranchesDependencies?: any;
};

async function resolveUpstreamBranch(
  root: string,
  host: any,
  signal: AbortSignal,
  deps: BranchRequestRuntimeDependencies,
) {
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(root, host);
  const branch = await deps.getCurrentBranch(repository);
  const upstream = await deps.getUpstreamRef(repository, branch ?? `HEAD`, signal);
  return upstream ? { branch, upstream: { branch: upstream } } : { branch, upstream: null };
}

async function resolveBranchAheadCount(
  root: string,
  host: any,
  signal: AbortSignal,
  deps: BranchRequestRuntimeDependencies,
) {
  return deps.getBranchAheadCount(root, deps.gitManager, host, signal, deps.branchAheadDependencies);
}

async function resolveDefaultBranch(
  root: string,
  host: any,
  signal: AbortSignal,
  options: { live?: boolean } = {},
  deps: BranchRequestRuntimeDependencies,
) {
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(root, host);
  let branch = (await deps.getDefaultRemoteBranch(repository, deps.recentBranchesDependencies))?.branch ?? null;
  if (branch == null) {
    branch = (await deps.getRecentBranches(repository, 10, signal, { live: options.live ?? false }, deps.recentBranchesDependencies))
      .find((candidate) => candidate === `main` || candidate === `master`) ?? null;
  }
  return { branch };
}

async function resolveBaseBranch(root: string, host: any, deps: BranchRequestRuntimeDependencies) {
  const remote = await deps.getDefaultRemoteBranch(deps.gitManager.getWorktreeRepositoryForRoot(root, host), deps.recentBranchesDependencies);
  return { local: remote?.branch ?? null, remote: remote?.remote ?? null };
}

async function resolveCurrentBranch(root: string, host: any, deps: BranchRequestRuntimeDependencies) {
  const state = await deps.getCurrentBranchState(deps.gitManager.getWorktreeRepositoryForRoot(root, host));
  return { branch: state.type === `branch` ? state.branch : null, isDetached: state.type === `detached` };
}

async function resolveRecentBranches(
  root: string,
  limit: number | null | undefined,
  host: any,
  signal: AbortSignal,
  deps: BranchRequestRuntimeDependencies,
) {
  const boundedLimit = Math.max(1, Math.min(limit ?? 10, 100));
  return {
    branches: await deps.getRecentBranches(
      deps.gitManager.getWorktreeRepositoryForRoot(root, host),
      boundedLimit,
      signal,
      deps.recentBranchesDependencies,
    ),
  };
}

export {
  resolveBaseBranch,
  resolveBranchAheadCount,
  resolveCurrentBranch,
  resolveDefaultBranch,
  resolveRecentBranches,
  resolveUpstreamBranch,
};
if (typeof module !== `undefined`)
  module.exports = {
    resolveBaseBranch,
    resolveBranchAheadCount,
    resolveCurrentBranch,
    resolveDefaultBranch,
    resolveRecentBranches,
    resolveUpstreamBranch,
  };
