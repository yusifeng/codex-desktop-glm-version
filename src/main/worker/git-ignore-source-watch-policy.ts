/** Pure reconciliation predicates for Git ignore-source watches. */

/** Returns whether two discovered ignore path sets contain the same paths. */
function haveSameGitIgnorePaths(current: Set<string>, next: Set<string>): boolean {
  if (current.size !== next.size) return false;
  for (const path of next) if (!current.has(path)) return false;
  return true;
}

/**
 * Returns whether an existing ignore-source watch must restart after a change.
 * Path containment is supplied by the worker's platform-aware path policy.
 */
function shouldRestartGitIgnoreSourceWatch(input: {
  pathApi: unknown;
  retryTimer: unknown;
  sourcePath: string;
  changedPaths: string[];
  isWithinPath: (pathApi: unknown, candidate: string, root: string) => boolean;
}): boolean {
  return input.pathApi != null && input.retryTimer == null &&
    input.changedPaths.some((path) => input.isWithinPath(input.pathApi, path, input.sourcePath));
}

export { haveSameGitIgnorePaths, shouldRestartGitIgnoreSourceWatch };
if (typeof module !== `undefined`) module.exports = { haveSameGitIgnorePaths, shouldRestartGitIgnoreSourceWatch };
