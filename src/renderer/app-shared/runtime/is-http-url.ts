/** Accept only http(s) URLs whose hostname satisfies the injected policy. */
export function isHttpUrl(value: string, isAllowedHostname: (hostname: string) => boolean): boolean {
  let url: URL;
  try { url = new URL(value); } catch { return false; }
  return (url.protocol === "http:" || url.protocol === "https:") && isAllowedHostname(url.hostname);
}
