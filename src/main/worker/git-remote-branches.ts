const DEFAULT_REMOTE = `origin`;
import {
  parseRemoteHeadBranch,
  parseRemoteShowDefaultBranch,
  parseRemoteNames,
  parseUpstreamRef,
  selectConventionalBranch,
} from "./git-remote-branches-policy";

type RemoteBranchDependencies = {
  getConfigQueryMeta: () => any;
  getRemoteRefsQueryMeta: () => any;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options?: any) => Promise<any>;
  staleTime: number;
};

function getLocallyKnownDefaultBranch(
  repository: any,
  remote = DEFAULT_REMOTE,
  dependencies: RemoteBranchDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(
      repository.root,
      repository.host,
      `locally-known-default-branch`,
      remote,
    ),
    meta: dependencies.getRemoteRefsQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`symbolic-ref`, `--quiet`, `refs/remotes/${remote}/HEAD`],
        repository.host,
        { allowedNonZeroExitCodes: [1] },
      );
      if (!result.success || !result.stdout) return null;
      return parseRemoteHeadBranch(result.stdout, remote);
    },
    staleTime: dependencies.staleTime,
  });
}

function fetchRemoteDefaultBranch(
  repository: any,
  remote: string,
  dependencies: RemoteBranchDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `remote-default-branch`, remote),
    meta: dependencies.getRemoteRefsQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`remote`, `show`, remote],
        repository.host,
        { timeoutMs: 10_000 },
      );
      if (!result.success || !result.stdout) return null;
      return parseRemoteShowDefaultBranch(result.stdout);
    },
    staleTime: dependencies.staleTime,
  });
}

async function getDefaultBranchForRemote(
  repository: any,
  remote = DEFAULT_REMOTE,
  dependencies: RemoteBranchDependencies,
) {
  return (
    (await getLocallyKnownDefaultBranch(repository, remote, dependencies)) ||
    fetchRemoteDefaultBranch(repository, remote, dependencies)
  );
}

function getOrderedRemotes(repository: any, dependencies: RemoteBranchDependencies) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `ordered-remotes`),
    meta: dependencies.getConfigQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(repository.root, [`remote`], repository.host);
      if (!result.success || !result.stdout) return [];
      return parseRemoteNames(result.stdout, DEFAULT_REMOTE);
    },
    staleTime: dependencies.staleTime,
  });
}

function getUpstreamRef(
  repository: any,
  ref: string,
  signal: AbortSignal | undefined,
  dependencies: RemoteBranchDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `upstream-ref`, ref),
    meta: dependencies.getConfigQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`rev-parse`, `--abbrev-ref`, `--symbolic-full-name`, `${ref}@{u}`],
        repository.host,
        { allowedNonZeroExitCodes: [128, 1], signal },
      );
      return result.success ? parseUpstreamRef(result.stdout) : null;
    },
    staleTime: dependencies.staleTime,
  });
}

function hasRemoteTrackingBranch(
  repository: any,
  remote: string,
  branch: string,
  dependencies: RemoteBranchDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `remote-branch`, remote, branch),
    meta: dependencies.getRemoteRefsQueryMeta(),
    queryFn: async () =>
      (
        await dependencies.runGit(
          repository.root,
          [`show-ref`, `--verify`, `--quiet`, `refs/remotes/${remote}/${branch}`],
          repository.host,
          { allowedNonZeroExitCodes: [1] },
        )
      ).code === 0,
    staleTime: dependencies.staleTime,
  });
}

async function getConventionalDefaultBranch(
  repository: any,
  remote: string,
  dependencies: RemoteBranchDependencies,
) {
  const mainAvailable = await hasRemoteTrackingBranch(repository, remote, `main`, dependencies);
  const masterAvailable = mainAvailable
    ? false
    : await hasRemoteTrackingBranch(repository, remote, `master`, dependencies);
  return selectConventionalBranch(mainAvailable, masterAvailable);
}

async function selectDefaultRemoteBranch(
  repository: any,
  remotes: string[],
  dependencies: RemoteBranchDependencies,
) {
  if (remotes.length === 0) return null;
  for (const remote of remotes) {
    const branch = await getDefaultBranchForRemote(repository, remote, dependencies);
    if (branch) return { remote, branch };
    const conventionalBranch = await getConventionalDefaultBranch(
      repository,
      remote,
      dependencies,
    );
    if (conventionalBranch != null) return { remote, branch: conventionalBranch };
  }
  return null;
}

async function getDefaultRemoteBranch(repository: any, dependencies: RemoteBranchDependencies) {
  return selectDefaultRemoteBranch(
    repository,
    await getOrderedRemotes(repository, dependencies),
    dependencies,
  );
}

export {
  DEFAULT_REMOTE,
  fetchRemoteDefaultBranch,
  getConventionalDefaultBranch,
  getDefaultBranchForRemote,
  getDefaultRemoteBranch,
  getLocallyKnownDefaultBranch,
  getOrderedRemotes,
  getUpstreamRef,
  hasRemoteTrackingBranch,
  selectDefaultRemoteBranch,
};
if (typeof module !== `undefined`)
  module.exports = {
    DEFAULT_REMOTE,
    fetchRemoteDefaultBranch,
    getConventionalDefaultBranch,
    getDefaultBranchForRemote,
    getDefaultRemoteBranch,
    getLocallyKnownDefaultBranch,
    getOrderedRemotes,
    getUpstreamRef,
    hasRemoteTrackingBranch,
    selectDefaultRemoteBranch,
  };
