type GitWatchCloseDependencies = {
  getWatchKey: (root: string, host: any) => string;
  getCurrentWatch: (key: string) => any;
  getRepository: (root: string, host: any) => any;
  invalidateRepository: (repository: any) => void;
  clearRepositoryCaches: (repository: any) => void;
  removeWatch?: (key: string) => void;
  emit: (event: any) => void;
  logger?: { warning: (message: string, details: any) => void };
};

/** Close one repository watcher, invalidate its caches, and emit the unwatched event. */
function closeGitRepoWatch(
  watch: any,
  host: any,
  emitEvent = true,
  dependencies: GitWatchCloseDependencies,
): Promise<unknown> {
  if (watch.closingPromise != null) return watch.closingPromise;
  const key = dependencies.getWatchKey(watch.root, host);
  if (dependencies.getCurrentWatch(key) === watch) {
    const repository = dependencies.getRepository(watch.root, host);
    dependencies.invalidateRepository(repository);
    dependencies.clearRepositoryCaches(repository);
  }
  watch.isReady = false;
  watch.closingPromise = Promise.resolve()
    .then(() => watch.watcher.dispose())
    .catch((error: unknown) => {
      dependencies.logger?.warning(`Failed to close git repo watch`, { safe: {}, sensitive: { error } });
    })
    .then(() => {
      if (dependencies.getCurrentWatch(key) !== watch) return;
      dependencies.removeWatch?.(key);
      if (emitEvent) {
        dependencies.emit({
          type: `worker-event`,
          event: { type: `git-repo-unwatched`, commonDir: watch.commonDir, hostId: host.id, root: watch.root },
        });
      }
    });
  return watch.closingPromise;
}

export { closeGitRepoWatch };
if (typeof module !== `undefined`) module.exports = { closeGitRepoWatch };
