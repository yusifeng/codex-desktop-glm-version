type ReviewDependencies = {
  gitManager: any;
  host: any;
  attribution: unknown;
  signal: AbortSignal;
  runAbortable: <T>(promise: Promise<T>, signal: AbortSignal) => Promise<T>;
  maxUntrackedFiles: (operationSource: unknown) => number;
  applyAttribution: <T>(result: T, attribution: unknown) => T;
  getStatusSummary: (repository: any, includeUntrackedFiles: boolean, extra: unknown, signal: AbortSignal) => Promise<any>;
  getBranchDiffStats: (...args: any[]) => Promise<any>;
  getReviewSummary: (args: any) => Promise<any>;
  getReviewSourceLineCounts: (args: any) => Promise<any>;
  getReviewSnapshot: (repository: any, generation: unknown) => any;
  getReviewDiffFallback: (source: unknown, files: unknown) => any;
  getReviewDiff: (snapshot: any, source: unknown, files: unknown, options: any) => Promise<any>;
  staleSnapshotError: { new (...args: any[]): Error };
  searchReview: (...args: any[]) => Promise<any>;
  getReviewPatch: (...args: any[]) => Promise<any>;
};

const outcome = (operation: string, result: unknown) => ({ result, performance: { operation, result } });

async function resolveStatusSummary(params: any, deps: ReviewDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(params.cwd, deps.host);
  const result = repository == null
    ? { type: `error`, failureReason: `repository_unavailable` }
    : await deps.getStatusSummary(repository, params.includeUntrackedFiles, undefined, deps.signal);
  return outcome(`status-summary`, result);
}

async function resolveBranchDiffStats(params: any, deps: ReviewDependencies) {
  const result = await deps.runAbortable(deps.getBranchDiffStats(String(params.cwd), deps.gitManager, deps.host, params.baseBranch, params.hideWhitespace, params.includeUntrackedFiles, deps.maxUntrackedFiles(params.operationSource)), deps.signal);
  return outcome(`branch-diff-stats`, result);
}

async function resolveReviewSummary(params: any, deps: ReviewDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(params.cwd, deps.host);
  const raw = repository == null
    ? { type: `error`, source: params.source, failureReason: `repository_unavailable` }
    : await deps.runAbortable(deps.getReviewSummary({ ...params, maxUntrackedFiles: deps.maxUntrackedFiles(params.operationSource), worktreeRepo: repository }), deps.signal);
  const result = deps.applyAttribution(raw, deps.attribution);
  return outcome(`review-summary`, result);
}

async function resolveReviewSourceLineCounts(params: any, deps: ReviewDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(params.cwd, deps.host);
  const result = repository == null
    ? params.sources.map((source: unknown) => ({ source, type: `error`, failureReason: `repository_unavailable` }))
    : await deps.runAbortable(deps.getReviewSourceLineCounts({ ...params, maxUntrackedFiles: deps.maxUntrackedFiles(params.operationSource), worktreeRepo: repository }), deps.signal);
  return outcome(`review-source-line-counts`, result);
}

async function resolveReviewDiff(params: any, deps: ReviewDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(params.cwd, deps.host);
  const snapshot = deps.getReviewSnapshot(repository, params.snapshotGeneration);
  const fallback = deps.getReviewDiffFallback(params.source, params.files);
  const stale = { type: `stale-snapshot`, source: params.source };
  let result: any;
  if (snapshot == null) result = stale;
  else {
    try {
      result = { type: `success`, ...(await deps.runAbortable(deps.getReviewDiff(snapshot, params.source, params.files, { baseBranch: params.baseBranch, commitSha: params.commitSha, hideWhitespace: params.hideWhitespace }), deps.signal)) };
    } catch (error) {
      result = error instanceof deps.staleSnapshotError ? stale : { type: `success`, ...fallback };
    }
  }
  return outcome(`review-diff`, result);
}

async function resolveReviewSearch(params: any, deps: ReviewDependencies) {
  const result = await deps.runAbortable(deps.searchReview(String(params.cwd), params.source, params.query, deps.gitManager, deps.host, deps.signal, params.baseBranch, params.commitSha, params.includeUntrackedFiles, deps.maxUntrackedFiles(params.operationSource)), deps.signal);
  return outcome(`review-search`, result);
}

async function resolveReviewPatch(params: any, deps: ReviewDependencies) {
  const result = await deps.runAbortable(deps.getReviewPatch(String(params.cwd), params.source, deps.gitManager, deps.host, undefined, params.baseBranch, params.commitSha, deps.maxUntrackedFiles(params.operationSource)), deps.signal);
  return outcome(`review-patch`, result);
}

export { resolveBranchDiffStats, resolveReviewDiff, resolveReviewPatch, resolveReviewSearch, resolveReviewSourceLineCounts, resolveReviewSummary, resolveStatusSummary };
if (typeof module !== `undefined`) module.exports = { resolveBranchDiffStats, resolveReviewDiff, resolveReviewPatch, resolveReviewSearch, resolveReviewSourceLineCounts, resolveReviewSummary, resolveStatusSummary };
