/** Pure path policy for automation writable-root fallbacks. */

type WritableRootsPath = {
  isAbsolute: (value: string) => boolean;
  resolve: (...parts: string[]) => string;
  dirname: (value: string) => string;
  join: (...parts: string[]) => string;
};

function resolveCommonDirRoot(
  commonDir: string,
  baseRoot: string,
  path: WritableRootsPath,
) {
  return path.isAbsolute(commonDir)
    ? commonDir
    : path.resolve(baseRoot, commonDir);
}

function resolveIndexFallbackRoot(
  indexPath: string | null,
  sourceRoot: string | null,
  path: WritableRootsPath,
) {
  if (indexPath) return path.dirname(indexPath);
  return sourceRoot ? path.join(sourceRoot, `.git`) : null;
}

export { resolveCommonDirRoot, resolveIndexFallbackRoot };
if (typeof module !== `undefined`)
  module.exports = { resolveCommonDirRoot, resolveIndexFallbackRoot };
