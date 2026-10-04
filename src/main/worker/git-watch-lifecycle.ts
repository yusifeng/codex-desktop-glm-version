type GitRepoWatchLike = { refCount: number; startPromise: Promise<unknown> };

/** Releases one watcher reference and closes it once setup has settled. */
function releaseGitRepoWatch(watch: GitRepoWatchLike | null | undefined, close: (watch: GitRepoWatchLike) => void) {
  if (watch == null || watch.refCount <= 0 || --watch.refCount > 0) return;
  const finish = () => { if (watch.refCount <= 0) close(watch); };
  watch.startPromise.then(finish, finish);
}

export { releaseGitRepoWatch };
if (typeof module !== `undefined`) module.exports = { releaseGitRepoWatch };
