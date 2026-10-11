function selectGitCachedWorktrees<T>(
  worktrees: T[],
  requestedCwds: string[] | null,
  normalizedCwds: string[],
  isRelated: (worktree: T, cwd: string) => boolean,
): T[] {
  if (requestedCwds == null) return worktrees;
  if (requestedCwds.length === 0) return [];
  const matches = worktrees.filter((worktree) => normalizedCwds.some((cwd) => isRelated(worktree, cwd)));
  return matches.length === 0 ? worktrees : matches;
}

export { selectGitCachedWorktrees };
if (typeof module !== `undefined`) module.exports = { selectGitCachedWorktrees };
