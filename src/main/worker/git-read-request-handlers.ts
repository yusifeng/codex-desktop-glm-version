type ReadHandlerDependencies = {
  gitManager: any;
  host: any;
  getOriginUrl: (repository: any) => Promise<string | null>;
  getOrigins: (discoveryDirs: string[], gitManager: any, host: any) => Promise<unknown>;
  getShellEnvironment: (repository: any, signal: AbortSignal) => Promise<unknown>;
  getOwnerThreadId: (repository: any) => Promise<string | null | undefined>;
  getDefaultRemoteBranch: (repository: any) => Promise<string | null | undefined>;
  getMergeBase: (repository: any, baseBranch: string) => Promise<string | null>;
  getCurrentBranch: (root: string, host: any) => Promise<unknown>;
  getCurrentBranchSnapshot: (repository: any, signal: AbortSignal) => Promise<unknown>;
  getUpstreamBranch: (root: string, args: { host: any; signal: AbortSignal }) => Promise<unknown>;
  getBranchAheadCount: (root: string, args: { host: any; signal: AbortSignal }) => Promise<unknown>;
  getDefaultBranch: (root: string, host: any, signal: AbortSignal) => Promise<unknown>;
  getBaseBranch: (root: string, host: any) => Promise<unknown>;
};

async function resolveOriginUrl(cwd: string, deps: ReadHandlerDependencies) {
  const repository = await deps.gitManager.getRepoRepository(cwd, deps.host);
  return { originUrl: repository == null ? null : await deps.getOriginUrl(repository) };
}

async function resolveOrigins(discoveryDirs: string[], deps: ReadHandlerDependencies) {
  return { origins: await deps.getOrigins(discoveryDirs, deps.gitManager, deps.host) };
}

async function resolveShellEnvironment(cwd: string, signal: AbortSignal, deps: ReadHandlerDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(cwd, deps.host);
  return { shellEnvironment: repository == null ? null : await deps.getShellEnvironment(repository, signal) };
}

async function resolveWorktreeOwner(cwd: string, deps: ReadHandlerDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(cwd, deps.host);
  return { ownerThreadId: repository == null ? null : (await deps.getOwnerThreadId(repository)) ?? null };
}

async function resolveDefaultRemoteBranch(cwd: string, deps: ReadHandlerDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(cwd, deps.host);
  return { branch: repository == null ? null : (await deps.getDefaultRemoteBranch(repository))?.branch ?? null };
}

async function resolveMergeBase(cwd: string, baseBranch: string | null | undefined, deps: ReadHandlerDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(cwd, deps.host);
  return { mergeBaseSha: repository == null || !baseBranch ? null : await deps.getMergeBase(repository, baseBranch) };
}

async function resolveCurrentBranch(root: string, deps: ReadHandlerDependencies) {
  return deps.getCurrentBranch(root, deps.host);
}

async function resolveCurrentBranchSnapshot(root: string, signal: AbortSignal, deps: ReadHandlerDependencies) {
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(root, deps.host);
  return { branch: await deps.getCurrentBranchSnapshot(repository, signal) };
}

async function resolveUpstreamBranch(root: string, signal: AbortSignal, deps: ReadHandlerDependencies) {
  return deps.getUpstreamBranch(root, { host: deps.host, signal });
}

async function resolveBranchAheadCount(root: string, signal: AbortSignal, deps: ReadHandlerDependencies) {
  return deps.getBranchAheadCount(root, { host: deps.host, signal });
}

async function resolveDefaultBranch(root: string, signal: AbortSignal, deps: ReadHandlerDependencies) {
  return deps.getDefaultBranch(root, deps.host, signal);
}

async function resolveBaseBranch(root: string, deps: ReadHandlerDependencies) {
  return deps.getBaseBranch(root, deps.host);
}

export { resolveBaseBranch, resolveBranchAheadCount, resolveCurrentBranch, resolveCurrentBranchSnapshot, resolveDefaultBranch, resolveDefaultRemoteBranch, resolveMergeBase, resolveOriginUrl, resolveOrigins, resolveShellEnvironment, resolveUpstreamBranch, resolveWorktreeOwner };
if (typeof module !== `undefined`) module.exports = { resolveBaseBranch, resolveBranchAheadCount, resolveCurrentBranch, resolveCurrentBranchSnapshot, resolveDefaultBranch, resolveDefaultRemoteBranch, resolveMergeBase, resolveOriginUrl, resolveOrigins, resolveShellEnvironment, resolveUpstreamBranch, resolveWorktreeOwner };
