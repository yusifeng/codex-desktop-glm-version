type RepositoryIdentityDependencies = {
  fetchQueryWithSignal: (queryClient: any, options: any, signal?: AbortSignal) => Promise<any>;
  getConfigQueryMeta: () => any;
  getWorktreeId: (root: string) => Promise<string>;
  isCancelledError: (error: unknown) => boolean;
  originTimeoutMs: number;
  parseRemoteUrl: (url: string) => any;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  staleTime: number;
};

import { buildRepositoryFullName } from './git-repository-identity-policy';

async function getRepositoryIdentity(
  repository: any,
  { isRepoWatched = false, signal }: { isRepoWatched?: boolean; signal?: AbortSignal } = {},
  dependencies: RepositoryIdentityDependencies,
) {
  const { host } = repository;
  const readOrigin = async (querySignal?: AbortSignal) => {
    const result = await dependencies.runGit(
      repository.root,
      [`remote`, `get-url`, `origin`],
      host,
      { signal: querySignal, timeoutMs: dependencies.originTimeoutMs },
    );
    if (!result.success && result.code == null) throw Error(result.stderr);
    return result.success && result.stdout ? result.stdout : null;
  };
  const origin = await (
    isRepoWatched
      ? dependencies
          .fetchQueryWithSignal(
            repository.queryClient,
            {
              queryKey: dependencies.queryKey(repository.root, host, `effective-origin-url`),
              meta: dependencies.getConfigQueryMeta(),
              queryFn: readOrigin,
              staleTime: dependencies.staleTime,
            },
            signal,
          )
          .catch((error) =>
            dependencies.isCancelledError(error) && !signal?.aborted ? readOrigin(signal) : null,
          )
      : readOrigin(signal)
  ).catch(() => null);
  const parsed = origin == null
    ? null
    : dependencies.parseRemoteUrl(origin.replace(/\/+$/, ``));
  const repositoryFullName = buildRepositoryFullName(parsed, origin);
  return {
    repositoryFullName,
    worktreeId: await dependencies.getWorktreeId(repository.root),
  };
}

export { getRepositoryIdentity };
if (typeof module !== `undefined`) module.exports = { getRepositoryIdentity };
