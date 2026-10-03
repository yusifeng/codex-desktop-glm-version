type GitBranchAheadDependencies = {
  getCurrentBranch: (repository: any) => Promise<string | null | undefined>;
  getDefaultRemoteBranch: (
    repository: any,
  ) => Promise<
    | { branch?: string | null; remote?: string | null }
    | null
    | undefined
  >;
  getMergeBase: (
    repository: any,
    branch: string,
  ) => Promise<string | null | undefined>;
  getQueryMeta: () => any;
  getRemotes: (repository: any) => Promise<string[]>;
  getUpstreamBranch: (
    repository: any,
    branch: string,
    signal: AbortSignal,
  ) => Promise<string | null | undefined>;
  queryKey: (...parts: any[]) => any;
  runGit: (
    cwd: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
};

function countCommits(
  repository: any,
  revisionArgs: string[],
  signal: AbortSignal,
  dependencies: GitBranchAheadDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(
      repository.root,
      repository.host,
      `commit-count`,
      revisionArgs,
    ),
    gcTime: 250,
    meta: dependencies.getQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`rev-list`, `--count`, ...revisionArgs],
        repository.host,
        {
          allowedNonZeroExitCodes: [128, 1],
          signal,
        },
      );
      if (!result.success || !result.stdout) return null;
      const count = Number.parseInt(result.stdout, 10);
      return Number.isNaN(count) ? null : count;
    },
    staleTime: 250,
  });
}

async function getBranchAheadCount(
  root: string,
  gitManager: any,
  host: any,
  signal: AbortSignal,
  dependencies: GitBranchAheadDependencies,
) {
  const repository = gitManager.getWorktreeRepositoryForRoot(root, host);
  const defaultRemoteBranch = await dependencies.getDefaultRemoteBranch(
    repository,
  );
  const defaultBranch = defaultRemoteBranch?.branch ?? null;
  let remote = defaultRemoteBranch?.remote ?? null;
  remote ??= (await dependencies.getRemotes(repository))[0] ?? null;

  const upstream = await dependencies.getUpstreamBranch(
    repository,
    (await dependencies.getCurrentBranch(repository)) ?? `HEAD`,
    signal,
  );
  const remoteUpstream =
    remote != null && upstream?.startsWith(`remotes/${remote}/`)
      ? upstream.slice(8)
      : upstream;
  if (
    remote != null &&
    remoteUpstream?.startsWith(`${remote}/`) &&
    (
      await dependencies.runGit(
        repository.root,
        [
          `merge-base`,
          `--is-ancestor`,
          `HEAD`,
          `refs/remotes/${remoteUpstream}`,
        ],
        host,
        {
          allowedNonZeroExitCodes: [1, 128],
          signal,
        },
      )
    ).code === 0
  )
    return { commitsAhead: 0 };

  if (remote != null) {
    const remoteCount = await countCommits(
      repository,
      [`HEAD`, `--not`, `--remotes=${remote}`],
      signal,
      dependencies,
    );
    if (remoteCount != null) return { commitsAhead: remoteCount };
  }
  if (upstream != null)
    return {
      commitsAhead:
        (await countCommits(
          repository,
          [`${upstream}..HEAD`],
          signal,
          dependencies,
        )) ?? 0,
    };
  if (defaultBranch == null) return { commitsAhead: 0 };

  const mergeBase = await dependencies.getMergeBase(
    repository,
    defaultBranch.includes(`/`) || remote == null
      ? defaultBranch
      : `${remote}/${defaultBranch}`,
  );
  return mergeBase == null
    ? { commitsAhead: 0 }
    : {
        commitsAhead:
          (await countCommits(
            repository,
            [`${mergeBase}..HEAD`],
            signal,
            dependencies,
          )) ?? 0,
      };
}

export { countCommits, getBranchAheadCount };

if (typeof module !== `undefined`)
  module.exports = { countCommits, getBranchAheadCount };
