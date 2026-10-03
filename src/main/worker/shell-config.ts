type ShellDescriptor = {
  executable: string;
  args: string[];
  scriptExtension: string;
  shellKind: `posix` | `powershell` | `cmd`;
};

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

export { describeShell };
if (typeof module !== `undefined`) module.exports = { describeShell };
