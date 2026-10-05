function reconcileRenameStats(
  stats: any[],
  renames: any[],
  deletedPaths: Set<string>,
) {
  const renamesByPath = new Map(renames.map((rename) => [rename.path, rename]));
  const previousPaths = new Set(renames.map((rename) => rename.previousPath));
  return stats
    .filter(
      (stat) =>
        stat.previousPath != null ||
        !previousPaths.has(stat.path) ||
        !deletedPaths.has(stat.path),
    )
    .map((stat) => {
      const rename =
        stat.previousPath == null ? renamesByPath.get(stat.path) : null;
      return rename == null
        ? stat
        : {
            additions: rename.additions,
            deletions: rename.deletions,
            path: rename.path,
            previousPath: rename.previousPath,
          };
    });
}

function reconcileUntrackedRenames(metadata: any, untrackedPathSet: Set<string>) {
  const deletedEntries = metadata.rawEntries.filter(
    (entry: any) => entry.status === `D` && entry.previousPath == null,
  );
  const renames = metadata.rawEntries.flatMap((entry: any) => {
    if (
      entry.status !== `A` ||
      entry.previousPath != null ||
      !untrackedPathSet.has(entry.path)
    )
      return [];
    const candidates = deletedEntries.filter((deleted: any) =>
      entry.newOid.startsWith(deleted.oldOid),
    );
    const deleted = candidates.length === 1 ? candidates[0] : null;
    return deleted == null
      ? []
      : [{ path: entry.path, previousPath: deleted.path, deleted }];
  });
  if (renames.length === 0) return metadata;
  const renamesByPath = new Map<string, any>(
    renames.map((rename: any) => [rename.path, rename]),
  );
  const previousPaths = new Set(renames.map((rename: any) => rename.previousPath));
  return {
    files: metadata.files
      .filter(
        (file: any) =>
          file.previousPath != null ||
          !previousPaths.has(file.path) ||
          file.changeKind !== `deleted`,
      )
      .map((file: any) => {
        const rename =
          file.previousPath == null ? renamesByPath.get(file.path) : null;
        return rename == null
          ? file
          : {
              ...file,
              changeKind: `renamed`,
              previousPath: rename.previousPath,
            };
      }),
    rawEntries: metadata.rawEntries
      .filter(
        (entry: any) =>
          entry.previousPath != null ||
          !previousPaths.has(entry.path) ||
          entry.status !== `D`,
      )
      .map((entry: any) => {
        const rename =
          entry.previousPath == null ? renamesByPath.get(entry.path) : null;
        return rename == null
          ? entry
          : {
              ...entry,
              oldMode: rename.deleted.oldMode,
              oldOid: rename.deleted.oldOid,
              previousPath: rename.previousPath,
              status: `R`,
            };
      }),
    stats: [
      ...metadata.stats.filter(
        (stat: any) =>
          stat.previousPath != null ||
          (!previousPaths.has(stat.path) && !renamesByPath.has(stat.path)),
      ),
      ...renames.map((rename: any) => ({
        additions: 0,
        deletions: 0,
        path: rename.path,
        previousPath: rename.previousPath,
      })),
    ],
  };
}

function deduplicateReviewFiles(files: any[]) {
  const filesByKey = new Map<string, any>();
  for (const file of files) {
    const key = reviewFileKey(file.path, file.previousPath);
    if (filesByKey.get(key)?.changeKind !== `unmerged`)
      filesByKey.set(key, file);
  }
  return [...filesByKey.values()];
}

function createUnmergedReviewFiles(paths: Set<string>) {
  return [...paths].map((path) => ({
    additions: null,
    changeKind: `unmerged`,
    deletions: null,
    path,
    previousPath: null,
  }));
}

function parseReviewMetadataDiff(output: string) {
  const fields = output.split(`\0`).filter((field) => field.length > 0);
  const rawEntries: any[] = [];
  const stats: any[] = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (field == null) break;
    const raw =
      /^:(\d{6}) (\d{6}) ([0-9a-f]+) ([0-9a-f]+) ([A-Z])(?:\d+)?$/.exec(
        field,
      );
    if (raw != null) {
      const [, oldMode, newMode, oldOid, newOid, status] = raw;
      if (
        oldMode == null ||
        newMode == null ||
        oldOid == null ||
        newOid == null ||
        status == null
      )
        continue;
      const hasPreviousPath = status === `R` || status === `C`;
      const previousPath = hasPreviousPath ? fields[index + 1] : null;
      const path = fields[index + (hasPreviousPath ? 2 : 1)];
      if (path == null || (hasPreviousPath && previousPath == null)) break;
      rawEntries.push({
        newMode,
        newOid,
        oldMode,
        oldOid,
        path,
        previousPath,
        status,
      });
      index += hasPreviousPath ? 2 : 1;
      continue;
    }
    const numstat = /^(-|\d+)\t(-|\d+)\t(.*)$/s.exec(field);
    if (numstat == null) continue;
    const [, additions, deletions, inlinePath] = numstat;
    if (additions == null || deletions == null || inlinePath == null) continue;
    const hasPreviousPath = inlinePath.length === 0;
    const previousPath = hasPreviousPath ? fields[index + 1] : null;
    const path = hasPreviousPath ? fields[index + 2] : inlinePath;
    if (path == null || (hasPreviousPath && previousPath == null)) break;
    stats.push({
      additions: parseNumstatValue(additions),
      deletions: parseNumstatValue(deletions),
      path,
      previousPath,
    });
    index += hasPreviousPath ? 2 : 0;
  }
  return { rawEntries, stats };
}

async function attachReviewFileRevisions({
  host,
  files,
  gitRoot,
  rawEntries,
  source,
  stats,
}: any) {
  const statsByKey = new Map<string, any>(
    stats.map((stat: any) => [reviewFileKey(stat.path, stat.previousPath), stat]),
  );
  const entriesByKey = new Map<string, any>(
    rawEntries.map((entry: any) => [
      reviewFileKey(entry.path, entry.previousPath),
      entry,
    ]),
  );
  return Promise.all(
    files.map(async (file: any) => {
      const key = reviewFileKey(file.path, file.previousPath);
      const stat = statsByKey.get(key) ?? null;
      const entry = entriesByKey.get(key) ?? null;
      const revision =
        entry == null
          ? await getReviewFileRevisionFallback({
              fallback: `${source}:${file.changeKind}:${file.previousPath ?? ``}:${file.path}`,
              host,
              filePath: file.path,
              gitRoot,
            })
          : file.changeKind === `untracked`
            ? `untracked:${entry.newMode}:${entry.newOid}`
            : `${source}:${entry.status}:${entry.oldMode}:${entry.oldOid}:${entry.newMode}:${entry.newOid}`;
      return {
        ...file,
        additions: stat?.additions ?? null,
        deletions: stat?.deletions ?? null,
        revision,
      };
    }),
  );
}

function reviewFileKey(path: string, previousPath: string | null | undefined) {
  return `${previousPath ?? ``}\0${path}`;
}

function parseNumstatValue(value: string) {
  if (value === `-`) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

async function getReviewFileRevisionFallback({
  fallback,
  host,
  gitRoot,
  filePath,
}: any) {
  try {
    const platformPath = await host.platformPath();
    const stat = await host.stat(platformPath.join(gitRoot, filePath), {
      bypassCache: true,
    });
    return `${fallback}:${stat.size}:${Math.floor(stat.mtimeMs)}`;
  } catch {
    return fallback;
  }
}

function gitStatusToReviewChangeKind(status: string) {
  return status === `A`
    ? `added`
    : status === `D`
      ? `deleted`
      : status === `R`
        ? `renamed`
        : status === `C`
          ? `copied`
          : status === `T`
            ? `type-changed`
            : status === `U`
              ? `unmerged`
              : `modified`;
}

export {
  attachReviewFileRevisions,
  createUnmergedReviewFiles,
  deduplicateReviewFiles,
  getOmittedUntrackedFiles,
  getReviewFileRevisionFallback,
  gitStatusToReviewChangeKind,
  mergeReviewMetadata,
  parseNumstatValue,
  parseReviewMetadataDiff,
  reconcileRenameStats,
  reconcileUntrackedRenames,
  reviewFileKey,
  selectUntrackedReviewPaths,
};

if (typeof module !== `undefined`)
  module.exports = {
    attachReviewFileRevisions,
    createUnmergedReviewFiles,
    deduplicateReviewFiles,
    getOmittedUntrackedFiles,
    getReviewFileRevisionFallback,
    gitStatusToReviewChangeKind,
    mergeReviewMetadata,
    parseNumstatValue,
    parseReviewMetadataDiff,
    reconcileRenameStats,
    reconcileUntrackedRenames,
    reviewFileKey,
    selectUntrackedReviewPaths,
  };
import {
  getOmittedUntrackedFiles,
  mergeReviewMetadata,
  selectUntrackedReviewPaths,
} from './git-review-metadata-policy';
