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

async function readConfigValue(
  root: string,
  keys: string[],
  host: any,
  signal: AbortSignal | undefined,
  dependencies: Pick<ConfigScopeDependencies, `runGit`>,
) {
  const result = await dependencies.runGit(root, [`config`, `--get`, ...keys], host, { signal });
  return result.success && result.stdout ? result.stdout : null;
}

function getConfigValue(
  repository: any,
  keys: string[],
  signal: AbortSignal | undefined,
  dependencies: ConfigScopeDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `config-value`, keys),
    meta: dependencies.getConfigQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`config`, `--get`, ...keys],
        repository.host,
        { signal },
      );
      return result.success && result.stdout ? result.stdout : null;
    },
    staleTime: dependencies.staleTime,
  });
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

async function setConfigValueForScope(
  root: string,
  key: string,
  value: string,
  scope: ConfigScope,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: Pick<ConfigScopeDependencies, `runGit`>,
) {
  const args = [`config`, scopeFlag(scope), key, value];
  const result = await dependencies.runGit(root, args, host, { signal });
  if (result.success || scope !== `worktree`) return result.success;
  if (!result.stderr.toLowerCase().includes(`worktreeconfig`)) return false;
  const enable = await dependencies.runGit(
    root,
    [`config`, `extensions.worktreeConfig`, `true`],
    host,
    { signal },
  );
  return enable.success
    ? (await dependencies.runGit(root, args, host, { signal })).success
    : false;
}

export {
  LOCAL_ENVIRONMENT_CONFIG_PATH_KEY,
  getConfigValue,
  getConfigValueForScope,
  getLocalEnvironmentConfigPath,
  readConfigValue,
  readConfigValueForScope,
  setConfigValueForScope,
};
if (typeof module !== `undefined`)
  module.exports = {
    LOCAL_ENVIRONMENT_CONFIG_PATH_KEY,
    getConfigValue,
    getConfigValueForScope,
    getLocalEnvironmentConfigPath,
    readConfigValue,
    readConfigValueForScope,
    setConfigValueForScope,
  };
