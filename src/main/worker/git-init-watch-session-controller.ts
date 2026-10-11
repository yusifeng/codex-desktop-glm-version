type GitInitWatchSessionDependencies = {
  startFileWatch: (options: any) => Promise<any>;
  watchedPath: string;
  onChange: (event: any) => void;
  watchId: string;
  isDisposed: () => boolean;
  disposeSession: (session: any) => Promise<void>;
  sessions: Set<any>;
  logger: { warning: (message: string, details: any) => void };
  cwd: string;
  shouldReconnect: (reason: string) => boolean;
  disposeSessions: () => void;
  scheduleReconnect: () => void;
};

/** Owns one Git-init file-watch session and its close/reconnect lifecycle. */
async function startGitInitWatchSession(dependencies: GitInitWatchSessionDependencies): Promise<any | null> {
  const { startFileWatch, watchedPath, onChange, watchId, isDisposed, disposeSession, sessions, logger, cwd,
    shouldReconnect, disposeSessions, scheduleReconnect } = dependencies;
  const session = await startFileWatch({ path: watchedPath, recursive: false, renameEventHandling: `changed-path`, watchId, onChange });
  if (isDisposed()) {
    await disposeSession(session);
    return null;
  }
  sessions.add(session);
  session.closed.then((result: any) => {
    if (!sessions.delete(session)) return;
    if (result.reason === `watch-error`) logger.warning(`Git init watcher failed`, { safe: {}, sensitive: { cwd, error: result.error } });
    if (shouldReconnect(result.reason)) {
      disposeSessions();
      scheduleReconnect();
    }
  });
  return session;
}

export { startGitInitWatchSession };
if (typeof module !== `undefined`) module.exports = { startGitInitWatchSession };
