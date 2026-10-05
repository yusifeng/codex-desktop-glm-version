/** Pure operation classification for live-query performance telemetry. */

const PERFORMANCE_OPERATIONS = new Set([
  `branch-diff-stats`,
  `review-diff`,
  `review-patch`,
  `review-search`,
  `review-source-line-counts`,
  `review-summary`,
  `status-summary`,
]);

export function resolveGitPerformanceOperation(method: string): string | null {
  return PERFORMANCE_OPERATIONS.has(method) ? method : null;
}

export function mapLiveQueryPerformanceResult(response: any):
  { operation: string; result: unknown } | undefined {
  switch (response.method) {
    case `branch-diff-stats`:
    case `review-summary`:
    case `status-summary`:
      return { operation: response.method, result: response.result };
    case `base-branch`:
    case `branch-ahead-count`:
    case `branch-commits`:
    case `current-branch`:
    case `default-branch`:
    case `list-worktrees`:
    case `recent-branches`:
    case `upstream-branch`:
      return;
    default:
      return;
  }
}

export { PERFORMANCE_OPERATIONS };

if (typeof module !== `undefined`) {
  module.exports = { PERFORMANCE_OPERATIONS, mapLiveQueryPerformanceResult, resolveGitPerformanceOperation };
}
