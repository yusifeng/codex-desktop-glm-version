type ShellDescriptor = {
  executable: string;
  args: string[];
  scriptExtension: string;
  shellKind: `posix` | `powershell` | `cmd`;
};

type PowerShellResolverDependencies = {
  pathWin32Join: (...parts: string[]) => string;
  pathJoin: (...parts: string[]) => string;
  resolveCandidate: (path: string) => string | null;
};

function environmentValue(environment: Record<string, string | undefined>, key: string): string | undefined {
  const actual = Object.keys(environment).find((name) => name.toLowerCase() === key.toLowerCase());
  return actual == null ? undefined : environment[actual];
}

/** Finds an installed PowerShell executable using the same ordered PATH roots as the worker. */
function resolvePowerShellExecutable(
  environment: Record<string, string | undefined>,
  dependencies: PowerShellResolverDependencies,
): string | null {
  const shell = environmentValue(environment, `SHELL`);
  if (shell != null && /(?:^|[\\/])(?:pwsh|powershell)(?:\.exe)?$/i.test(shell)) return shell;
  const systemRoot = environmentValue(environment, `SystemRoot`) ?? environmentValue(environment, `windir`) ?? `C:\\Windows`;
  const roots: string[][] = [[systemRoot, `System32`, `WindowsPowerShell`, `v1.0`]];
  for (const key of [`ProgramFiles`, `ProgramW6432`, `ProgramFiles(x86)`]) {
    const value = environmentValue(environment, key);
    if (value != null) for (const version of [`7`, `7-preview`, `6`]) roots.push([value, `PowerShell`, version]);
  }
  const pathEntries = (environmentValue(environment, `PATH`)?.split(`;`) ?? []).filter((value) => value.length > 0);
  const candidates = [...pathEntries, ...roots.flatMap((parts) => [dependencies.pathWin32Join(...parts), dependencies.pathJoin(...parts)])];
  const localAppData = environmentValue(environment, `LOCALAPPDATA`);
  const windowsApps = localAppData == null ? null : dependencies.pathWin32Join(localAppData, `Microsoft`, `WindowsApps`).toLowerCase();
  for (const entry of candidates) {
    const trimmed = entry.trim().replace(/^"|"$/g, ``);
    if (trimmed.length === 0) continue;
    const normalized = dependencies.pathWin32Join(trimmed).toLowerCase();
    if (windowsApps != null && (normalized === windowsApps || normalized.startsWith(`${windowsApps}\\`))) continue;
    for (const executable of [`pwsh.exe`, `powershell.exe`]) {
      for (const candidate of [dependencies.pathWin32Join(trimmed, executable), dependencies.pathJoin(trimmed, executable)]) {
        const resolved = dependencies.resolveCandidate(candidate);
        if (resolved != null) return resolved;
      }
    }
  }
  return null;
}

/** Maps resolved platform shell executables to the command/script contract. */
function describeShell(platform: string, resolvedPowerShell: string | null, fallbackExecutable: string): ShellDescriptor {
  if (platform !== `win32`) return { executable: `bash`, args: [], scriptExtension: `sh`, shellKind: `posix` };
  const executable = resolvedPowerShell ?? fallbackExecutable;
  const basename = executable.split(/[\\/]/).at(-1)?.toLowerCase();
  if (basename === `powershell` || basename === `powershell.exe` || basename === `pwsh` || basename === `pwsh.exe`) {
    return { executable, args: [`-File`], scriptExtension: `ps1`, shellKind: `powershell` };
  }
  if (basename !== `cmd` && basename !== `cmd.exe`) return { executable, args: [], scriptExtension: `sh`, shellKind: `posix` };
  return { executable, args: [`/c`], scriptExtension: `cmd`, shellKind: `cmd` };
}

export { describeShell, resolvePowerShellExecutable };
if (typeof module !== `undefined`) module.exports = { describeShell, resolvePowerShellExecutable };
