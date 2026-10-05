/** Pure parsing and batching policy for Git worktree file enumeration. */

type GitIndexStat = {
  size?: number;
  mtimeMs: number;
  ctimeMs: number;
  ino?: number;
};

function splitNullSeparatedPaths(output: string): string[] {
  return output.split(`\0`).filter((entry) => entry.length > 0);
}

function parseGitUntrackedStatusPaths(output: string): string[] {
  return splitNullSeparatedPaths(output)
    .filter((entry) => entry.startsWith(`?? `))
    .map((entry) => entry.slice(3));
}

function batchGitLiteralPathspecs(
  paths: string[],
  utf8ByteLength: (value: string) => number,
  maxBytes = 8000,
): string[][] {
  const batches: string[][] = [];
  let batch: string[] = [];
  let batchBytes = 0;
  for (const path of paths) {
    const pathspec = `:(literal)${path}`;
    const bytes = utf8ByteLength(pathspec) + 1;
    if (batch.length > 0 && batchBytes + bytes > maxBytes) {
      batches.push(batch);
      batch = [];
      batchBytes = 0;
    }
    batch.push(pathspec);
    batchBytes += bytes;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}

function formatGitIndexFingerprint(stat: GitIndexStat): string {
  return [stat.size ?? 0, stat.mtimeMs, stat.ctimeMs, stat.ino ?? 0].join(`:`);
}

function isMissingGitIndexError(error: unknown): boolean {
  return typeof error === `object` &&
    error != null &&
    `code` in error &&
    error.code === `ENOENT`;
}

export {
  batchGitLiteralPathspecs,
  formatGitIndexFingerprint,
  isMissingGitIndexError,
  parseGitUntrackedStatusPaths,
  splitNullSeparatedPaths,
};
if (typeof module !== `undefined`)
  module.exports = {
    batchGitLiteralPathspecs,
    formatGitIndexFingerprint,
    isMissingGitIndexError,
    parseGitUntrackedStatusPaths,
    splitNullSeparatedPaths,
  };
