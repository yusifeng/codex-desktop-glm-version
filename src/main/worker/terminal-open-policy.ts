/** Pure command policy for terminal/editor open-in targets. */
export interface EditorLocation { line: number; column: number }
export function buildTerminalEditorArgs(executableName: string, location?: EditorLocation | null): string[] {
  if (location == null) return [];
  if (executableName === `nvim` || executableName === `vim`) return [`+call cursor(${location.line},${location.column})`];
  if (executableName === `nano`) return [`+${location.line},${location.column}`];
  if (executableName === `less`) return [`+${location.line}g`];
  return [];
}
function escapeAppleScriptText(value: string): string { return value.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`); }
export function buildMacTerminalLaunch(target: string, command: string, shell = `/bin/zsh`): { command: string; args: string[] } | null {
  const escaped = escapeAppleScriptText(command);
  if (target === `kitty`) return { command: `/usr/bin/open`, args: [`-na`, `kitty.app`, `--args`, shell, `-lc`, command] };
  if (target === `ghostty`) return { command: `/usr/bin/open`, args: [`-na`, `Ghostty.app`, `--args`, `-e`, shell, `-lc`, command] };
  if (target === `terminal`) return { command: `/usr/bin/osascript`, args: [`-e`, `tell application "Terminal" to do script "${escaped}"`] };
  if (target === `iterm2`) return { command: `/usr/bin/osascript`, args: [`-e`, [`tell application "iTerm"`, `create window with default profile`, `tell current session of current window to write text "${escaped}"`, `end tell`].join(`\n`)] };
  return null;
}
if (typeof module !== `undefined`) module.exports = { buildTerminalEditorArgs, buildMacTerminalLaunch };
