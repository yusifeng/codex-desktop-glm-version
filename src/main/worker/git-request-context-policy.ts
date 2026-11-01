/** Pure request-context projections shared by Git worker telemetry and dispatch. */

type GitRequest = { method: string; params?: Record<string, any> };

function resolveRequestRoot(request: GitRequest): string | undefined {
  const params = request.params ?? {};
  switch (request.method) {
    case `status-summary`:
    case `review-summary`:
    case `branch-diff-stats`:
    case `list-worktrees`:
      return typeof params.cwd === `string` ? params.cwd : undefined;
    case `recent-branches`:
    case `current-branch`:
    case `upstream-branch`:
    case `branch-ahead-count`:
    case `default-branch`:
    case `base-branch`:
    case `branch-commits`:
      return typeof params.root === `string` ? params.root : undefined;
    default:
      return undefined;
  }
}

function resolveReviewSource(request: GitRequest): unknown {
  return [`review-diff`, `review-patch`, `review-search`, `review-summary`].includes(request.method)
    ? request.params?.source
    : null;
}

function resolveReviewCwd(request: GitRequest): string | null {
  return [`branch-diff-stats`, `review-diff`, `review-patch`, `review-search`, `review-summary`, `status-summary`].includes(request.method)
    ? (typeof request.params?.cwd === `string` ? request.params.cwd : null)
    : null;
}

function isGitRequestFailure(result: unknown): boolean {
  if (!result || typeof result !== `object`) return false;
  const value = result as Record<string, unknown>;
  return value.type === `error` || value.success === false || value.status === `error` || value.status === `command-error`;
}

/** Maps worker request exceptions to the stable telemetry disposition names. */
function classifyGitRequestException(error: unknown, gitUnavailableError: unknown, isStaleSnapshot: (value: unknown) => boolean): string {
  if (error === gitUnavailableError) return `git_unavailable`;
  if (isStaleSnapshot(error)) return `stale_snapshot`;
  return `exception`;
}

/** Applies command-attribution failures to the public review result shape. */
function applyGitReviewAttribution<T>(result: T, stats: { failedCommandCount?: number } | null): T | Record<string, unknown> {
  const value = result as Record<string, any> | null;
  if (value?.type !== `expected` || stats == null || stats.failedCommandCount === 0) return result;
  return { type: `error`, source: value.source, failureReason: `review_comparison` };
}

/** Projects review-summary live-query results when the comparison command failed. */
function projectGitReviewSummaryResult(response: { method: string; result: any }, stats: { failedCommandCount: number } | null): { method: string; result: any } {
  if (response.method !== `review-summary`) return response;
  const result = response.result;
  if (result?.type !== `expected` || stats == null || stats.failedCommandCount === 0) return { ...response, result };
  return {
    ...response,
    result: { type: `error`, source: result.source, failureReason: `review_comparison` },
  };
}

/** Collects stable request context fields used by Git performance envelopes. */
function resolveGitRequestPerformanceContext(request: GitRequest): { root?: string; reviewCwd: string | null; reviewSource: unknown } {
  return {
    root: resolveRequestRoot(request),
    reviewCwd: resolveReviewCwd(request),
    reviewSource: resolveReviewSource(request),
  };
}

export { applyGitReviewAttribution, classifyGitRequestException, isGitRequestFailure, projectGitReviewSummaryResult, resolveGitRequestPerformanceContext, resolveRequestRoot, resolveReviewCwd, resolveReviewSource };
if (typeof module !== `undefined`) module.exports = { applyGitReviewAttribution, classifyGitRequestException, isGitRequestFailure, projectGitReviewSummaryResult, resolveGitRequestPerformanceContext, resolveRequestRoot, resolveReviewCwd, resolveReviewSource };
