// @ts-nocheck

/** Owns shell-kind detection and action command formatting for integrated terminal sessions. */
export function createTerminalCommandRuntime({ platform }: { platform: string }) {
  function getCommandBasename(command: string[]) {
    const segments = (command[0] ?? ``).split(/[/\\]/);
    return segments[segments.length - 1]?.toLowerCase() ?? ``;
  }

  function getTerminalShellKind(command: string[]) {
    if (platform !== `win32`) return `posix`;
    const basename = getCommandBasename(command);
    return basename === `wsl` || basename === `wsl.exe`
      ? `wsl`
      : basename === `pwsh` ||
          basename === `pwsh.exe` ||
          basename === `powershell` ||
          basename === `powershell.exe`
        ? `powershell`
        : basename === `cmd` || basename === `cmd.exe`
          ? `commandPrompt`
          : `posix`;
  }

  function quotePowerShellPath(value: string) {
    return `'${value.replace(/'/g, `''`)}'`;
  }

  function quoteCommandPromptPath(value: string) {
    return `"${value.replace(/"/g, `""`)}"`;
  }

  function formatChangeDirectory(shellKind: string, cwd: string) {
    return shellKind === `powershell`
      ? `Set-Location -LiteralPath ${quotePowerShellPath(cwd)}`
      : shellKind === `commandPrompt`
        ? `cd /d ${quoteCommandPromptPath(cwd)}`
        : `cd ${JSON.stringify(cwd)}`;
  }

  function formatPosixActionCommand(cwd: string, command: string, newline: string) {
    const normalizedCommand = command.replace(/\r\n|\r|\n/g, newline);
    return `cd ${JSON.stringify(cwd)} && ${normalizedCommand}${newline}`;
  }

  function formatPlatformPosixActionCommand(cwd: string, command: string) {
    return formatPosixActionCommand(cwd, command, platform === `win32` ? `\r\n` : `\n`);
  }

  function formatTerminalActionCommand(shellKind: string, cwd: string, command: string) {
    if (shellKind === `powershell`) {
      const normalizedCommand = command.replace(/\r\n|\r|\n/g, `\r\n`);
      return `${formatChangeDirectory(shellKind, cwd)}; ${normalizedCommand}\r\n`;
    }
    if (shellKind === `commandPrompt`) {
      const normalizedCommand = command.replace(/\r\n|\r|\n/g, `\r\n`);
      return `${formatChangeDirectory(shellKind, cwd)} && ${normalizedCommand}\r\n`;
    }
    return shellKind === `wsl`
      ? formatPosixActionCommand(cwd, command, `\n`)
      : formatPlatformPosixActionCommand(cwd, command);
  }

  return {
    formatChangeDirectory,
    formatTerminalActionCommand,
    getCommandBasename,
    getTerminalShellKind,
    quoteCommandPromptPath,
    quotePowerShellPath,
  };
}

if (typeof module !== "undefined") {
  module.exports = { createTerminalCommandRuntime };
}
