import assert from "node:assert/strict";
import fs from "node:fs";
import { createTerminalCommandRuntime } from "../src/main/main-app/terminal/terminal-command-runtime.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const linux = createTerminalCommandRuntime({ platform: "linux" });
equal(linux.getTerminalShellKind(["/usr/bin/pwsh"]), "posix");
equal(linux.getTerminalShellKind([]), "posix");
equal(linux.getCommandBasename(["/usr/local/bin/ZSH"]), "zsh");
equal(linux.getCommandBasename([]), "");
equal(linux.formatTerminalActionCommand("posix", "/tmp/a b", "echo one\r\necho two"), 'cd "/tmp/a b" && echo one\necho two\n');
equal(linux.formatTerminalActionCommand("wsl", "/mnt/c/repo", "pwd\rdir"), 'cd "/mnt/c/repo" && pwd\ndir\n');
equal(linux.formatChangeDirectory("posix", "/tmp/a b"), 'cd "/tmp/a b"');

const windows = createTerminalCommandRuntime({ platform: "win32" });
for (const command of ["wsl", "WSL.EXE", "C:\\Windows\\wsl.exe"]) {
  equal(windows.getTerminalShellKind([command]), "wsl");
}
for (const command of ["pwsh", "PWSH.EXE", "powershell", "C:\\Windows\\PowerShell.EXE"]) {
  equal(windows.getTerminalShellKind([command]), "powershell");
}
for (const command of ["cmd", "C:\\Windows\\CMD.EXE"]) {
  equal(windows.getTerminalShellKind([command]), "commandPrompt");
}
equal(windows.getTerminalShellKind(["C:\\Git\\bash.exe"]), "posix");
equal(windows.getTerminalShellKind([]), "posix");
equal(windows.quotePowerShellPath("C:\\O'Brien"), "'C:\\O''Brien'");
equal(windows.quoteCommandPromptPath('C:\\A"B'), '"C:\\A""B"');
equal(
  windows.formatChangeDirectory("powershell", "C:\\O'Brien"),
  "Set-Location -LiteralPath 'C:\\O''Brien'",
);
equal(
  windows.formatChangeDirectory("commandPrompt", 'C:\\A"B'),
  'cd /d "C:\\A""B"',
);
equal(
  windows.formatTerminalActionCommand("powershell", "C:\\O'Brien", "echo one\necho two"),
  "Set-Location -LiteralPath 'C:\\O''Brien'; echo one\r\necho two\r\n",
);
equal(
  windows.formatTerminalActionCommand("commandPrompt", 'C:\\A"B', "echo one\recho two"),
  'cd /d "C:\\A""B" && echo one\r\necho two\r\n',
);
equal(
  windows.formatTerminalActionCommand("wsl", "/mnt/c/repo", "echo one\r\necho two"),
  'cd "/mnt/c/repo" && echo one\necho two\n',
);
equal(
  windows.formatTerminalActionCommand("posix", "C:\\repo", "echo one\necho two"),
  'cd "C:\\\\repo" && echo one\r\necho two\r\n',
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("getTerminalShellKind: C5"), true);
equal(main.includes("formatTerminalActionCommand: Gtt"), true);
equal(main.includes("createTerminalCommandRuntime({ platform: process.platform })"), true);
equal(main.includes("function C5(e)"), false);
equal(main.includes("function Gtt(e, t, n)"), false);
equal(main.includes("  Gtt,\n"), true);
equal(main.includes("  C5,\n"), true);

console.log(`${assertions} main terminal command runtime assertions passed`);
