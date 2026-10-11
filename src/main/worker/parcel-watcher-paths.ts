type PosixPathApi = { dirname(path: string): string };

/** Returns whether a path is equal to or nested below one of the roots. */
function isPathAtOrBelowAnyRoot(pathApi: PosixPathApi, path: string, roots: Set<string>): boolean {
  if (roots.has(path)) return true;
  let current = pathApi.dirname(path);
  while (current !== path) {
    if (roots.has(current)) return true;
    const parent = pathApi.dirname(current);
    if (parent === current) return false;
    current = parent;
  }
  return false;
}

export { isPathAtOrBelowAnyRoot };
if (typeof module !== `undefined`) module.exports = { isPathAtOrBelowAnyRoot };
