/** URL equivalence rules used by the main-process renderer trust gate.
 *
 * Extracted from main-C-Mhak1n.ts 172,625-172,665. These deliberately keep
 * the original URL parser and protocol-specific comparisons separate: the
 * caller can combine them according to the trust policy it is enforcing.
 */

export function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function isAppFrameUrl(value: string): boolean {
  const parsed = parseUrl(value);
  return parsed?.protocol === "app:" && (parsed.host === "-" || parsed.host === "");
}

export function isAppProtocolUrl(value: string): boolean {
  return parseUrl(value)?.protocol === "app:";
}

/** Match the original MH predicate: only HTTP(S) URLs participate in origin checks. */
function hasOrigin(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function sameOrigin(value: string, origin: string): boolean {
  if (!hasOrigin(value)) return false;
  try {
    return new URL(value).origin === origin;
  } catch {
    return false;
  }
}

/** Match renderer paths only when both URLs are on the expected origin. */
export function samePathOnOrigin(value: string, target: string, origin: string): boolean {
  const valueUrl = parseUrl(value);
  const targetUrl = parseUrl(target);
  return valueUrl == null || targetUrl == null || !hasOrigin(value) || !hasOrigin(target) || valueUrl.origin !== origin || targetUrl.origin !== origin
    ? false
    : valueUrl.pathname === targetUrl.pathname;
}

export function sameFilePath(value: string, target: string): boolean {
  const valueUrl = parseUrl(value);
  const targetUrl = parseUrl(target);
  return valueUrl == null || targetUrl == null || valueUrl.protocol !== "file:" || targetUrl.protocol !== "file:"
    ? false
    : valueUrl.pathname === targetUrl.pathname;
}

export function sameAppPath(value: string, target: string): boolean {
  const valueUrl = parseUrl(value);
  const targetUrl = parseUrl(target);
  return valueUrl == null || targetUrl == null
    ? false
    : valueUrl.protocol === "app:" &&
        targetUrl.protocol === "app:" &&
        valueUrl.host === "-" &&
        targetUrl.host === "-" &&
        valueUrl.username === "" &&
        targetUrl.username === "" &&
        valueUrl.password === "" &&
        targetUrl.password === "" &&
        valueUrl.pathname === targetUrl.pathname;
}

export function sameTrustedPath(value: string, target: string, origin: string | null): boolean {
  return (origin != null && samePathOnOrigin(value, target, origin)) || sameAppPath(value, target) || sameFilePath(value, target);
}

if (typeof module !== "undefined") module.exports = { isAppFrameUrl, isAppProtocolUrl, parseUrl, sameAppPath, sameFilePath, sameOrigin, samePathOnOrigin, sameTrustedPath };
