const LOCAL_ENVIRONMENT_CONFIG_PATH_KEY = `codex.localEnvironmentConfigPath`;

type ConfigScope = `local` | `worktree`;

type ConfigScopeDependencies = {
  fetchQueryWithSignal: (
    queryClient: any,
    options: any,
    signal?: AbortSignal,
  ) => Promise<any>;
  getConfigQueryMeta: () => any;
  queryKey: (...parts: any[]) => any;
  runGit: (
    root: string,
    args: string[],
    host: any,
    options: { signal?: AbortSignal },
  ) => Promise<any>;
  staleTime: number;
};

function scopeFlag(scope: ConfigScope) {
  return scope === `local` ? `--local` : `--worktree`;
}

async function readConfigValueForScope(
  root: string,
  key: string,
  scope: ConfigScope,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: Pick<ConfigScopeDependencies, `runGit`>,
) {
  const result = await dependencies.runGit(
    root,
    [`config`, scopeFlag(scope), `--get`, key],
    host,
    { signal },
  );
  return result.success && result.stdout ? result.stdout : null;
}

function getConfigValueForScope(
  repository: any,
  key: string,
  scope: ConfigScope,
  signal: AbortSignal | undefined,
  dependencies: ConfigScopeDependencies,
) {
  const flag = scopeFlag(scope);
  return dependencies.fetchQueryWithSignal(
    repository.queryClient,
    {
      queryKey: dependencies.queryKey(
        repository.root,
        repository.host,
        `config-value-for-scope`,
        scope,
        key,
      ),
      meta: dependencies.getConfigQueryMeta(),
      queryFn: async (querySignal: AbortSignal) => {
        const result = await dependencies.runGit(
          repository.root,
          [`config`, flag, `--get`, key],
          repository.host,
          { signal: signal == null ? undefined : querySignal },
        );
        if (result.success) return result.stdout || null;
        if (
          (result.code === 1 && result.stderr.trim() === ``) ||
          (scope === `worktree` &&
            result.code === 128 &&
            result.stderr.toLowerCase().includes(`worktreeconfig`))
        )
          return null;
        throw Error(
          `git config ${flag} --get ${key} failed: ${
            result.stderr || result.stdout || `exit code ${result.code ?? `unknown`}`
          }`,
        );
      },
      staleTime: dependencies.staleTime,
    },
    signal,
  );
}

function getLocalEnvironmentConfigPath(
  root: string,
  host: any,
  scope: ConfigScope | undefined,
  signal: AbortSignal | undefined,
  dependencies: Pick<ConfigScopeDependencies, `runGit`>,
) {
  return readConfigValueForScope(
    root,
    LOCAL_ENVIRONMENT_CONFIG_PATH_KEY,
    scope ?? `worktree`,
    host,
    signal,
    dependencies,
  );
}

export {
  LOCAL_ENVIRONMENT_CONFIG_PATH_KEY,
  getConfigValueForScope,
  getLocalEnvironmentConfigPath,
  readConfigValueForScope,
};
if (typeof module !== `undefined`)
  module.exports = {
    LOCAL_ENVIRONMENT_CONFIG_PATH_KEY,
    getConfigValueForScope,
    getLocalEnvironmentConfigPath,
    readConfigValueForScope,
  };
