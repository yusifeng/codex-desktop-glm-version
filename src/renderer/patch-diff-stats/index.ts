import {
  XO as parseUnifiedDiff,
  YO as initializeUnifiedDiffParser,
} from "@rchunk/app-initial";

export interface PatchDiffStats {
  added: number;
  deleted: number;
  openLocation: { line: number; path: string };
}

function countPatchLines(patch: string): { added: number; deleted: number } {
  let added = 0;
  let deleted = 0;
  for (const line of patch.split(/\r?\n/)) {
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    if (line.startsWith("+")) added += 1;
    else if (line.startsWith("-")) deleted += 1;
  }
  return { added, deleted };
}

function getPatchDiffStats(
  patch: string | null | undefined,
  path: string,
): PatchDiffStats | null {
  if (!patch) return null;
  const fallback = countPatchLines(patch);
  const parsed = parseUnifiedDiff(patch)[0];
  if (
    parsed &&
    (parsed.additions > 0 ||
      parsed.deletions > 0 ||
      (fallback.added === 0 && fallback.deleted === 0))
  ) {
    return {
      added: parsed.additions,
      deleted: parsed.deletions,
      openLocation: {
        line: parsed.firstAdditionLine ?? parsed.firstDeletionLine ?? 1,
        path,
      },
    };
  }
  return fallback.added === 0 && fallback.deleted === 0
    ? null
    : { ...fallback, openLocation: { line: 1, path } };
}

function initializePatchDiffStats(): void {
  initializeUnifiedDiffParser();
}

export { initializePatchDiffStats as n, getPatchDiffStats as t };
