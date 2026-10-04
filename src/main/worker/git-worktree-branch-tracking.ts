type WorktreeBranchTrackingDependencies = {
  getCurrentBranch: (repository: any) => Promise<string | null>;
  getOrderedRemotes: (repository: any) => Promise<string[]>;
  localBranchExists: (
    root: string,
    branch: string,
    host: any,
    signal?: AbortSignal,
  ) => Promise<boolean>;
  logger: { warning: (message: string, detail: any) => void };
  resolveRef: (
    repository: any,
    ref: string,
    signal?: AbortSignal,
    options?: { fresh?: boolean },
  ) => Promise<string | null>;
  runGit: (root: string, args: string[], host: any) => Promise<any>;
};

async function deleteLocalTrackingBranch(
  repository: any,
  branch: string,
  dependencies: WorktreeBranchTrackingDependencies,
) {
  const result = await dependencies.runGit(
    repository.root,
    [`branch`, `-D`, branch],
    repository.host,
  );
  if (!result.success)
    dependencies.logger.warning(`Failed to cleanup local tracking branch`, {
      safe: {},
      sensitive: { error: result.stderr || result.stdout },
    });
  await dependencies.resolveRef(
    repository,
    `refs/heads/${branch}`,
    undefined,
    { fresh: true },
  );
}

async function createLocalTrackingBranch(
  repository: any,
  startingRef: string,
  signal: AbortSignal | undefined,
  dependencies: WorktreeBranchTrackingDependencies,
) {
  if (!startingRef.startsWith(`refs/remotes/`)) return null;
  const remoteRef = startingRef.slice(`refs/remotes/`.length);
  const remote = (await dependencies.getOrderedRemotes(repository)).find((candidate) =>
    remoteRef.startsWith(`${candidate}/`),
  );
  if (remote == null) return null;
  const branch = remoteRef.slice(remote.length + 1);
  if (
    !branch ||
    branch === `HEAD` ||
    (await dependencies.resolveRef(repository, `refs/heads/${branch}`, signal)) != null
  )
    return null;
  const result = await dependencies.runGit(
    repository.root,
    [`branch`, `--track`, branch, startingRef],
    repository.host,
  );
  if (!result.success) throw Error(result.stderr || result.stdout);
  try {
    await dependencies.resolveRef(
      repository,
      `refs/heads/${branch}`,
      undefined,
      { fresh: true },
    );
    return branch;
  } catch (error) {
    await deleteLocalTrackingBranch(repository, branch, dependencies);
    throw error;
  }
}

async function resolveCreatedWorktreeBranchName(
  repository: any,
  startingState: any,
  startingRef: string,
  signal: AbortSignal | undefined,
  dependencies: WorktreeBranchTrackingDependencies,
) {
  if (
    startingState.type === `working-tree` ||
    startingState.branchName === `HEAD` ||
    startingState.branchName === `@`
  )
    return dependencies.getCurrentBranch(repository);
  if (startingRef.startsWith(`refs/heads/`)) {
    const branch = startingRef.slice(`refs/heads/`.length);
    return (await dependencies.localBranchExists(
      repository.root,
      branch,
      repository.host,
      signal,
    ))
      ? branch
      : null;
  }
  if (!startingRef.startsWith(`refs/remotes/`)) return null;
  const remoteRef = startingRef.slice(`refs/remotes/`.length);
  const remote = (await dependencies.getOrderedRemotes(repository)).find((candidate) =>
    remoteRef.startsWith(`${candidate}/`),
  );
  if (remote == null) return null;
  const branch = remoteRef.slice(remote.length + 1);
  if (!branch || branch === `HEAD`) return null;
  return (await dependencies.localBranchExists(
    repository.root,
    branch,
    repository.host,
    signal,
  ))
    ? branch
    : null;
}

export {
  createLocalTrackingBranch,
  deleteLocalTrackingBranch,
  resolveCreatedWorktreeBranchName,
};
if (typeof module !== `undefined`)
  module.exports = {
    createLocalTrackingBranch,
    deleteLocalTrackingBranch,
    resolveCreatedWorktreeBranchName,
  };
