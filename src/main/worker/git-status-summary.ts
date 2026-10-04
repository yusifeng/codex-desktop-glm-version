type GitStatusSummaryDependencies = {
  awaitAbortable: (promise: Promise<any>, signal: AbortSignal) => Promise<any>;
  fetchQueryWithSignal: (queryClient: any, options: any, signal?: AbortSignal) => Promise<any>;
  getQueryMeta: () => any;
  getSafeAttributeFilterOverrides: (repository: any, signal?: AbortSignal) => Promise<string[]>;
  getUntrackedPaths: (repository: any, paths?: any, snapshot?: any, signal?: AbortSignal) => Promise<any>;
  queryKey: (...parts: any[]) => any;
  readCachedStatus: (repository: any, generation: number, force: boolean, signal?: AbortSignal) => Promise<string | null>;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  staleTime: number;
};

function parseTrackedStatus(output: string) {
  let stagedCount = 0;
  let unstagedCount = 0;
  const stagedRenames: Array<{ path: string; previousPath: string }> = [];
  const trackedPaths: string[] = [];
  let offset = 0;
  while (offset < output.length && offset + 1 < output.length) {
    const staged = output[offset];
    const unstaged = output[offset + 1];
    const end = output.indexOf(`\0`, offset);
    if (end === -1) break;
    const path = output.slice(offset + 3, end);
    offset = end + 1;
    if (staged === `?` && unstaged === `?`) continue;
    if (staged !== ` `) stagedCount += 1;
    if (unstaged !== ` `) unstagedCount += 1;
    trackedPaths.push(path);
    if (
      staged === `R` ||
      staged === `C` ||
      unstaged === `R` ||
      unstaged === `C`
    ) {
      const renameEnd = output.indexOf(`\0`, offset);
      if (renameEnd === -1) break;
      const previousPath = output.slice(offset, renameEnd);
      if (staged === `R`) stagedRenames.push({ path, previousPath });
      trackedPaths.push(previousPath);
      offset = renameEnd + 1;
    }
  }
  return {
    type: `success`,
    stagedCount,
    stagedRenames,
    trackedPaths,
    unstagedCount,
    untrackedCount: null,
  };
}

async function getTrackedStatusSummary(
  repository: any,
  reviewSnapshot: any,
  signal: AbortSignal | undefined,
  forceStatusRead: boolean,
  dependencies: GitStatusSummaryDependencies,
) {
  const generation = repository.gitReadGeneration;
  const queryKey = dependencies.queryKey(
    repository.root,
    repository.host,
    `git-status-summary`,
    `${generation}`,
    `tracked-only`,
  );
  const queryFn = async (querySignal: AbortSignal | undefined) => {
    let output = await dependencies.readCachedStatus(
      repository,
      generation,
      forceStatusRead,
      querySignal,
    );
    if (output == null) {
      let configOverrides: string[];
      try {
        configOverrides = await dependencies.getSafeAttributeFilterOverrides(
          repository,
          querySignal,
        );
      } catch {
        return { type: `error`, failureReason: `status_config` };
      }
      const result = await dependencies.runGit(
        repository.root,
        [`status`, `--renames`, `--porcelain=v1`, `-z`, `--untracked-files=no`],
        repository.host,
        { configOverrides, signal: querySignal, trim: false },
      );
      if (!result.success) return { type: `error`, failureReason: `status_command` };
      output = result.stdout;
    }
    return parseTrackedStatus(output);
  };
  const combinedSignal =
    reviewSnapshot == null
      ? signal
      : signal == null
        ? reviewSnapshot.signal
        : AbortSignal.any([reviewSnapshot.signal, signal]);
  const read = () => {
    const query = dependencies.fetchQueryWithSignal(
      repository.queryClient,
      {
        queryKey,
        meta: dependencies.getQueryMeta(),
        queryFn,
        staleTime: dependencies.staleTime,
      },
      combinedSignal,
    );
    return reviewSnapshot == null
      ? query
      : dependencies.awaitAbortable(query, reviewSnapshot.signal);
  };
  const result = reviewSnapshot == null ? await read() : await reviewSnapshot.read(read);
  if (result.type === `error`)
    repository.queryClient.invalidateQueries({
      queryKey,
      exact: true,
      refetchType: `none`,
    });
  return result;
}

async function getStatusSummary(
  repository: any,
  includeUntracked = true,
  reviewSnapshot?: any,
  signal?: AbortSignal,
  forceStatusRead = false,
  dependencies?: GitStatusSummaryDependencies,
): Promise<any> {
  const deps = dependencies!;
  if (!includeUntracked)
    return getTrackedStatusSummary(
      repository,
      reviewSnapshot,
      signal,
      forceStatusRead,
      deps,
    );
  const [untracked, tracked] = await Promise.all([
    deps.getUntrackedPaths(repository, undefined, reviewSnapshot, signal),
    getTrackedStatusSummary(repository, reviewSnapshot, signal, true, deps),
  ]);
  if (tracked.type === `error`) return tracked;
  return untracked.success
    ? { ...tracked, untrackedCount: untracked.paths.length }
    : { type: `error`, failureReason: `untracked_paths` };
}

async function getStatusCounts(
  repository: any,
  includeUntracked = true,
  reviewSnapshot?: any,
  signal?: AbortSignal,
  dependencies?: GitStatusSummaryDependencies,
) {
  let result;
  try {
    result = await getStatusSummary(
      repository,
      includeUntracked,
      reviewSnapshot,
      signal,
      false,
      dependencies,
    );
  } catch (error) {
    if (signal?.aborted) return { type: `error`, failureReason: `canceled` };
    throw error;
  }
  return result.type === `error`
    ? result
    : {
        type: `success`,
        stagedCount: result.stagedCount,
        unstagedCount: result.unstagedCount,
        untrackedCount: result.untrackedCount,
      };
}

export { getStatusCounts, getStatusSummary, getTrackedStatusSummary, parseTrackedStatus };
if (typeof module !== `undefined`)
  module.exports = {
    getStatusCounts,
    getStatusSummary,
    getTrackedStatusSummary,
    parseTrackedStatus,
  };
