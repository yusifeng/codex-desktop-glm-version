export function resolveExecutableCandidate(
  pathname: string,
  exists: (pathname: string) => boolean,
  extension: (pathname: string) => string,
): string | null {
  if (!exists(pathname)) return null;
  if (extension(pathname)) return pathname;
  for (const suffix of [`.cmd`, `.bat`, `.exe`]) {
    const candidate = `${pathname}${suffix}`;
    if (exists(candidate)) return candidate;
  }
  return pathname;
}
if (typeof module !== `undefined`) module.exports = { resolveExecutableCandidate };
