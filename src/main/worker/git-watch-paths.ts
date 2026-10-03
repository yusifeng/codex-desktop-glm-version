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

function createGitRepoChangedEvent(input: { changeType: string; commonDir: string; hostId: string; rebaseInProgress: boolean | null; root: string; changedPaths?: string[] | null }): Record<string, unknown> {
  return {
    type: `git-repo-changed`,
    changeType: input.changeType,
    commonDir: input.commonDir,
    hostId: input.hostId,
    rebaseInProgress: input.rebaseInProgress,
    root: input.root,
    ...(input.changedPaths == null ? {} : { changedPaths: input.changedPaths }),
  };
}

function nextGitWatcherRetryDelay(currentDelayMs: number, maxDelayMs: number): number {
  return Math.min(currentDelayMs * 2, maxDelayMs);
}

function shouldScheduleGitRepoChange(disposed: boolean, changeType: string, activeChanges: Set<string>, pendingTimers: Map<string, unknown>): boolean {
  return !disposed && !activeChanges.has(changeType) && !pendingTimers.has(changeType);
}

type GitWorkingTreeWatchRefreshAction = `skip` | `apply` | `restart`;

/** Chooses the side effect for a refreshed ignore policy without touching watcher state. */
function getGitWorkingTreeWatchRefreshAction(input: {
  disposed: boolean;
  retryScheduled: boolean;
  policyCurrent: boolean;
  sessionActive: boolean;
  nextDirectories: string[];
  previousDirectories: string[];
}): GitWorkingTreeWatchRefreshAction {
  if (input.disposed || input.retryScheduled || !input.policyCurrent) return `skip`;
  if (
    input.sessionActive &&
    input.nextDirectories.length === input.previousDirectories.length &&
    input.nextDirectories.every((directory, index) => directory === input.previousDirectories[index])
  ) {
    return `apply`;
  }
  return `restart`;
}

function createGitOperationState(flags: { cherryPickInProgress: boolean | null; mergeInProgress: boolean | null; rebaseHead: boolean | null; rebaseMerge: boolean | null; rebaseApply: boolean | null; revertInProgress: boolean | null }): Record<string, boolean | null> {
  return {
    cherryPickInProgress: flags.cherryPickInProgress,
    mergeInProgress: flags.mergeInProgress,
    rebaseInProgress: combineOptionalBooleans([flags.rebaseHead, flags.rebaseMerge, flags.rebaseApply]),
    revertInProgress: flags.revertInProgress,
  };
}

/** Returns the Git marker files used to derive repository operation state. */
function createGitOperationMarkerPaths(pathApi: PathApi & { join(...parts: string[]): string }, gitDir: string): string[] {
  return [
    pathApi.join(gitDir, `CHERRY_PICK_HEAD`),
    pathApi.join(gitDir, `MERGE_HEAD`),
    pathApi.join(gitDir, `REBASE_HEAD`),
    pathApi.join(gitDir, `rebase-merge`),
    pathApi.join(gitDir, `rebase-apply`),
    pathApi.join(gitDir, `REVERT_HEAD`),
  ];
}

function createGitWatchTarget(input: { watchPath: string; recursive: boolean; handler: { changeType: string; shouldHandleChangedPath: (path: string, cache: Map<string, boolean>) => boolean }; metadataDirectory: { parentPath: string; missing: boolean } | null; retryDelayMs: number }): Record<string, unknown> {
  return {
    generation: 0,
    handlers: [input.handler],
    metadataDirectory: input.metadataDirectory,
    recursive: input.recursive,
    retryDelayMs: input.retryDelayMs,
    retryTimer: null,
    session: null,
    sessionDisposePromise: null,
    sessionStartPromise: null,
    watchPath: input.watchPath,
  };
}

/** Selects metadata directories whose changes can affect repository watches. */
function selectGitMetadataRefreshPaths(
  pathApi: PathApi & { join(...parts: string[]): string; dirname(path: string): string },
  commonDir: string,
  changedPaths: string[],
): string[] {
  const refsDir = pathApi.join(commonDir, `refs`);
  const worktreesDir = pathApi.join(commonDir, `worktrees`);
  if (changedPaths.length === 0) return [commonDir];
  return changedPaths.filter((path) =>
    path === refsDir ||
    path === pathApi.join(refsDir, `heads`) ||
    path === pathApi.join(refsDir, `remotes`) ||
    path === pathApi.join(commonDir, `info`) ||
    path === worktreesDir ||
    pathApi.dirname(path) === worktreesDir,
  );
}

/** Decides whether a recovered watcher target should be retried after startup settles. */
function shouldRetryGitWatchTargetAfterStart(input: { recovering: boolean; disposed: boolean; generationUnchanged: boolean; hasSession: boolean; metadataMissing: boolean }): boolean {
  return input.recovering && !input.disposed && input.generationUnchanged && !input.hasSession && !input.metadataMissing;
}

/** Filters changed paths for one watcher handler and normalizes working-tree Git metadata paths. */
function collectGitWatchHandlerPaths(pathApi: (PathApi & { join(...parts: string[]): string }) | null, root: string, handler: { changeType: string; shouldHandleChangedPath: (path: string, cache: Map<string, boolean>) => boolean }, changedPaths: string[], cache: Map<string, boolean>): string[] {
  const workingTree = handler.changeType === `working-tree`;
  return changedPaths.flatMap((path) => {
    if (!handler.shouldHandleChangedPath(path, cache)) return [];
    if (!workingTree) return [path];
    const affected = pathApi == null ? path : getAffectedWorkingTreePath(pathApi, root, path);
    return affected == null ? [] : [affected];
  });
}

/** Guards creation of a watcher retry timer against disposed or removed targets. */
function shouldScheduleGitWatchSessionRetry(input: { disposed: boolean; targetRegistered: boolean; hasRetryTimer: boolean }): boolean {
  return !input.disposed && input.targetRegistered && !input.hasRetryTimer;
}

/** Describes the state transition permitted when a watcher session closes. */
function getGitWatchSessionClosePolicy(input: { disposed: boolean; sessionMatches: boolean; elapsedMs: number; stableThresholdMs: number }): { active: boolean; resetRetryDelay: boolean } {
  return {
    active: !input.disposed && input.sessionMatches,
    resetRetryDelay: input.elapsedMs >= input.stableThresholdMs,
  };
}

export { addPendingWorkingTreePath, collectGitWatchHandlerPaths, combineOptionalBooleans, createGitOperationMarkerPaths, createGitOperationState, createGitRepoChangedEvent, createGitWatchTarget, getAffectedWorkingTreePath, getGitWatchSessionClosePolicy, getGitWorkingTreeWatchRefreshAction, isGitInternalPath, isMissingPathError, isWithinPath, isWatchedRefPath, isWorktreeTopologyPath, nextGitWatcherRetryDelay, requiresGitWatcherRecovery, selectGitMetadataRefreshPaths, shouldRetryGitWatchTargetAfterStart, shouldScheduleGitRepoChange, shouldScheduleGitWatchSessionRetry };
if (typeof module !== `undefined`) module.exports = { addPendingWorkingTreePath, collectGitWatchHandlerPaths, combineOptionalBooleans, createGitOperationMarkerPaths, createGitOperationState, createGitRepoChangedEvent, createGitWatchTarget, getAffectedWorkingTreePath, getGitWatchSessionClosePolicy, getGitWorkingTreeWatchRefreshAction, isGitInternalPath, isMissingPathError, isWithinPath, isWatchedRefPath, isWorktreeTopologyPath, nextGitWatcherRetryDelay, requiresGitWatcherRecovery, selectGitMetadataRefreshPaths, shouldRetryGitWatchTargetAfterStart, shouldScheduleGitRepoChange, shouldScheduleGitWatchSessionRetry };
