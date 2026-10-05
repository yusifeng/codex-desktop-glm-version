/** Pure review metadata selection and merge policy. */

export function selectUntrackedReviewPaths(
  requestedPaths: string[] | undefined,
  untrackedPathSet: Set<string>,
) {
  return requestedPaths == null || requestedPaths.length === 0
    ? [...untrackedPathSet]
    : requestedPaths.filter((path) => untrackedPathSet.has(path));
}

export function getOmittedUntrackedFiles(
  count: number | undefined,
  limit: number | undefined,
) {
  if (!(count == null || limit == null || count <= limit)) return { count, limit };
}

export function mergeReviewMetadata(left: any, right: any) {
  return {
    files: [...left.files, ...right.files],
    rawEntries: [...left.rawEntries, ...right.rawEntries],
    stats: [...left.stats, ...right.stats],
  };
}

if (typeof module !== `undefined`)
  module.exports = { getOmittedUntrackedFiles, mergeReviewMetadata, selectUntrackedReviewPaths };
