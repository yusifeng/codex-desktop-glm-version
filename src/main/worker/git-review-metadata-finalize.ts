type GitReviewMetadataFinalizeDependencies = {
  attachReviewFileRevisions: (params: any) => Promise<any[]>;
  deduplicateReviewFiles: (files: any[]) => any[];
  getWorkingTreeMetadata: (
    reviewSnapshot: any,
    paths: string[],
    options: any,
  ) => Promise<Map<string, any> | null>;
};

async function finalizeReviewMetadata(
  {
    host,
    gitRoot,
    metadata,
    reviewSnapshot,
    source,
    untrackedPathSet,
  }: any,
  dependencies: GitReviewMetadataFinalizeDependencies,
) {
  const files = dependencies.deduplicateReviewFiles(
    metadata.files.map((file: any) =>
      file.previousPath == null && untrackedPathSet.has(file.path)
        ? { ...file, changeKind: `untracked` }
        : file,
    ),
  );
  const workingTreeMetadata = await dependencies.getWorkingTreeMetadata(
    reviewSnapshot,
    metadata.rawEntries
      .filter(
        (entry: any) => entry.status !== `D` && /^0+$/.test(entry.newOid),
      )
      .map((entry: any) => entry.path),
    {},
  );
  if (workingTreeMetadata == null) return null;
  return (
    await dependencies.attachReviewFileRevisions({
      host,
      files,
      gitRoot,
      rawEntries: metadata.rawEntries.map((entry: any) => ({
        ...entry,
        newOid: workingTreeMetadata.get(entry.path)?.oid ?? entry.newOid,
      })),
      source,
      stats: metadata.stats,
    })
  ).sort((left: any, right: any) => left.path.localeCompare(right.path));
}

async function readUntrackedReviewMetadata(
  reviewSnapshot: any,
  paths: string[],
  dependencies: GitReviewMetadataFinalizeDependencies,
) {
  if (paths.length === 0) return { files: [], rawEntries: [], stats: [] };
  const metadata = await dependencies.getWorkingTreeMetadata(
    reviewSnapshot,
    paths,
    { includeDiffMetadata: true },
  );
  if (metadata == null) return null;
  return {
    files: paths.map((path) => ({
      additions: null,
      changeKind: `added`,
      deletions: null,
      path,
      previousPath: null,
    })),
    rawEntries: paths.map((path) => ({
      newMode: metadata.get(path)?.mode ?? `000000`,
      newOid: metadata.get(path)?.oid ?? `0`.repeat(40),
      oldMode: `000000`,
      oldOid: `0`.repeat(40),
      path,
      previousPath: null,
      status: `A`,
    })),
    stats: paths.map((path) => ({
      additions: metadata.get(path)?.additions ?? null,
      deletions: metadata.get(path)?.deletions ?? null,
      path,
      previousPath: null,
    })),
  };
}

export { finalizeReviewMetadata, readUntrackedReviewMetadata };

if (typeof module !== `undefined`)
  module.exports = { finalizeReviewMetadata, readUntrackedReviewMetadata };
