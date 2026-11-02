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

/** Normalize Windows separators and extended prefixes to slash-delimited paths. */
export function normalizePathSeparators(value: string): string {
  return normalizeSlashes(stripExtendedWindowsPathPrefix(value));
}

/** Recognize POSIX, drive-letter, and UNC absolute paths. */
export function isAbsolutePath(value: string): boolean {
  return (value.startsWith("/") && !value.startsWith("//")) ||
    isWindowsDrivePath(value) ||
    /^\\\\[^\\]+\\[^\\]+/u.test(value) ||
    /^\/\/[^/]+\/[^/]+/u.test(value);
}

/** Resolve a possibly-relative path against a base using release path semantics. */
export function resolvePath(base: string, value: string): string {
  const normalizedBase = normalizePathSeparators(base);
  const normalizedValue = normalizePathSeparators(value);
  return isAbsolutePath(normalizedValue) || normalizedBase === ""
    ? ensureLeadingSlashForDrivePath(normalizedValue)
    : ensureLeadingSlashForDrivePath(joinPathFragments(normalizedBase, normalizedValue));
}

/** Resolve a path and optionally remove the slash before a Windows drive letter. */
export function resolveDisplayPath(base: string, value: string, stripDriveSlash: boolean): string {
  const resolved = resolvePath(base, value);
  return stripDriveSlash && /^\/[A-Za-z]:[\\/]/u.test(resolved) ? resolved.slice(1) : resolved;
}

/** Compare paths across explicit Windows, WSL, and /mnt drive representations. */
export function areEquivalentPaths(left: string, right: string): boolean {
  const normalizedLeft = normalizeComparablePath(left);
  const normalizedRight = normalizeComparablePath(right);
  if (normalizedLeft === normalizedRight) return true;
  const leftWindows = getWindowsComparablePath(normalizedLeft);
  const rightWindows = getWindowsComparablePath(normalizedRight);
  return leftWindows != null &&
    rightWindows != null &&
    (leftWindows.explicit || rightWindows.explicit) &&
    leftWindows.comparablePath === rightWindows.comparablePath;
}

function normalizeSlashes(value: string): string {
  return value.replace(/\\/gu, "/");
}

function ensureLeadingSlashForDrivePath(value: string): string {
  return isWindowsDrivePath(value) && !value.startsWith("/") ? `/${value}` : value;
}

function normalizeComparablePath(value: string): string {
  const normalized = normalizePathSeparators(value);
  const withoutDriveSlash = /^\/[a-z]:\//iu.test(normalized) ? normalized.slice(1) : normalized;
  const wsl = normalized.match(/^\/\/(?:wsl\$|wsl\.localhost)\/([^/]+)(?:\/(.*))?$/iu);
  let result = normalized;
  if (wsl != null) {
    const wslPath = `/${wsl[2] ?? ""}`;
    result = /^\/mnt\/[a-z](?:\/|$)/iu.test(wslPath)
      ? `win32:${normalizeWindowsEquivalentPath(wslPath)}`
      : `wsl:${wsl[1].toLowerCase()}:${wslPath}`;
  } else if (isWindowsDrivePath(withoutDriveSlash) || isUncPath(withoutDriveSlash)) {
    result = `win32:${normalizeWindowsEquivalentPath(withoutDriveSlash)}`;
  }
  return result === "/" ? result : result.replace(/\/+$/u, "");
}

function normalizeWindowsEquivalentPath(value: string): string {
  const withoutDevicePrefix = /^\\\\\?\\(?:UNC\\|[a-zA-Z]:[\\/])/iu.test(value)
    ? value.slice(4).replace(/^UNC\\/iu, "\\\\")
    : value;
  const normalized = normalizeSlashes(withoutDevicePrefix).toLowerCase();
  const wsl = normalized.match(/^\/\/(?:wsl\$|wsl\.localhost)\/[^/]+(?:\/(.*))?$/u);
  if (wsl != null) {
    const rest = wsl[1] ?? "";
    return rest.length > 0 ? `/${rest}` : "/";
  }
  const drive = normalized.match(/^\/?([a-z]):(?:\/(.*))?$/u);
  if (drive != null) {
    const [, letter, rest] = drive;
    return rest != null && rest.length > 0 ? `/mnt/${letter}/${rest}` : `/mnt/${letter}`;
  }
  return normalized;
}

function getWindowsComparablePath(value: string): { comparablePath: string; explicit: boolean } | null {
  if (value.startsWith("win32:")) return { comparablePath: value.slice(6), explicit: true };
  if (/^\/mnt\/[a-z](?:\/|$)/iu.test(value)) {
    return { comparablePath: normalizeWindowsEquivalentPath(value), explicit: false };
  }
  return null;
}

function isUncPath(value: string): boolean {
  return /^\\\\[^\\]+\\[^\\]+/u.test(value) || /^\/\/[^/]+\/[^/]+/u.test(value);
}
