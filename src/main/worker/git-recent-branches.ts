const MAX_RECENT_BRANCHES = 100;
const SHORT_LIVED_CACHE_MS = 250;

class RecentBranchesQueryError extends Error {}

type RecentBranchesDependencies = {
  fetchQueryWithSignal: (queryClient: any, options: any, signal?: AbortSignal) => Promise<any>;
  getLiveQueryMeta: () => any;
  getShortLivedQueryMeta: () => any;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  staleTime: number;
};

async function getRecentBranches(
  repository: any,
  limit: number,
  signal: AbortSignal | undefined,
  { live = false } = {},
  dependencies: RecentBranchesDependencies,
) {
  const effectiveLimit = Math.max(1, Math.min(limit, MAX_RECENT_BRANCHES));
  const generation = repository.watchScopedGitReadGeneration;
  const queryKey = dependencies.queryKey(
    repository.root,
    repository.host,
    `recent-branches`,
    live ? `live` : `short-lived`,
    ...(live ? [String(generation)] : []),
  );
  try {
    const branches = await dependencies.fetchQueryWithSignal(
      repository.queryClient,
      {
        queryKey,
        gcTime: live ? undefined : SHORT_LIVED_CACHE_MS,
        meta: live
          ? dependencies.getLiveQueryMeta()
          : dependencies.getShortLivedQueryMeta(),
        queryFn: async (querySignal: AbortSignal) => {
          const { success, stdout } = await dependencies.runGit(
            repository.root,
            [
              `for-each-ref`,
              `--count=${MAX_RECENT_BRANCHES}`,
              `--sort=-committerdate`,
              `refs/heads`,
              `--format=%(refname:short)`,
            ],
            repository.host,
            { signal: querySignal },
          );
          if (!success) throw new RecentBranchesQueryError();
          return stdout
            .split(`\n`)
            .map((branch: string) => branch.trim())
            .filter((branch: string) => branch.length > 0);
        },
        staleTime: live ? dependencies.staleTime : SHORT_LIVED_CACHE_MS,
      },
      signal,
    );
    return branches.slice(0, effectiveLimit);
  } catch (error) {
    if (error instanceof RecentBranchesQueryError || signal?.aborted) return [];
    throw error;
  } finally {
    if (live && generation !== repository.watchScopedGitReadGeneration)
      repository.queryClient.removeQueries({ queryKey, exact: true });
  }
}

export { getRecentBranches, MAX_RECENT_BRANCHES };
if (typeof module !== `undefined`)
  module.exports = { getRecentBranches, MAX_RECENT_BRANCHES };
