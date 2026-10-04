/** Path/argument policy shared by terminal and file-manager open-in targets. */
export function resolveOpenTargetDirectory(pathname: string, isDirectory: (pathname: string) => boolean, dirname: (pathname: string) => string): string {
  return isDirectory(pathname) ? pathname : dirname(pathname);
}
export function buildWindowsTerminalArgs(pathname: string, resolveDirectory: (pathname: string) => string): string[] {
  return [`-d`, resolveDirectory(pathname)];
}
if (typeof module !== `undefined`) module.exports = { resolveOpenTargetDirectory, buildWindowsTerminalArgs };
