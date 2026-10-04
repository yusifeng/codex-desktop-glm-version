export function extractMacAppBundlePath(executablePath: string): string | null {
  const marker = `.app/Contents/MacOS/`;
  const index = executablePath.indexOf(marker);
  return index === -1 ? null : executablePath.slice(0, index + `.app`.length);
}
if (typeof module !== `undefined`) module.exports = { extractMacAppBundlePath };
