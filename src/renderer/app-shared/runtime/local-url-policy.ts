const localHostnames = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"]);

/** Recognize local HTTP(S) and safe local file URLs accepted by Browser targets. */
export function isSafeLocalUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol === "http:" || url.protocol === "https:") {
    const hostname = url.hostname.toLowerCase();
    return hostname.endsWith(".localhost") || localHostnames.has(hostname);
  }
  if (url.protocol !== "file:") return false;
  const hostname = url.hostname.toLowerCase();
  if (hostname.length > 0 && hostname !== "localhost") return false;
  const path = decodeURIComponent(url.pathname).replace(/\\/gu, "/").replace(/^\/{3,}/u, "//");
  const withoutDriveSlash = /^\/[A-Za-z]:[\\/]/u.test(path) ? path.slice(1) : path;
  if (/^[A-Za-z]:[\\/]/u.test(withoutDriveSlash)) return true;
  return !/^\/\/[^/]+\/[^/]+/u.test(withoutDriveSlash);
}

