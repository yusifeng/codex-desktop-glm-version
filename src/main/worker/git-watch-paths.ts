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

function getAffectedWorkingTreePath(pathApi: PathApi & { join(...parts: string[]): string }, root: string, changedPath: string): string | null {
  const parts = pathApi.relative(root, changedPath).split(pathApi.sep);
  const gitIndex = parts.indexOf(`.git`);
  if (gitIndex < 1) return changedPath;
  const marker = parts[gitIndex + 1];
  return marker !== `HEAD` && marker !== `packed-refs` && marker !== `refs`
    ? null
    : pathApi.join(root, ...parts.slice(0, gitIndex));
}

function isGitInternalPath(pathApi: PathApi, commonDir: string, root: string, candidate: string): boolean {
  return isWithinPath(pathApi, commonDir, candidate) || isWithinPath(pathApi, `${root}${pathApi.sep}.git`, candidate);
}

function addPendingWorkingTreePath(pathApi: (PathApi & { join(...parts: string[]): string }) | null, root: string, pendingPaths: Set<string> | null, changedPath: string, maxPaths: number): Set<string> | null {
  if (pendingPaths == null) return null;
  if (pathApi != null && [...pendingPaths].some((path) => isWithinPath(pathApi, path, changedPath))) return pendingPaths;
  if (pathApi != null) {
    for (const path of pendingPaths) if (isWithinPath(pathApi, changedPath, path)) pendingPaths.delete(path);
  }
  pendingPaths.add(changedPath);
  if (pendingPaths.size <= maxPaths) return pendingPaths;
  if (pathApi == null) return null;
  const roots = new Set<string>();
  for (const path of pendingPaths) {
    const relative = pathApi.relative(root, path);
    if (relative === `` || relative === `..` || relative.startsWith(`..${pathApi.sep}`) || pathApi.isAbsolute(relative)) return null;
    roots.add(pathApi.join(root, relative.split(pathApi.sep, 1)[0]));
    if (roots.size > maxPaths) return null;
  }
  return roots;
}

function requiresGitWatcherRecovery(targets: Array<{ metadataDirectory?: { missing?: boolean }; session?: { coverage?: { recursive?: boolean } } | null; recursive: boolean }>, ignorePolicyRequiresRecovery: boolean): boolean {
  return ignorePolicyRequiresRecovery || targets.some((target) =>
    !target.metadataDirectory?.missing &&
    (target.session == null || (target.recursive && !target.session.coverage?.recursive)),
  );
}

export { addPendingWorkingTreePath, combineOptionalBooleans, getAffectedWorkingTreePath, isGitInternalPath, isMissingPathError, isWithinPath, isWatchedRefPath, isWorktreeTopologyPath, requiresGitWatcherRecovery };
if (typeof module !== `undefined`) module.exports = { addPendingWorkingTreePath, combineOptionalBooleans, getAffectedWorkingTreePath, isGitInternalPath, isMissingPathError, isWithinPath, isWatchedRefPath, isWorktreeTopologyPath, requiresGitWatcherRecovery };
