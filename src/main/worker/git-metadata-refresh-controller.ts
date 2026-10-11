/** Owns the coalesced metadata-refresh batch and its single-flight waiter. */
function createGitMetadataRefreshController(input: {
  isDisposed: () => boolean;
  processBatch: (paths: string[], recovering: boolean) => Promise<unknown> | unknown;
}) {
  const changedPaths = new Set<string>();
  let pending: Promise<void> | null = null;

  function enqueue(paths: string[], recovering = true): Promise<void> {
    if (input.isDisposed() || paths.length === 0) return Promise.resolve();
    for (const path of paths) changedPaths.add(path);
    if (pending != null) return pending;
    let nextRecovering = recovering;
    const run = (async () => {
      while (!input.isDisposed() && changedPaths.size > 0) {
        const batch = [...changedPaths];
        changedPaths.clear();
        await input.processBatch(batch, nextRecovering);
        nextRecovering = true;
      }
    })().finally(() => {
      if (pending === run) pending = null;
    });
    pending = run;
    return run;
  }

  function pendingPromise(): Promise<void> | null {
    return pending;
  }

  function dispose(): void {
    changedPaths.clear();
  }

  return { enqueue, pendingPromise, dispose, hasPending: () => pending != null };
}

export { createGitMetadataRefreshController };
if (typeof module !== `undefined`) module.exports = { createGitMetadataRefreshController };
