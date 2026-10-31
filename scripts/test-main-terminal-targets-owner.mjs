import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/open-target/terminal-targets.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createTerminalTargetRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const ok = (actual, message) => {
  assert.ok(actual, message);
  assertions += 1;
};

const files = new Map([
  ["/repo", "directory"],
  ["/repo/file.ts", "file"],
  ["/Applications/Ghostty.app", "directory"],
  ["/Applications/iTerm.app", "directory"],
  ["/Applications/kitty.app", "directory"],
  ["/Applications/Warp.app", "directory"],
  ["/System/Applications/Utilities/Terminal.app", "directory"],
  ["C:\\Cmder\\Cmder.exe", "file"],
]);
const spawns = [];
const warnings = [];
const executables = new Map();
const windowsExecutables = new Map();
const shortcuts = new Map();
const links = new Map();

function dependencies(overrides = {}) {
  return {
    platform: "darwin",
    path,
    fs: {
      existsSync: (value) => files.has(value),
      statSync: (value) => ({
        isDirectory: () => files.get(value) === "directory",
        isFile: () => files.get(value) === "file",
      }),
    },
    env: { SHELL: "/bin/zsh", PATH: "/usr/bin" },
    createLogger: () => () => ({ warning: (...args) => warnings.push(args) }),
    findExistingMacApplication: (paths) => paths.find((value) => files.has(value)) ?? null,
    findExecutable: (command) => executables.get(command) ?? null,
    findWindowsExecutable: (command) => windowsExecutables.get(command) ?? null,
    findWindowsShortcut: (names) => names.map((name) => shortcuts.get(name)).find(Boolean) ?? null,
    resolveExecutableLink: (value) => links.get(value) ?? null,
    getWindowsSystemPath: () => "C:\\Windows\\System32",
    parseShellWords(command) {
      if (command.includes("unterminated")) throw new Error("parse");
      return command.match(/"[^"]*"|'[^']*'|[^\s]+/gu)?.map((token) => token.replace(/^['"]|['"]$/gu, "")) ?? [];
    },
    shellEscape: (value) => `'${value.replaceAll("'", "'\\''")}'`,
    shellJoin: (values) => values.map((value) => `'${value}'`).join(" "),
    toWslPath: (value) => value.startsWith("\\\\") ? value : `/mnt/c${value.replace(/^C:/u, "").replaceAll("\\", "/")}`,
    getWslDistro: (value) => value.includes("Ubuntu") ? "Ubuntu" : null,
    async getWslInfo() { return { installed: true }; },
    async spawn(...args) { spawns.push(args); },
    ...overrides,
  };
}

const runtime = createTerminalTargetRuntime(dependencies());
equal(runtime.directoryForTarget("/repo"), "/repo", "directory target remains directory");
equal(runtime.directoryForTarget("/repo/file.ts"), "/repo", "file target resolves parent directory");
equal(runtime.directoryForTarget("/missing/file.ts"), "/missing", "missing target resolves parent directory");

equal(runtime.findEditorCommand(), null, "editor lookup returns null when env and candidates are absent");
executables.set("nvim", "/usr/bin/nvim");
equal(runtime.findEditorCommand(), "/usr/bin/nvim", "editor lookup checks known candidates");
const visualRuntime = createTerminalTargetRuntime(dependencies({ env: { VISUAL: " code --wait ", EDITOR: "vim" } }));
equal(visualRuntime.findEditorCommand(), "code --wait", "VISUAL has priority and is trimmed");
const editorRuntime = createTerminalTargetRuntime(dependencies({ env: { EDITOR: " nano " } }));
equal(editorRuntime.findEditorCommand(), "nano", "EDITOR is second priority and trimmed");

equal(runtime.parseEditorCommand("nvim --clean"), { args: ["nvim", "--clean"], executableName: "nvim" }, "editor command is tokenized");
equal(runtime.parseEditorCommand("C:\\Tools\\Vim.exe --clean")?.executableName, "c:\\tools\\vim", "Windows executable suffix is normalized with host basename semantics");
equal(runtime.parseEditorCommand("unterminated"), null, "editor parse failure is contained");
equal(runtime.editorLocationArgs("nvim", { line: 4, column: 2 }), ["+call cursor(4,2)"], "Vim location uses cursor call");
equal(runtime.editorLocationArgs("nano", { line: 4, column: 2 }), ["+4,2"], "Nano location uses line and column");
equal(runtime.editorLocationArgs("less", { line: 4, column: 2 }), ["+4g"], "Less location uses line jump");
equal(runtime.editorLocationArgs("code", { line: 4, column: 2 }), [], "unknown editor receives no location args");
equal(runtime.editorLocationArgs("vim", null), [], "missing location receives no args");

equal(runtime.buildEditorShellCommand("nvim --clean", "/repo/file.ts", { line: 3, column: 1 }), "cd '/repo' && 'nvim' '--clean' '+call cursor(3,1)' '/repo/file.ts'", "editor shell command preserves parsed args and location");
equal(runtime.buildEditorShellCommand("nvim -- --cmd", "/repo/file.ts", { line: 3, column: 1 }), "cd '/repo' && 'nvim' '+call cursor(3,1)' '--' '--cmd' '/repo/file.ts'", "location args are inserted before separator");
equal(runtime.buildEditorShellCommand("unterminated", "/repo/file.ts", null), "cd '/repo' && unterminated '/repo/file.ts'", "unparsed editor command uses escaped fallback");

equal(runtime.linuxTerminalArgs("kitty", "/repo/file.ts"), ["--directory", "/repo"], "Kitty uses directory flag");
equal(runtime.linuxTerminalArgs("ghostty", "/repo/file.ts"), ["--working-directory=/repo"], "Ghostty uses inline directory flag");
equal(runtime.linuxTerminalArgs("konsole", "/repo/file.ts"), ["--workdir", "/repo"], "Konsole uses workdir flag");
equal(runtime.linuxTerminalArgs("gnome-terminal", "/repo/file.ts"), ["--working-directory", "/repo"], "GNOME Terminal uses working-directory flag");
equal(runtime.linuxTerminalArgs("x-terminal-emulator", "/repo/file.ts"), ["-e", "/bin/zsh", "-lc", "cd '/repo' && exec '/bin/zsh'"], "generic terminal launches shell in directory");
assert.throws(() => runtime.linuxTerminalArgs("unknown-terminal", "/repo"), /Unsupported Linux terminal command/);
assertions += 1;

await runtime.launchLinuxTerminal("kitty", "/repo/file.ts", { line: 2, column: 1 });
equal(spawns.at(-1)[0], "kitty", "Linux terminal launches detected command");
equal(spawns.at(-1)[1], ["--directory", "/repo", "/bin/zsh", "-lc", "cd '/repo' && '/usr/bin/nvim' '+call cursor(2,1)' '/repo/file.ts'"], "Kitty file launch appends editor shell command");
await runtime.launchLinuxTerminal("gnome-terminal", "/repo/file.ts", null);
equal(spawns.at(-1)[1].slice(2, 4), ["--", "/bin/zsh"], "GNOME file launch inserts separator before shell");
await runtime.launchLinuxTerminal("x-terminal-emulator", "/repo/file.ts", null);
equal(spawns.at(-1)[1].slice(0, 3), ["-e", "/bin/zsh", "-lc"], "generic file launch replaces base args");

equal(runtime.macTerminalCommand("kitty", "echo hi"), { command: "/usr/bin/open", args: ["-na", "kitty.app", "--args", "/bin/zsh", "-lc", "echo hi"] }, "Kitty macOS command uses open with args");
equal(runtime.macTerminalCommand("ghostty", "echo hi"), { command: "/usr/bin/open", args: ["-na", "Ghostty.app", "--args", "-e", "/bin/zsh", "-lc", "echo hi"] }, "Ghostty macOS command uses executable flag");
equal(runtime.macTerminalCommand("terminal", "echo \"hi\""), { command: "/usr/bin/osascript", args: ["-e", "tell application \"Terminal\" to do script \"echo \\\"hi\\\"\""] }, "Terminal AppleScript escapes quotes");
ok(runtime.macTerminalCommand("iterm2", "echo hi").args[1].includes("create window with default profile"), "iTerm AppleScript creates a new window");
equal(runtime.macTerminalCommand("warp", "echo hi"), null, "unsupported mac terminal has no editor command bridge");

const spawnCountBeforeMac = spawns.length;
equal(await runtime.tryOpenFileInMacTerminal("terminal", "/repo/file.ts", { line: 1, column: 1 }), true, "macOS file launches directly in editor terminal");
equal(spawns.length, spawnCountBeforeMac + 1, "macOS editor bridge performs one spawn");
equal(await runtime.tryOpenFileInMacTerminal("warp", "/repo/file.ts", null), false, "Warp falls back because no editor bridge exists");
equal(await runtime.tryOpenFileInMacTerminal("terminal", "/repo", null), false, "directory bypasses editor bridge");

const failingRuntime = createTerminalTargetRuntime(dependencies({
  async spawn() { throw new Error("launch failed"); },
}));
equal(await failingRuntime.tryOpenFileInMacTerminal("terminal", "/repo/file.ts", null), false, "macOS editor launch failure falls back");
equal(warnings.at(-1)[0], "Failed to run $EDITOR command for terminal target; falling back to opening directory", "macOS fallback logs stable warning");

equal(runtime.terminal.id, "terminal", "Terminal descriptor is exported");
equal(runtime.ghostty.id, "ghostty", "Ghostty descriptor is exported");
equal(runtime.iterm2.id, "iterm2", "iTerm2 descriptor is exported");
equal(runtime.kitty.id, "kitty", "Kitty descriptor is exported");
equal(runtime.warp.id, "warp", "Warp descriptor is exported");
equal(runtime.cmder.id, "cmder", "Cmder descriptor is exported");
equal(runtime.wsl.id, "wsl", "WSL descriptor is exported");
equal(runtime.terminal.platforms.darwin.detect(), "/usr/bin/open", "installed macOS Terminal is detected");
equal(runtime.ghostty.platforms.linux.detect(), null, "missing Linux Ghostty is unavailable");
executables.set("ghostty", "/usr/bin/ghostty");
equal(runtime.ghostty.platforms.linux.detect(), "/usr/bin/ghostty", "Linux Ghostty executable is detected");

executables.set("wt.exe", "C:\\WindowsApps\\wt.exe");
equal(await runtime.detectWindowsTerminal(async () => ({})), "wt.exe", "Windows Terminal PATH detection returns stable command name");
executables.delete("wt.exe");
shortcuts.set("Windows Terminal.lnk", "C:\\Links\\Terminal.lnk");
links.set("C:\\Target\\wt.exe", "C:\\Resolved\\wt.exe");
equal(await runtime.detectWindowsTerminal(async (shortcut) => ({ target: "C:\\Target\\wt.exe", shortcut })), "C:\\Resolved\\wt.exe", "Windows Terminal shortcut resolves executable");
const windowsRuntime = createTerminalTargetRuntime(dependencies({
  path: path.win32,
  env: { Path: "C:\\Tools", CMDER_ROOT: "C:\\Cmder" },
}));
equal(windowsRuntime.windowsTerminalArgs("C:\\Repo\\file.ts"), ["-d", "C:\\Repo"], "Windows Terminal args use parent directory");
equal(windowsRuntime.windowsLaunchEnvironment().Path, "C:\\Windows\\System32;C:\\Tools", "Windows launch environment prepends system path");
await windowsRuntime.launchWindowsTerminal("wt.exe", ["-d", "C:\\Repo"]);
equal(spawns.at(-1)[0], "cmd.exe", "Windows terminal launches through cmd.exe start");
equal(spawns.at(-1)[1], ["/d", "/s", "/c", "start", "", "wt.exe", "-d", "C:\\Repo"], "cmd start arguments preserve empty title");
equal(await windowsRuntime.detectCmder(async () => ({})), "C:\\Cmder\\Cmder.exe", "CMDER_ROOT has detection priority");

equal(windowsRuntime.wslArgs("C:\\Ubuntu\\repo\\file.ts"), ["-d", "C:\\Ubuntu\\repo", "wsl.exe", "-d", "Ubuntu", "--cd", "/mnt/c/Ubuntu/repo"], "WSL args include distro and translated cwd");
shortcuts.set("WSL.lnk", "C:\\Links\\WSL.lnk");
equal(windowsRuntime.wslIconPath(), "C:\\Links\\WSL.lnk", "WSL icon prefers shortcut");
equal(await windowsRuntime.detectWsl(async () => ({ target: "C:\\Target\\wt.exe" })), "C:\\Resolved\\wt.exe", "installed WSL reuses Windows Terminal detection");
const noWslRuntime = createTerminalTargetRuntime(dependencies({ async getWslInfo() { return null; } }));
equal(await noWslRuntime.detectWsl(async () => ({})), null, "missing WSL disables target");

ok(assertions >= 55, "terminal target owner has broad editor, platform args, launch, detection, and descriptor coverage");
console.log(`${assertions} main terminal target owner assertions passed`);
