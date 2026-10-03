type SubmodulePathsDependencies = {
  awaitAbortable: (promise: Promise<any>, signal: AbortSignal) => Promise<any>;
  getQueryMeta: () => any;
  isMissingPathError: (error: unknown) => boolean;
  normalizeGitPath: (path: string) => string;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  staleTime: number;
};

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
      const paths = result.stdout
        .split(`\n`)
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .map((line: string) => {
          const fields = line.split(/\s+/);
          return dependencies.normalizeGitPath(fields[fields.length - 1] ?? ``);
        })
        .filter((path: string) => path.length > 0);
      return Array.from(new Set(paths));
    },
    staleTime: dependencies.staleTime,
  });
}

export { getSubmodulePaths };
if (typeof module !== `undefined`) module.exports = { getSubmodulePaths };
