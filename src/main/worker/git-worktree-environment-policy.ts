/** Select the environment config path persisted for a newly-created worktree. */
export function selectWorktreeEnvironmentPath(
  resolvedPath: string | null | undefined,
  configuredPath: string | null | undefined,
): string | null {
  return resolvedPath ?? configuredPath ?? null;
}

if (typeof module !== "undefined") module.exports = { selectWorktreeEnvironmentPath };
