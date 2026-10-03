type ReadHandlerDependencies = {
  gitManager: any;
  host: any;
  getOriginUrl: (repository: any) => Promise<string | null>;
  getOrigins: (discoveryDirs: string[], gitManager: any, host: any) => Promise<unknown>;
  getShellEnvironment: (repository: any, signal: AbortSignal) => Promise<unknown>;
  getOwnerThreadId: (repository: any) => Promise<string | null | undefined>;
  getDefaultRemoteBranch: (repository: any) => Promise<{ branch?: string | null } | null | undefined>;
  getMergeBase: (repository: any, baseBranch: string) => Promise<string | null>;
  getCurrentBranch: (root: string, host: any) => Promise<unknown>;
  getCurrentBranchSnapshot: (repository: any, signal: AbortSignal) => Promise<unknown>;
  getUpstreamBranch: (root: string, args: { host: any; signal: AbortSignal }) => Promise<unknown>;
  getBranchAheadCount: (root: string, args: { host: any; signal: AbortSignal }) => Promise<unknown>;
  getDefaultBranch: (root: string, host: any, signal: AbortSignal) => Promise<unknown>;
  getBaseBranch: (root: string, host: any) => Promise<unknown>;
  getRecentBranches: (params: any, args: { host: any; signal: AbortSignal }) => Promise<unknown>;
  branchExists: (root: string, branch: string, host: any, signal: AbortSignal) => Promise<boolean>;
  createBranch: (params: any, gitManager: any, host: any, signal: AbortSignal) => Promise<unknown>;
  resolveStartingRef: (repository: any, ref: string, signal: AbortSignal) => Promise<unknown>;
  getBranchCommits: (repository: any, baseBranch: string, signal: AbortSignal) => Promise<unknown>;
  getReviewCommitLineCounts: (repository: any, commits: unknown, hideWhitespace: boolean, signal: AbortSignal) => Promise<unknown>;
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

async function resolveRecentBranches(params: any, signal: AbortSignal, deps: ReadHandlerDependencies) {
  return deps.getRecentBranches(params, { host: deps.host, signal });
}

async function resolveBranchExists(root: string, branch: string, signal: AbortSignal, deps: ReadHandlerDependencies) {
  return { exists: await deps.branchExists(root, branch, deps.host, signal) };
}

async function createGitBranch(params: any, signal: AbortSignal, deps: ReadHandlerDependencies) {
  const { branch, cwd, failIfExists, mode, startPoint } = params;
  return deps.createBranch({ branch, cwd, failIfExists, mode, startPoint }, deps.gitManager, deps.host, signal);
}

async function resolveWorktreeStartingRef(root: string, ref: string, signal: AbortSignal, deps: ReadHandlerDependencies) {
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(root, deps.host);
  return deps.resolveStartingRef(repository, ref, signal);
}

async function resolveBranchCommits(root: string, baseBranch: string, signal: AbortSignal, deps: ReadHandlerDependencies) {
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(root, deps.host);
  return { commits: await deps.getBranchCommits(repository, baseBranch, signal) };
}

async function resolveReviewCommitLineCounts(root: string, commits: unknown, hideWhitespace: boolean, signal: AbortSignal, deps: ReadHandlerDependencies) {
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(root, deps.host);
  return deps.getReviewCommitLineCounts(repository, commits, hideWhitespace, signal);
}

export { createGitBranch, resolveBaseBranch, resolveBranchAheadCount, resolveBranchCommits, resolveBranchExists, resolveCurrentBranch, resolveCurrentBranchSnapshot, resolveDefaultBranch, resolveDefaultRemoteBranch, resolveMergeBase, resolveOriginUrl, resolveOrigins, resolveRecentBranches, resolveReviewCommitLineCounts, resolveShellEnvironment, resolveUpstreamBranch, resolveWorktreeStartingRef, resolveWorktreeOwner };
if (typeof module !== `undefined`) module.exports = { createGitBranch, resolveBaseBranch, resolveBranchAheadCount, resolveBranchCommits, resolveBranchExists, resolveCurrentBranch, resolveCurrentBranchSnapshot, resolveDefaultBranch, resolveDefaultRemoteBranch, resolveMergeBase, resolveOriginUrl, resolveOrigins, resolveRecentBranches, resolveReviewCommitLineCounts, resolveShellEnvironment, resolveUpstreamBranch, resolveWorktreeStartingRef, resolveWorktreeOwner };
