type StartingStateDependencies = {
  collectTrackedDiff: (
    repository: any,
    configOverrides: any,
    signal: AbortSignal | undefined,
  ) => Promise<any>;
  getCurrentBranch: (repository: any) => Promise<string | null>;
  getLocallyKnownDefaultBranch: (repository: any) => Promise<string | null>;
  getOrderedRemotes: (repository: any) => Promise<string[]>;
  normalizeCwd: (cwd: string) => string;
  resolveRef: (repository: any, ref: string, signal?: AbortSignal, options?: any) => Promise<string | null>;
  resolveStartingRef: (repository: any, ref: string, signal?: AbortSignal) => Promise<any>;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
};

async function resolveStartingReference(
  cwd: string,
  startingState: any,
  gitManager: any,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: StartingStateDependencies,
) {
  if (startingState.type === `working-tree`) return `HEAD`;
  const repository = await gitManager.getWorktreeRepository(
    dependencies.normalizeCwd(cwd),
    host,
  );
  if (startingState.type === `branch`) {
    if (
      repository == null ||
      startingState.branchName === `HEAD` ||
      startingState.branchName === `@`
    )
      return startingState.branchName;
    const remoteRef = startingState.remoteRef;
    if (remoteRef == null)
      return (
        (await dependencies.resolveStartingRef(
          repository,
          startingState.branchName,
          signal,
        ))?.ref ?? startingState.branchName
      );
    const remote = (await dependencies.getOrderedRemotes(repository))
      .filter((candidate) => remoteRef.startsWith(`refs/remotes/${candidate}/`))
      .sort((left, right) => right.length - left.length)[0];
    if (remote == null) return remoteRef;
    const branchName = remoteRef.slice(`refs/remotes/${remote}/`.length);
    const fetched = await dependencies.runGit(
      repository.root,
      [`fetch`, remote, `+refs/heads/${branchName}:${remoteRef}`],
      repository.host,
      { signal },
    );
    if (!fetched.success)
      throw Error(`Failed to fetch latest ${remote}/${branchName}: ${fetched.stderr || fetched.stdout}`);
    const sha = await dependencies.resolveRef(repository, remoteRef, signal, { fresh: true });
    if (sha == null) throw Error(`Failed to resolve latest ${remote}/${branchName}`);
    return sha;
  }
  return repository == null
    ? `HEAD`
    : (await dependencies.getCurrentBranch(repository)) ??
        (await dependencies.getLocallyKnownDefaultBranch(repository)) ??
        `HEAD`;
}

async function collectStartingDiff(
  cwd: string,
  startingState: any,
  gitManager: any,
  host: any,
  configOverrides: any,
  signal: AbortSignal | undefined,
  dependencies: StartingStateDependencies,
) {
  if (startingState.type !== `working-tree`) return null;
  const repository = await gitManager.getWorktreeRepository(
    dependencies.normalizeCwd(cwd),
    host,
  );
  if (repository == null) throw Error(`Failed to collect working tree diff`);
  const result = await dependencies.collectTrackedDiff(repository, configOverrides, signal);
  if (result.type === `error`)
    throw Error(
      result.error.type === `diff-too-large`
        ? `Working tree diff exceeds the ${result.error.limitBytes}-byte limit`
        : `Failed to collect working tree diff`,
    );
  return result.unifiedDiff;
}

async function resolveWorktreeStartingState(
  cwd: string,
  startingState: any,
  gitManager: any,
  host: any,
  configOverrides: any,
  signal: AbortSignal | undefined,
  dependencies: StartingStateDependencies,
) {
  const [startingRef, startingDiff] = await Promise.all([
    resolveStartingReference(cwd, startingState, gitManager, host, signal, dependencies),
    collectStartingDiff(
      cwd,
      startingState,
      gitManager,
      host,
      configOverrides,
      signal,
      dependencies,
    ),
  ]);
  return { startingRef, startingDiff };
}

export { collectStartingDiff, resolveStartingReference, resolveWorktreeStartingState };
if (typeof module !== `undefined`)
  module.exports = { collectStartingDiff, resolveStartingReference, resolveWorktreeStartingState };
