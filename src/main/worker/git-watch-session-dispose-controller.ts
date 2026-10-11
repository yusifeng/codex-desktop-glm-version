type GitWatchSessionDisposeDependencies = {
  target: any;
  cancelRetry: (target: any) => void;
  disposeSession: (session: any) => Promise<void>;
  onDisposeError: (error: unknown) => void;
  updateRecovery: () => void;
  isDisposed: () => boolean;
};

/** Coordinates one Git watch target's session teardown and idempotent dispose promise. */
function disposeGitWatchSession(dependencies: GitWatchSessionDisposeDependencies) {
  const target = dependencies.target;
  const session = target.session;
  const startPromise = target.sessionStartPromise;
  const existing = target.sessionDisposePromise;
  if (existing != null) return existing;
  target.generation += 1;
  dependencies.cancelRetry(target);
  target.session = null;
  target.sessionStartPromise = null;
  const sessionDispose = session == null
    ? Promise.resolve()
    : dependencies.disposeSession(session).catch((error) => { dependencies.onDisposeError(error); });
  const promise = Promise.all([startPromise, target.sessionDisposePromise, sessionDispose])
    .then(() => {})
    .finally(() => {
      if (target.sessionDisposePromise === promise) target.sessionDisposePromise = null;
    });
  target.sessionDisposePromise = promise;
  if (!dependencies.isDisposed()) dependencies.updateRecovery();
  return promise;
}

export { disposeGitWatchSession };
if (typeof module !== `undefined`) module.exports = { disposeGitWatchSession };
