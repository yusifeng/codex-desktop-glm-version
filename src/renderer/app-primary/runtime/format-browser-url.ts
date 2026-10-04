/**
 * Formats an absolute browser URL as the compact host/path representation
 * used by browser surfaces. Query/hash retention is explicit for callers
 * that need the complete location string.
 */
export function formatBrowserUrl(url: string | null | undefined, includeQueryAndHash = true): string | null {
  if (url == null) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}${includeQueryAndHash ? `${parsed.search}${parsed.hash}` : ""}`;
  } catch {
    return null;
  }
}
