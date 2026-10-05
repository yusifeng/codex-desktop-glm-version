/** Pure failure projection for optional worktree setup scripts. */
export function getWorktreeSetupFailure(
  result: { status?: string; error?: string | null } | null | undefined,
): string | null {
  if (result?.status !== "failed") return null;
  return result.error ?? "Setup script failed";
}

if (typeof module !== "undefined") module.exports = { getWorktreeSetupFailure };
