/** Recognize an absolute Windows drive path. */
export function isWindowsDrivePath(value: string): boolean {
  return /^[A-Za-z]:[\\/]/u.test(value);
}

/** Normalize separators and extended Windows prefixes for case-insensitive path map keys. */
export function createCaseInsensitivePathKey(value: string): string {
  const uncMatch = value.match(/^\\\\\?\\UNC\\(.*)$/iu);
  const driveMatch = value.match(/^\\\\\?\\([a-zA-Z]:[\\/].*)$/u);
  const normalizedPrefix = uncMatch != null ? `\\\\${uncMatch[1]}` : (driveMatch?.[1] ?? value);
  return normalizedPrefix.replace(/\\/gu, "/").toLowerCase();
}
