/** Pure acquisition decisions for repository Git watcher references. */

/** An aborted request must not create or retain a watcher reference. */
function shouldAcquireGitWatch(signalAborted: boolean | undefined): boolean {
  return signalAborted !== true;
}

/** Reuse only an existing watcher whose close lifecycle has not started. */
function selectReusableGitWatch<T extends { closingPromise?: unknown }>(watch: T | null | undefined): T | null {
  return watch != null && watch.closingPromise == null ? watch : null;
}

export { selectReusableGitWatch, shouldAcquireGitWatch };

if (typeof module !== "undefined") module.exports = { selectReusableGitWatch, shouldAcquireGitWatch };
