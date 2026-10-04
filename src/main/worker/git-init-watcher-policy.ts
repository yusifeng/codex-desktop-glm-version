/** Pure policy for the git-init watcher reconnect lifecycle. */

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
  isGitInitWatchSetReady,
  nextGitInitReconnectDelay,
  shouldReconnectGitInitWatch,
};
if (typeof module !== `undefined`)
  module.exports = {
    isGitInitWatchSetReady,
    nextGitInitReconnectDelay,
    shouldReconnectGitInitWatch,
  };
