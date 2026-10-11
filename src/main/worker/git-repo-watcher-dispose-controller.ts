type GitRepoWatcherDisposeDependencies = {
  getDisposePromise: () => Promise<void> | null;
  setDisposePromise: (promise: Promise<void>) => void;
  markDisposed: () => void;
  disposeIgnorePolicy: () => Promise<void> | void;
  disposeSessions: () => Promise<void>[];
  clearWatchTargets: () => void;
  disposeControllers: () => void;
  clearIgnoreSourceWatches: () => void;
  clearChangedIgnoreSourcePaths: () => void;
  pendingMetadataRefresh: () => Promise<void>;
};

/** Coordinates GitRepoWatcher disposal and preserves idempotent promise/cleanup ordering. */
function disposeGitRepoWatcher(dependencies: GitRepoWatcherDisposeDependencies) {
  const existing = dependencies.getDisposePromise();
  if (existing != null) return existing;
  dependencies.markDisposed();
  const ignorePolicy = dependencies.disposeIgnorePolicy();
  const sessions = dependencies.disposeSessions();
  dependencies.clearWatchTargets();
  dependencies.disposeControllers();
  dependencies.clearIgnoreSourceWatches();
  dependencies.clearChangedIgnoreSourcePaths();
  const promise = Promise.all([
    ...sessions,
    dependencies.pendingMetadataRefresh(),
    Promise.resolve(ignorePolicy),
  ]).then(() => {});
  dependencies.setDisposePromise(promise);
  return promise;
}

export { disposeGitRepoWatcher };
if (typeof module !== `undefined`) module.exports = { disposeGitRepoWatcher };
