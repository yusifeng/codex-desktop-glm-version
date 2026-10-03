type PathApi = {
  relative(from: string, to: string): string;
  sep: string;
  isAbsolute(value: string): boolean;
};

/** Returns whether `candidate` is inside `root` (or is root itself). */
function isWithinPath(pathApi: PathApi, root: string, candidate: string): boolean {
  const relative = pathApi.relative(root, candidate);
  return relative === `` || (relative !== `..` && !relative.startsWith(`..${pathApi.sep}`) && !pathApi.isAbsolute(relative));
}

/** Metadata watcher paths never treat lock files as ref changes. */
function isWatchedRefPath(pathApi: PathApi, root: string, candidate: string): boolean {
  return !candidate.endsWith(`.lock`) && isWithinPath(pathApi, root, candidate);
}

/** Worktree metadata changes are limited to the worktree directory and marker files. */
function isWorktreeTopologyPath(pathApi: PathApi, root: string, candidate: string, markers: Set<string>): boolean {
  if (!isWithinPath(pathApi, root, candidate)) return false;
  const relative = pathApi.relative(root, candidate);
  if (relative === ``) return true;
  const parts = relative.split(pathApi.sep);
  return parts.length === 1 || (parts.length === 2 && markers.has(parts[1]));
}

/** Combines optional repository-state probes, preserving unknown (`null`) state. */
function combineOptionalBooleans(values: Array<boolean | null | undefined>): boolean | null {
  return values.some((value) => value === true) ? true : values.some((value) => value == null) ? null : false;
}

function isMissingPathError(error: unknown): boolean {
  return typeof error === `object` && error !== null && `code` in error &&
    ((error as { code?: unknown }).code === `ENOENT` || (error as { code?: unknown }).code === `ENOTDIR`);
}

export { combineOptionalBooleans, isMissingPathError, isWithinPath, isWatchedRefPath, isWorktreeTopologyPath };
if (typeof module !== `undefined`) module.exports = { combineOptionalBooleans, isMissingPathError, isWithinPath, isWatchedRefPath, isWorktreeTopologyPath };
