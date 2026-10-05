/** Normalizes the user-facing recent-branches page size at the worker boundary. */
function normalizeRecentBranchesLimit(value: unknown): number {
  return Math.max(1, Math.min((value as number | null | undefined) ?? 10, 100));
}

export { normalizeRecentBranchesLimit };
if (typeof module !== `undefined`) module.exports = { normalizeRecentBranchesLimit };
