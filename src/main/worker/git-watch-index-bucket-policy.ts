/** Pure host/root selection used by Git watcher performance telemetry. */

export type GitWatchIndexBucketHost = { id: string; isLocal: boolean };
export type GitWatchIndexBucketEntry = {
  hostId: string;
  root: string;
  repoIndexSizeBucket: string;
};

/**
 * Select the index-size bucket belonging to the first watcher that owns a
 * repository root.  The caller supplies the platform path implementation so
 * this policy remains independent of Node's filesystem and path modules.
 */
export function getGitPerformanceRepoIndexSizeBucket(
  watches: Iterable<GitWatchIndexBucketEntry>,
  repoRoot: string,
  host: GitWatchIndexBucketHost,
  pathModule: { relative(from: string, to: string): string; sep: string },
): string {
  for (const watch of watches) {
    if (watch.hostId !== host.id) continue;
    const relative = pathModule.relative(watch.root, repoRoot);
    if (relative === "" || (relative !== ".." && !relative.startsWith(`..${pathModule.sep}`))) {
      return watch.repoIndexSizeBucket;
    }
  }
  return "unknown";
}

if (typeof module !== "undefined") module.exports = { getGitPerformanceRepoIndexSizeBucket };
