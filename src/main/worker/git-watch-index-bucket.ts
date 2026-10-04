type GitWatchIndexBucketHost = {
  id: string;
  isLocal: boolean;
};

type GitWatchIndexBucketEntry = {
  hostId: string;
  root: string;
  repoIndexSizeBucket: string;
};

/** Resolve the index-size bucket for a repository covered by a host's watcher. */
function getGitPerformanceRepoIndexSizeBucket(
  watches: Iterable<GitWatchIndexBucketEntry>,
  repoRoot: string,
  host: GitWatchIndexBucketHost,
  pathModule: { relative(from: string, to: string): string; sep: string },
): string {
  for (const watch of watches) {
    if (watch.hostId !== host.id) continue;
    const relative = pathModule.relative(watch.root, repoRoot);
    if (relative === `` || (relative !== `..` && !relative.startsWith(`..${pathModule.sep}`))) {
      return watch.repoIndexSizeBucket;
    }
  }
  return `unknown`;
}

export { getGitPerformanceRepoIndexSizeBucket };
if (typeof module !== `undefined`) module.exports = { getGitPerformanceRepoIndexSizeBucket };
