type SubmodulePathsDependencies = {
  awaitAbortable: (promise: Promise<any>, signal: AbortSignal) => Promise<any>;
  getQueryMeta: () => any;
  isMissingPathError: (error: unknown) => boolean;
  normalizeGitPath: (path: string) => string;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  staleTime: number;
};

import { parseSubmodulePathOutput } from './git-submodule-paths-policy';

function getSubmodulePaths(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: SubmodulePathsDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `submodule-paths`),
    meta: dependencies.getQueryMeta(),
    queryFn: async () => {
      try {
        const gitmodulesPath = (await repository.host.platformPath()).join(
          repository.root,
          `.gitmodules`,
        );
        const statPromise = repository.host.stat(gitmodulesPath, { bypassCache: true });
        await (signal == null
          ? statPromise
          : dependencies.awaitAbortable(statPromise, signal));
      } catch (error) {
        if (signal?.aborted) throw error;
        if (dependencies.isMissingPathError(error)) return [];
      }
      const result = await dependencies.runGit(
        repository.root,
        [`config`, `--file`, `.gitmodules`, `--get-regexp`, `path`],
        repository.host,
        { allowedNonZeroExitCodes: [1], signal },
      );
      if (!result.success || !result.stdout) return [];
      return parseSubmodulePathOutput(result.stdout, dependencies.normalizeGitPath);
    },
    staleTime: dependencies.staleTime,
  });
}

export { getSubmodulePaths };
if (typeof module !== `undefined`) module.exports = { getSubmodulePaths };
