/** Stable ordering policy for platform installation directory discovery. */
export function sortPlatformEntryNames(entries: Iterable<string>): string[] {
  return [...entries].sort((left, right) => right.localeCompare(left));
}
if (typeof module !== `undefined`) module.exports = { sortPlatformEntryNames };
