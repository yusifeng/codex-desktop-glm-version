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
  const hostname = parsed?.host.toLowerCase();
  const url = parsed != null && origin?.includes(`://`) ? new URL(origin) : null;
  const port =
    (url?.port === `22` &&
      (url.protocol === `ssh:` || url.protocol === `git+ssh:` || url.protocol === `ssh+git:`)) ||
    (url?.protocol === `git:` && url.port === `9418`)
      ? ``
      : url?.port;
  let repositoryFullName = null;
  if (parsed != null) {
    const path = hostname === `github.com`
      ? `${parsed.owner}/${parsed.repo}`.toLowerCase()
      : `${parsed.owner}/${parsed.repo}`;
    repositoryFullName = hostname === `github.com` && !port
      ? path
      : `${hostname}${port ? `:${port}` : ``}/${path}`;
  }
  return {
    repositoryFullName,
    worktreeId: await dependencies.getWorktreeId(repository.root),
  };
}

export { getRepositoryIdentity };
if (typeof module !== `undefined`) module.exports = { getRepositoryIdentity };
