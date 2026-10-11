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

export { classifyGitRequestException, isGitRequestFailure, resolveRequestRoot, resolveReviewCwd, resolveReviewSource };
if (typeof module !== `undefined`) module.exports = { classifyGitRequestException, isGitRequestFailure, resolveRequestRoot, resolveReviewCwd, resolveReviewSource };
