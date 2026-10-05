/** Pure projection of working-tree metadata into untracked review metadata. */

export function buildUntrackedReviewMetadata(
  paths: string[],
  metadata: Map<string, any>,
) {
  return {
    files: paths.map((path) => ({ additions: null, changeKind: `added`, deletions: null, path, previousPath: null })),
    rawEntries: paths.map((path) => ({
      newMode: metadata.get(path)?.mode ?? `000000`,
      newOid: metadata.get(path)?.oid ?? `0`.repeat(40),
      oldMode: `000000`, oldOid: `0`.repeat(40), path, previousPath: null, status: `A`,
    })),
    stats: paths.map((path) => ({
      additions: metadata.get(path)?.additions ?? null,
      deletions: metadata.get(path)?.deletions ?? null,
      path, previousPath: null,
    })),
  };
}

if (typeof module !== `undefined`) module.exports = { buildUntrackedReviewMetadata };
