type ConfigDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
};

import { resolveConfigRefreshRoot } from './git-config-request-policy';

async function setGitConfigValue(params: any, deps: ConfigDependencies) {
  const repository = deps.gitManager.getWorktreeRepositoryForRoot(params.root, deps.host);
  const success = await repository.setConfigValueForScope(params.key, params.value, params.scope, deps.signal);
  const refreshRoot = resolveConfigRefreshRoot(params.root, success, params.scope, params.key);
  return { result: { success }, refreshRoot };
}

export { setGitConfigValue };
if (typeof module !== `undefined`) module.exports = { setGitConfigValue };
