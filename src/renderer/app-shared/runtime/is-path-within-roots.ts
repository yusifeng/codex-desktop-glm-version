/** Return whether a path equals or is nested below any candidate root. */
export function isPathWithinRoots(path: string | null | undefined, roots: Array<string | null | undefined>, normalize: (value: string) => string = (value) => value): boolean {
  if (!path) return false;
  const normalizedPath = normalize(path);
  return roots.some((root) => {
    if (!root) return false;
    const normalizedRoot = normalize(root).replace(/\/+$/u, "");
    return normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
  });
}
