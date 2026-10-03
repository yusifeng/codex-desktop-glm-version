const CURRENT_BRANCH_SNAPSHOT_STALE_MS = 15_000;

type CurrentBranchDependencies = {
  fetchQueryWithSignal: (queryClient: any, options: any, signal?: AbortSignal) => Promise<any>;
  getQueryMeta: () => any;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  staleTime: number;
};

function invalidateCurrentBranchQuery(
  repository: any,
  queryName: string,
  dependencies: CurrentBranchDependencies,
) {
  repository.queryClient.invalidateQueries({
    queryKey: dependencies.queryKey(repository.root, repository.host, queryName),
    exact: true,
    refetchType: `none`,
  });
}

async function readHeadBranchName(
  repository: any,
  options: { signal?: AbortSignal; staleTime?: number } | undefined,
  dependencies: CurrentBranchDependencies,
): Promise<any> {
  const result = await dependencies.fetchQueryWithSignal(
    repository.queryClient,
    {
      queryKey: dependencies.queryKey(repository.root, repository.host, `head-branch-name`),
      meta: dependencies.getQueryMeta(),
      queryFn: async (signal: AbortSignal) => ({
        generation: repository.gitHeadReadGeneration,
        result: await dependencies.runGit(
          repository.root,
          [`rev-parse`, `--abbrev-ref`, `HEAD`],
          repository.host,
          { signal },
        ),
      }),
      staleTime: options?.staleTime ?? dependencies.staleTime,
    },
    options?.signal,
  );
  if (repository.gitHeadReadGeneration === result.generation) return result.result;
  invalidateCurrentBranchQuery(repository, `head-branch-name`, dependencies);
  return readHeadBranchName(repository, options, dependencies);
}

async function readSymbolicHeadBranchName(
  repository: any,
  options: { signal?: AbortSignal; staleTime?: number } | undefined,
  dependencies: CurrentBranchDependencies,
): Promise<any> {
  const result = await dependencies.fetchQueryWithSignal(
    repository.queryClient,
    {
      queryKey: dependencies.queryKey(
        repository.root,
        repository.host,
        `symbolic-head-branch-name`,
      ),
      meta: dependencies.getQueryMeta(),
      queryFn: async (signal: AbortSignal) => ({
        generation: repository.gitHeadReadGeneration,
        result: await dependencies.runGit(
          repository.root,
          [`symbolic-ref`, `--quiet`, `--short`, `HEAD`],
          repository.host,
          { allowedNonZeroExitCodes: [1], signal },
        ),
      }),
      staleTime: options?.staleTime ?? dependencies.staleTime,
    },
    options?.signal,
  );
  if (repository.gitHeadReadGeneration === result.generation) return result.result;
  invalidateCurrentBranchQuery(repository, `symbolic-head-branch-name`, dependencies);
  return readSymbolicHeadBranchName(repository, options, dependencies);
}

async function getCurrentBranchState(repository: any, dependencies: CurrentBranchDependencies) {
  const head = await readHeadBranchName(repository, undefined, dependencies);
  if (head.success && head.stdout && head.stdout !== `HEAD`)
    return { type: `branch`, branch: head.stdout };
  const symbolicHead = await readSymbolicHeadBranchName(repository, undefined, dependencies);
  if (symbolicHead.success && symbolicHead.stdout)
    return { type: `branch`, branch: symbolicHead.stdout };
  return symbolicHead.code === 1 ? { type: `detached` } : { type: `unknown` };
}

async function getCurrentBranch(repository: any, dependencies: CurrentBranchDependencies) {
  const state = await getCurrentBranchState(repository, dependencies);
  return state.type === `branch` ? state.branch : null;
}

async function getCurrentBranchSnapshot(
  repository: any,
  signal: AbortSignal | undefined,
  dependencies: CurrentBranchDependencies,
) {
  const options = { signal, staleTime: CURRENT_BRANCH_SNAPSHOT_STALE_MS };
  const head = await readHeadBranchName(repository, options, dependencies);
  if (!head.success && head.stdout !== `HEAD`) {
    invalidateCurrentBranchQuery(repository, `head-branch-name`, dependencies);
    throw Error(head.stderr || `Failed to read current Git branch`);
  }
  if (head.stdout && head.stdout !== `HEAD`) return head.stdout;
  const symbolicHead = await readSymbolicHeadBranchName(repository, options, dependencies);
  if (!symbolicHead.success) {
    invalidateCurrentBranchQuery(repository, `symbolic-head-branch-name`, dependencies);
    throw Error(symbolicHead.stderr || `Failed to read symbolic Git branch`);
  }
  return symbolicHead.stdout || null;
}

export {
  CURRENT_BRANCH_SNAPSHOT_STALE_MS,
  getCurrentBranch,
  getCurrentBranchSnapshot,
  getCurrentBranchState,
};
if (typeof module !== `undefined`)
  module.exports = {
    CURRENT_BRANCH_SNAPSHOT_STALE_MS,
    getCurrentBranch,
    getCurrentBranchSnapshot,
    getCurrentBranchState,
  };
