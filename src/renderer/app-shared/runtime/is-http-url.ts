const LOCAL_HTTP_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"]);

function isLocalHttpHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith(".localhost") || LOCAL_HTTP_HOSTNAMES.has(normalized);
}

/** Accept local http(s) URLs, or apply an explicitly injected hostname policy. */
export function isHttpUrl(
  value: string,
  isAllowedHostname: (hostname: string) => boolean = isLocalHttpHostname,
): boolean {
  let url: URL;
  try { url = new URL(value); } catch { return false; }
  return (url.protocol === "http:" || url.protocol === "https:") && isAllowedHostname(url.hostname);
}
