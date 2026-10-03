type RefResolutionDependencies = {
  getQueryMeta: () => any;
  normalizeSha: (sha: string) => string;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  staleTime: number;
};

function isGitObjectId(value: string) {
  return /^[0-9a-f]{7,40}$/i.test(value);
}

async function resolveGitRefSha(
  repository: any,
  ref: string,
  signal: AbortSignal | undefined,
  { fresh = false } = {},
  dependencies: RefResolutionDependencies,
) {
  const queryKey = dependencies.queryKey(repository.root, repository.host, `ref-sha`, ref);
  if (fresh)
    await repository.queryClient.invalidateQueries({
      queryKey,
      exact: true,
      refetchType: `none`,
    });
  return repository.queryClient.fetchQuery({
    queryKey,
    meta: dependencies.getQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`rev-parse`, `--verify`, `--quiet`, ref],
        repository.host,
        { allowedNonZeroExitCodes: [1], signal },
      );
      if (!result.success) throw Error(`Git ref lookup failed`);
      const sha = result.stdout.trim();
      if (sha && !isGitObjectId(sha))
        throw Error(`Git ref lookup returned an invalid object ID`);
      return sha ? dependencies.normalizeSha(sha) : null;
    },
    staleTime: dependencies.staleTime,
  });
}

export { isGitObjectId, resolveGitRefSha };
if (typeof module !== `undefined`) module.exports = { isGitObjectId, resolveGitRefSha };
