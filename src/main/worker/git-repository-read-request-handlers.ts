type RepositoryReadDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  runAbortable: <T>(promise: Promise<T>, signal: AbortSignal) => Promise<T>;
  getRepositoryIdentity: (repository: any, options: { signal: AbortSignal }) => Promise<any>;
  getCommitMessageDiff: (cwd: string, includeUnstaged: boolean, gitManager: any, host: any) => Promise<any>;
  getSubmodulePaths: (repository: any, signal: AbortSignal) => Promise<string[]>;
  getReviewSnapshot: (repository: any, generation: unknown) => any;
  catFile: (repository: any, options: any, signal: AbortSignal) => Promise<any>;
  blameFile: (gitManager: any, params: { cwd: string; path: string }, host: any, signal: AbortSignal) => Promise<any>;
  getIndexInfo: (repository: any, signal: AbortSignal) => Promise<any>;
};

async function resolveRepositoryIdentity(cwd: string, deps: RepositoryReadDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(cwd, deps.host);
  return repository == null ? null : deps.getRepositoryIdentity(repository, { signal: deps.signal });
}

async function resolveCommitMessageDiff(params: any, deps: RepositoryReadDependencies) {
  return deps.runAbortable(
    deps.getCommitMessageDiff(params.cwd, params.includeUnstaged, deps.gitManager, deps.host),
    deps.signal,
  );
}

async function resolveSubmodulePaths(root: string, deps: RepositoryReadDependencies) {
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(root, deps.host);
  return { paths: await deps.getSubmodulePaths(repository, deps.signal) };
}

async function resolveCatFile(params: any, deps: RepositoryReadDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(params.cwd, deps.host);
  const snapshot = params.snapshotGeneration == null
    ? undefined
    : deps.getReviewSnapshot(repository, params.snapshotGeneration);
  if (repository == null || (params.snapshotGeneration != null && snapshot == null)) {
    return params.requests.map(() => ({ type: `error`, error: { type: `unknown` } }));
  }
  return deps.catFile(repository, {
    maxObjectBytes: params.maxObjectBytes,
    requests: params.requests,
    reviewSnapshot: snapshot,
  }, deps.signal);
}

async function resolveBlameFile(params: any, deps: RepositoryReadDependencies) {
  return deps.blameFile(deps.gitManager, { cwd: params.cwd, path: params.path }, deps.host, deps.signal);
}

async function resolveIndexInfo(cwd: string, deps: RepositoryReadDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(cwd, deps.host);
  return repository == null ? { lastModified: 0 } : deps.getIndexInfo(repository, deps.signal);
}

async function resolveConfigValue(root: string, key: string, scope: unknown, deps: RepositoryReadDependencies) {
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(root, deps.host);
  return { value: await repository.getConfigValueForScope(key, scope, deps.signal) };
}

export { resolveBlameFile, resolveCatFile, resolveCommitMessageDiff, resolveConfigValue, resolveIndexInfo, resolveRepositoryIdentity, resolveSubmodulePaths };
if (typeof module !== `undefined`) module.exports = { resolveBlameFile, resolveCatFile, resolveCommitMessageDiff, resolveConfigValue, resolveIndexInfo, resolveRepositoryIdentity, resolveSubmodulePaths };
