/** Pure policy for the git-init watcher reconnect lifecycle. */

/** Stable identity for the desired git-init watcher session. */
function getGitInitWatchKey(hostId: string, cwd: string): string {
  return `${hostId}|${cwd}`;
}

/**
 * Describes whether a desired watcher identity changed.  The manager owns the
 * dispose/start side effects; this keeps the identity transition testable.
 */
function getGitInitWatchTransition(
  previousKey: string | null,
  nextKey: string,
): { changed: boolean; disposePrevious: boolean } {
  const changed = previousKey !== nextKey;
  return { changed, disposePrevious: changed && previousKey != null };
}

function shouldReconnectGitInitWatch(reason: unknown): boolean {
  return reason === `connection-closed` || reason === `watch-error`;
}

function nextGitInitReconnectDelay(
  currentDelayMs: number,
  maxDelayMs: number,
): number {
  return Math.min(currentDelayMs * 2, maxDelayMs);
}

function isGitInitWatchSetReady(
  sessions: Set<unknown>,
  rootSession: unknown,
  gitSession?: unknown,
): boolean {
  return (
    sessions.has(rootSession) &&
    (gitSession == null || sessions.has(gitSession))
  );
}

export {
  getGitInitWatchKey,
  getGitInitWatchTransition,
  isGitInitWatchSetReady,
  nextGitInitReconnectDelay,
  shouldReconnectGitInitWatch,
};
if (typeof module !== `undefined`)
  module.exports = {
    getGitInitWatchKey,
    getGitInitWatchTransition,
    isGitInitWatchSetReady,
    nextGitInitReconnectDelay,
    shouldReconnectGitInitWatch,
  };
