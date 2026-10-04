type GitWatchAcquireDependencies = {
  metadata: { root: string; commonDir: string };
  host: any;
  signal?: AbortSignal;
  getWatchKey: (root: string, host: any) => string;
  getWatch: (key: string) => any;
  createWatch: (metadata: { root: string; commonDir: string }, host: any, closingPromise?: Promise<unknown>) => any;
  releaseWatch: (root: string, host: any, options: { watch: any }) => void;
};

/** Acquire one reference to a repository watch and return its idempotent release callback. */
async function acquireGitWatch(deps: GitWatchAcquireDependencies): Promise<() => void> {
  if (deps.signal?.aborted) return () => {};
  const key = deps.getWatchKey(deps.metadata.root, deps.host);
  const existing = deps.getWatch(key);
  const watch = existing != null && watchIsOpen(existing)
    ? existing
    : deps.createWatch(deps.metadata, deps.host, existing?.closingPromise);
  watch.refCount += 1;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    deps.signal?.removeEventListener(`abort`, release);
    deps.releaseWatch(deps.metadata.root, deps.host, { watch });
  };
  deps.signal?.addEventListener(`abort`, release, { once: true });
  try {
    await watch.startPromise;
    return release;
  } catch (error) {
    release();
    throw error;
  }
}

function watchIsOpen(watch: any): boolean {
  return watch.closingPromise == null;
}

export { acquireGitWatch, watchIsOpen };
if (typeof module !== `undefined`) module.exports = { acquireGitWatch, watchIsOpen };
