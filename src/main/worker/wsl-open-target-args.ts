export function buildWslOpenTargetArgs(
  pathname: string,
  resolveWindowsPath: (pathname: string) => string,
  resolveDistro: (pathname: string) => string | null,
  resolveDirectoryArgs: (pathname: string) => string[],
  executable = `wsl.exe`,
): string[] {
  const directory = resolveWindowsPath(pathname);
  const args = [...resolveDirectoryArgs(pathname), executable];
  const distro = resolveDistro(directory);
  if (distro != null) args.push(`-d`, distro);
  if (!directory.startsWith(`\\\\`)) args.push(`--cd`, directory);
  return args;
}
if (typeof module !== `undefined`) module.exports = { buildWslOpenTargetArgs };
