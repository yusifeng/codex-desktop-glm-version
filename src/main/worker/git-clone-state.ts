import {
  hasPartialCloneConfiguration,
  parseGitConfigEntries,
} from "./git-clone-state-policy";

type GitCloneStateDependencies = {
  runGit: (
    root: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
};

const noLazyFetchEnvironment = { GIT_NO_LAZY_FETCH: `1` };
const partialCloneConfigPattern =
  `^(extensions\\.partialclone|remote\\..*\\.(promisor|partialclonefilter))$`;

async function getGitCloneState(
  root: string,
  host: any,
  signal: AbortSignal,
  dependencies: GitCloneStateDependencies,
) {
  const [shallowResult, configResult] = await Promise.all([
    dependencies.runGit(root, [`rev-parse`, `--is-shallow-repository`], host, {
      env: noLazyFetchEnvironment,
      signal,
    }),
    dependencies.runGit(
      root,
      [`config`, `--get-regexp`, partialCloneConfigPattern],
      host,
      {
        allowedNonZeroExitCodes: [1],
        env: noLazyFetchEnvironment,
        signal,
      },
    ),
  ]);
  const configEntries = configResult.success
    ? parseGitConfigEntries(configResult.stdout)
    : new Map<string, string>();
  return {
    isPartialClone: hasPartialCloneConfiguration(configEntries),
    isShallow: shallowResult.success && shallowResult.stdout === `true`,
  };
}

export {
  getGitCloneState,
  hasPartialCloneConfiguration,
  noLazyFetchEnvironment,
  parseGitConfigEntries,
  partialCloneConfigPattern,
};
if (typeof module !== `undefined`)
  module.exports = {
    getGitCloneState,
    hasPartialCloneConfiguration,
    noLazyFetchEnvironment,
    parseGitConfigEntries,
    partialCloneConfigPattern,
  };
