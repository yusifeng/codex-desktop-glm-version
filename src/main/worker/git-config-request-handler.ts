type ConfigDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
};

async function setGitConfigValue(params: any, deps: ConfigDependencies) {
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(params.root, deps.host);
  const success = await repository.setConfigValueForScope(params.key, params.value, params.scope, deps.signal);
  const refreshRoot = success && (params.scope !== `worktree` || params.key !== `codex.localEnvironmentConfigPath`)
    ? params.root
    : null;
  return { result: { success }, refreshRoot };
}

export { setGitConfigValue };
if (typeof module !== `undefined`) module.exports = { setGitConfigValue };
