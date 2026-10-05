type SafeAttributeFilterDependencies = {
  fetchQueryWithSignal: (
    queryClient: any,
    options: any,
    signal: AbortSignal | undefined,
  ) => Promise<string[]>;
  getQueryMeta: () => any;
  queryKey: (...parts: any[]) => any;
  runGit: (
    root: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
  staleTime: number;
};

import { baseAttributeOverrides, createSafeAttributeFilterOverrides, filterConfigPattern, parseFilterDriverName } from './git-safe-attribute-filters-policy';

async function getSafeAttributeFilterOverrides(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: SafeAttributeFilterDependencies,
): Promise<string[]> {
  const queryKey = dependencies.queryKey(
    repository.root,
    repository.host,
    `safe-attribute-filter-overrides`,
  );
  const generation = repository.gitConfigReadGeneration;
  const overrides = await dependencies.fetchQueryWithSignal(
    repository.queryClient,
    {
      queryKey,
      meta: dependencies.getQueryMeta(),
      staleTime: dependencies.staleTime,
      queryFn: async (querySignal: AbortSignal) => {
        const result = await dependencies.runGit(
          repository.root,
          [`config`, `--name-only`, `--get-regexp`, filterConfigPattern],
          repository.host,
          {
            allowedNonZeroExitCodes: [1],
            signal: signal == null ? undefined : querySignal,
          },
        );
        if (!result.success)
          throw Error(
            `git config filter discovery failed: ${result.stderr || result.stdout}`,
          );
        return createSafeAttributeFilterOverrides(result.stdout);
      },
    },
    signal,
  );
  if (repository.gitConfigReadGeneration === generation) return overrides;
  repository.queryClient.invalidateQueries({
    queryKey,
    exact: true,
    refetchType: `none`,
  });
  return getSafeAttributeFilterOverrides(repository, signal, dependencies);
}

export {
  baseAttributeOverrides,
  createSafeAttributeFilterOverrides,
  filterConfigPattern,
  getSafeAttributeFilterOverrides,
  parseFilterDriverName,
};
if (typeof module !== `undefined`)
  module.exports = {
    baseAttributeOverrides,
    createSafeAttributeFilterOverrides,
    filterConfigPattern,
    getSafeAttributeFilterOverrides,
    parseFilterDriverName,
  };
