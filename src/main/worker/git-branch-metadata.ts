type GitBranchMetadataDependencies = {
  getCurrentBranch: (repository: any) => Promise<string | null | undefined>;
  getDefaultRemoteBranch: (
    repository: any,
  ) => Promise<
    | { branch?: string | null; remote?: string | null }
    | null
    | undefined
  >;
  normalizeBranch: (branch: string) => string;
  normalizeCwd: (cwd: string) => string;
  readBranchSnapshot: (
    repository: any,
    signal: AbortSignal,
  ) => Promise<{ branch: string } | null | undefined>;
};

function normalizeLocalBranchRef(
  branch: string,
  dependencies: Pick<GitBranchMetadataDependencies, `normalizeBranch`>,
) {
  return dependencies.normalizeBranch(
    branch.startsWith(`refs/heads/`) ? branch.slice(11) : branch,
  );
}

async function getBranchMetadata(
  gitManager: any,
  cwd: string,
  host: any,
  signal: AbortSignal,
  dependencies: GitBranchMetadataDependencies,
) {
  const repository = await gitManager.getWorktreeRepository(
    dependencies.normalizeCwd(cwd),
    host,
  );
  if (!repository)
    return {
      gitRoot: null,
      branch: null,
      baseBranch: null,
      baseBranchRemote: null,
    };

  const [currentBranch, defaultRemoteBranch] = await Promise.all([
    dependencies.getCurrentBranch(repository),
    dependencies.getDefaultRemoteBranch(repository),
  ]);
  let branch = currentBranch;
  if (!branch) {
    const snapshot = await dependencies.readBranchSnapshot(repository, signal);
    branch = snapshot
      ? normalizeLocalBranchRef(snapshot.branch, dependencies)
      : null;
  }

  return {
    gitRoot: repository.root,
    branch,
    baseBranch: defaultRemoteBranch?.branch ?? null,
    baseBranchRemote: defaultRemoteBranch?.remote ?? null,
  };
}

export { getBranchMetadata, normalizeLocalBranchRef };

if (typeof module !== `undefined`)
  module.exports = { getBranchMetadata, normalizeLocalBranchRef };
