/** Pure partitioning of discovered watcher paths; session setup/disposal stays in git-watch-paths.ts. */
export function partitionGitWorktreeWatchPaths(existingPaths: string[], discoveredPaths: string[]): { stalePaths: string[]; newPaths: string[] } {
  const existing = new Set(existingPaths);
  const discovered = new Set(discoveredPaths);
  return { stalePaths: existingPaths.filter((path) => !discovered.has(path)), newPaths: discoveredPaths.filter((path) => !existing.has(path)) };
}
if (typeof module !== "undefined") module.exports = { partitionGitWorktreeWatchPaths };
