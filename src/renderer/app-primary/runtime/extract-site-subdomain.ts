/** Returns the site subdomain relative to a caller-provided tenant prefix. */
export function extractSiteSubdomain(url: string | null | undefined, tenantPrefix: string): string | null {
  if (url == null) return null;
  try {
    const hostname = new URL(url).hostname;
    const prefix = tenantPrefix.trim().toLowerCase();
    if (
      prefix.length === 0 ||
      !hostname.startsWith(`${prefix}.`) ||
      ![".chatgpt-team.site", ".chatgpt.site", ".appgardenapps.dev"].some((suffix) =>
        hostname.endsWith(suffix),
      )
    ) return null;
    return hostname.slice(prefix.length);
  } catch { return null; }
}
