type GitInitWatcherDependencies = {
  createLogger: (tag: string) => any;
  debounce: (callback: (...args: any[]) => void, delayMs: number) => any;
  isMissingPathError: (error: unknown) => boolean;
  randomUUID: () => string;
  setTimeout: (callback: () => void, delayMs: number) => any;
  clearTimeout: (timer: any) => void;
  initialReconnectDelayMs: number;
  maxReconnectDelayMs: number;
};

class GitInitWatcher {
  options: any;
  dependencies: GitInitWatcherDependencies;
  logger: any;
  checkForGitDebounced: any;
  sessions = new Set<any>();
  disposed = false;
  reconnectDelayMs: number;
  reconnectTimer: any = null;

  constructor(options: any, dependencies: GitInitWatcherDependencies) {
    this.options = options;
    this.dependencies = dependencies;
    this.logger = dependencies.createLogger(`git-init-watcher`);
    this.reconnectDelayMs = dependencies.initialReconnectDelayMs;
    this.checkForGitDebounced = dependencies.debounce((gitDirectoryPath) => {
      this.checkForGitDirectory(gitDirectoryPath);
    }, 250);
  }

  async start() {
    let gitDirectoryPath: string;
    let pathSeparator: string;
    try {
      const path = await this.options.host.platformPath();
      gitDirectoryPath = path.join(this.options.cwd, `.git`);
      pathSeparator = path.sep;
    } catch (error) {
      this.logWatchFailure(error);
      return false;
    }
    const started = await this.startSessions({
      checkExistingGitDirectory: this.options.watchMode !== `watch-git-metadata`,
      gitDirectoryPath,
      pathSeparator,
    });
    if (!started && !this.disposed) {
      this.scheduleReconnect(gitDirectoryPath, pathSeparator);
      return true;
    }
    return started;
  }

  dispose() {
    this.disposed = true;
    this.checkForGitDebounced.cancel();
    if (this.reconnectTimer != null) {
      this.dependencies.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.disposeSessions();
  }

  async startSessions({
    checkExistingGitDirectory,
    gitDirectoryPath,
    pathSeparator,
  }: any) {
    if (this.disposed) return false;
    let rootSession;
    try {
      rootSession = await this.startWatch(
        this.options.cwd,
        ({ changedPaths }: any) => {
          if (
            changedPaths.length === 0 ||
            changedPaths.some(
              (changedPath: string) =>
                changedPath === gitDirectoryPath ||
                changedPath.startsWith(`${gitDirectoryPath}${pathSeparator}`),
            )
          )
            this.checkForGitDebounced(gitDirectoryPath);
        },
        gitDirectoryPath,
        pathSeparator,
      );
    } catch (error) {
      this.logWatchFailure(error);
      return false;
    }
    if (rootSession == null) return false;

    let gitSession = null;
    if (this.options.watchMode === `watch-git-metadata`) {
      try {
        gitSession = await this.startWatch(
          gitDirectoryPath,
          () => this.checkForGitDebounced(gitDirectoryPath),
          gitDirectoryPath,
          pathSeparator,
        );
      } catch (error) {
        let gitDirectoryMissing = false;
        try {
          gitDirectoryMissing = !(
            await this.options.host.stat(gitDirectoryPath, {
              bypassCache: true,
            })
          ).isDirectory();
        } catch (statError) {
          gitDirectoryMissing =
            this.dependencies.isMissingPathError(statError);
        }
        if (gitDirectoryMissing) {
          this.logger.warning(
            `Failed to watch git path; keeping workspace root watch`,
            {
              safe: {},
              sensitive: { cwd: this.options.cwd, error },
            },
          );
          return this.sessions.has(rootSession);
        }
        this.disposeSessions();
        this.logWatchFailure(error);
        return false;
      }
      if (
        gitSession == null ||
        !this.sessions.has(rootSession) ||
        !this.sessions.has(gitSession)
      ) {
        this.disposeSessions();
        return false;
      }
    }

    if (checkExistingGitDirectory)
      await this.checkForGitDirectory(gitDirectoryPath);
    return (
      !this.disposed &&
      this.sessions.has(rootSession) &&
      (gitSession == null || this.sessions.has(gitSession))
    );
  }

  async startWatch(
    watchedPath: string,
    onChange: (event: any) => void,
    gitDirectoryPath: string,
    pathSeparator: string,
  ) {
    const session = await this.options.host.startFileWatch({
      path: watchedPath,
      recursive: false,
      renameEventHandling: `changed-path`,
      watchId: `git-init-${this.dependencies.randomUUID()}`,
      onChange,
    });
    if (this.disposed) {
      await session.dispose();
      return null;
    }
    this.sessions.add(session);
    session.closed.then((result: any) => {
      if (this.sessions.delete(session)) {
        if (result.reason === `watch-error`)
          this.logger.warning(`Git init watcher failed`, {
            safe: {},
            sensitive: { cwd: this.options.cwd, error: result.error },
          });
        if (
          result.reason === `connection-closed` ||
          result.reason === `watch-error`
        ) {
          this.disposeSessions();
          this.scheduleReconnect(gitDirectoryPath, pathSeparator);
        }
      }
    });
    return session;
  }

  scheduleReconnect(gitDirectoryPath: string, pathSeparator: string) {
    if (this.disposed || this.reconnectTimer != null) return;
    const delayMs = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(
      this.reconnectDelayMs * 2,
      this.dependencies.maxReconnectDelayMs,
    );
    this.reconnectTimer = this.dependencies.setTimeout(() => {
      this.reconnectTimer = null;
      this.startSessions({
        checkExistingGitDirectory: true,
        gitDirectoryPath,
        pathSeparator,
      }).then((started) => {
        if (started)
          this.reconnectDelayMs =
            this.dependencies.initialReconnectDelayMs;
        else this.scheduleReconnect(gitDirectoryPath, pathSeparator);
      });
    }, delayMs);
  }

  disposeSessions() {
    const sessions = [...this.sessions];
    this.sessions.clear();
    for (const session of sessions) session.dispose();
  }

  logWatchFailure(error: unknown) {
    this.logger.warning(`Failed to watch workspace root for git init`, {
      safe: {},
      sensitive: { cwd: this.options.cwd, error },
    });
  }

  async checkForGitDirectory(gitDirectoryPath: string) {
    if (this.disposed) return;
    try {
      await this.options.host.stat(gitDirectoryPath, { bypassCache: true });
    } catch {
      return;
    }
    if (!this.disposed) {
      this.dispose();
      this.options.onGitInit();
    }
  }
}

export { GitInitWatcher };
if (typeof module !== `undefined`) module.exports = { GitInitWatcher };
