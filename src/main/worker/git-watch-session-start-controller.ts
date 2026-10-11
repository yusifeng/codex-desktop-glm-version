type GitWatchSessionStartDependencies = {
  target: any;
  recovering: boolean;
  isDisposed: () => boolean;
  isRegistered: (target: any) => boolean;
  start: (target: any, recovering: boolean) => Promise<void>;
  shouldRetryAfterStart: (input: { recovering: boolean; disposed: boolean; generationUnchanged: boolean; hasSession: boolean; metadataMissing: boolean }) => boolean;
  scheduleRetry: (target: any) => void;
  updateRecovery: () => void;
};

/** Coordinates one Git watch target's start promise, generation race and retry lifecycle. */
async function startGitWatchSession(dependencies: GitWatchSessionStartDependencies): Promise<void> {
  const { target, recovering } = dependencies;
  if (dependencies.isDisposed() || !dependencies.isRegistered(target)) return;
  if (target.sessionDisposePromise != null) {
    await target.sessionDisposePromise;
    return startGitWatchSession(dependencies);
  }
  if (target.session != null || target.retryTimer != null) return;
  if (target.sessionStartPromise != null) {
    const generation = target.generation;
    await target.sessionStartPromise;
    if (dependencies.shouldRetryAfterStart({
      recovering,
      disposed: dependencies.isDisposed(),
      generationUnchanged: generation === target.generation,
      hasSession: target.session != null,
      metadataMissing: target.metadataDirectory?.missing === true,
    })) dependencies.scheduleRetry(target);
    return;
  }
  dependencies.updateRecovery();
  const promise = dependencies.start(target, recovering);
  target.sessionStartPromise = promise;
  try {
    await promise;
  } finally {
    if (target.sessionStartPromise === promise) target.sessionStartPromise = null;
  }
}

export { startGitWatchSession };
if (typeof module !== `undefined`) module.exports = { startGitWatchSession };
