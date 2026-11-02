/** Recognize an absolute Windows drive path. */
export function isWindowsDrivePath(value: string): boolean {
  return /^[A-Za-z]:[\\/]/u.test(value);
}

/** Normalize separators and extended Windows prefixes for case-insensitive path map keys. */
export function createCaseInsensitivePathKey(value: string): string {
  return normalizePathSeparators(stripExtendedWindowsPathPrefix(value)).toLowerCase();
}

/** Remove the Win32 extended-length prefix while preserving UNC semantics. */
export function stripExtendedWindowsPathPrefix(value: string): string {
  const uncMatch = value.match(/^\\\\\?\\UNC\\(.*)$/iu);
  if (uncMatch != null) return `\\\\${uncMatch[1]}`;
  const driveMatch = value.match(/^\\\\\?\\([a-zA-Z]:[\\/].*)$/u);
  return driveMatch?.[1] ?? value;
}

/** Join two slash-delimited path fragments without duplicating their boundary separator. */
export function joinPathFragments(left: string, right: string): string {
  return left ? (right ? `${left.replace(/\/+$/u, "")}/${right.replace(/^\/+/, "")}` : left) : right;
}

/** Return at most the final two normalized path segments. */
export function getLastTwoPathSegments(value: string): string {
  return normalizePathSeparators(stripExtendedWindowsPathPrefix(value))
    .replace(/\/+$/u, "")
    .split("/")
    .filter(Boolean)
    .slice(-2)
    .join("/");
}

function normalizePathSeparators(value: string): string {
  return value.replace(/\\/gu, "/");
}
