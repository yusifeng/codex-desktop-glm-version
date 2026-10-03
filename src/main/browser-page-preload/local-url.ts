const LOCAL_HOSTNAMES = new Set([`localhost`, `127.0.0.1`, `0.0.0.0`, `[::1]`, `::1`]);

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized.endsWith(`.localhost`) || LOCAL_HOSTNAMES.has(normalized);
}

/** Accepts only HTTP(S) URLs targeting loopback or a localhost subdomain. */
function isLocalHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (url.protocol === `http:` || url.protocol === `https:`) && isLocalHostname(url.hostname);
}

export { isLocalHostname, isLocalHttpUrl };
if (typeof module !== `undefined`) module.exports = { isLocalHostname, isLocalHttpUrl };
