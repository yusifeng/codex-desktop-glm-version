const { isGitInitWatchSetReady } = require(`./git-init-watcher-policy`);

type GitInitSessionStartDependencies = {
  isDisposed: () => boolean;
  watchMode: string;
  checkExistingGitDirectory: boolean;
  gitDirectoryPath: string;
  pathSeparator: string;
  cwd: string;
  startWatch: (watchedPath: string, onChange: (event: any) => void) => Promise<any>;
  checkForGitDirectory: (gitDirectoryPath: string) => Promise<void>;
  isMetadataDirectoryUnavailable: (gitDirectoryPath: string, error: unknown) => Promise<boolean>;
  logger: { warning: (message: string, details: any) => void };
  sessions: Set<any>;
  disposeSessions: () => void;
  checkForGitDebounced: (gitDirectoryPath: string) => void;
  shouldCheckGitInitPath: (changedPaths: string[], gitDirectoryPath: string, pathSeparator: string) => boolean;
};

/** Coordinates root/metadata Git-init watch startup and recovery fallback. */
async function startGitInitSessions(dependencies: GitInitSessionStartDependencies): Promise<boolean> {
  const { isDisposed, watchMode, checkExistingGitDirectory, gitDirectoryPath, pathSeparator, cwd, startWatch,
    checkForGitDirectory, isMetadataDirectoryUnavailable, logger, sessions, disposeSessions, checkForGitDebounced,
    shouldCheckGitInitPath } = dependencies;
  if (isDisposed()) return false;
  let rootSession: any;
  try {
    rootSession = await startWatch(cwd, ({ changedPaths }: any) => {
      if (shouldCheckGitInitPath(changedPaths, gitDirectoryPath, pathSeparator)) checkForGitDebounced(gitDirectoryPath);
    });
  } catch (error) {
    logger.warning(`Failed to watch workspace root for git init`, { safe: {}, sensitive: { cwd, error } });
    return false;
  }
  if (rootSession == null) return false;
  let gitSession: any = null;
  if (watchMode === `watch-git-metadata`) {
    try {
      gitSession = await startWatch(gitDirectoryPath, () => checkForGitDebounced(gitDirectoryPath));
    } catch (error) {
      if (await isMetadataDirectoryUnavailable(gitDirectoryPath, error)) {
        logger.warning(`Failed to watch git path; keeping workspace root watch`, { safe: {}, sensitive: { cwd, error } });
        return sessions.has(rootSession);
      }
      disposeSessions();
      logger.warning(`Failed to watch workspace root for git init`, { safe: {}, sensitive: { cwd, error } });
      return false;
    }
    if (gitSession == null || !isGitInitWatchSetReady(sessions, rootSession, gitSession)) {
      disposeSessions();
      return false;
    }
  }
  if (checkExistingGitDirectory) await checkForGitDirectory(gitDirectoryPath);
  return !isDisposed() && isGitInitWatchSetReady(sessions, rootSession, gitSession);
}

export { startGitInitSessions };
if (typeof module !== `undefined`) module.exports = { startGitInitSessions };
