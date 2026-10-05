export function createReviewDiffFallback(source: string, files: any[]) {
  return {
    source,
    diffs: Object.fromEntries(
      files.map((file) => [file.path, reviewDiffError({ type: `unknown` })]),
    ),
  };
}

export function reviewDiffError(error: any) {
  return { type: `error`, error };
}

export function diffMatchesRename(
  diff: string,
  previousPath: string,
  path: string,
  parseDiffHeaderOrDeps: ((header: string) => any) | { parseDiffHeader: (header: string) => any },
) {
  const parseDiffHeader = typeof parseDiffHeaderOrDeps === `function`
    ? parseDiffHeaderOrDeps
    : parseDiffHeaderOrDeps.parseDiffHeader;
  const header = /^diff --(?:git|cc|combined) .*$/m.exec(diff)?.[0];
  const parsed = header == null ? null : parseDiffHeader(header);
  return parsed?.oldPath === previousPath && parsed.newPath === path;
}

export function splitReviewDiffs(
  output: string,
  parseDiffHeaderOrDeps: ((header: string) => any) | { parseDiffHeader: (header: string) => any; byteLength: (value: string) => number },
  byteLengthArg?: (value: string) => number,
) {
  const parseDiffHeader = typeof parseDiffHeaderOrDeps === `function`
    ? parseDiffHeaderOrDeps
    : parseDiffHeaderOrDeps.parseDiffHeader;
  const byteLength = typeof parseDiffHeaderOrDeps === `function`
    ? byteLengthArg!
    : parseDiffHeaderOrDeps.byteLength;
  const diffs = new Map<string, any>();
  const headers = Array.from(
    output.matchAll(/^diff --(?:git|cc|combined) .*$/gm),
  );
  for (const [index, header] of headers.entries()) {
    const paths = parseDiffHeader(header[0]);
    if (paths == null) continue;
    const start = header.index ?? 0;
    const end =
      index + 1 < headers.length
        ? (headers[index + 1]?.index ?? output.length)
        : output.length;
    const diff = output.slice(start, end);
    const result = { type: `success`, diff, diffBytes: byteLength(diff) };
    diffs.set(paths.oldPath, result);
    diffs.set(paths.newPath, result);
  }
  return diffs;
}

if (typeof module !== `undefined`)
  module.exports = {
    createReviewDiffFallback,
    diffMatchesRename,
    reviewDiffError,
    splitReviewDiffs,
  };
