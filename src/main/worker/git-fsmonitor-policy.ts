/** Pure policy for fsmonitor configuration values and host support. */
function parseFsmonitorConfigValue(value: string): boolean | null {
  const normalized = value.toLowerCase();
  if ([`true`, `yes`, `on`].includes(normalized)) return true;
  if ([`false`, `no`, `off`].includes(normalized)) return false;
  return null;
}
function isFsmonitorPlatformSupported({ isLocal, platformFamily, platformOs }: { isLocal: boolean; platformFamily: string; platformOs: string }): boolean {
  return isLocal ? platformFamily === `windows` || platformOs === `macos` : platformOs === `linux`;
}
export { isFsmonitorPlatformSupported, parseFsmonitorConfigValue };
if (typeof module !== `undefined`) module.exports = { isFsmonitorPlatformSupported, parseFsmonitorConfigValue };
