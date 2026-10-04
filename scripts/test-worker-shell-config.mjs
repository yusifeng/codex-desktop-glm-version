import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { describeShell } = require("../app/.vite/build/worker/shell-config.js");
const { resolvePowerShellExecutable } = require("../app/.vite/build/worker/shell-config.js");
import path from "node:path";

assert.deepEqual(describeShell("darwin", null, "cmd.exe"), { executable: "bash", args: [], scriptExtension: "sh", shellKind: "posix" });
assert.deepEqual(describeShell("linux", null, "cmd.exe"), { executable: "bash", args: [], scriptExtension: "sh", shellKind: "posix" });
assert.deepEqual(describeShell("win32", "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", "cmd.exe"), { executable: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", args: ["-File"], scriptExtension: "ps1", shellKind: "powershell" });
assert.deepEqual(describeShell("win32", "pwsh", "cmd.exe"), { executable: "pwsh", args: ["-File"], scriptExtension: "ps1", shellKind: "powershell" });
assert.deepEqual(describeShell("win32", null, "C:\\Windows\\System32\\cmd.exe"), { executable: "C:\\Windows\\System32\\cmd.exe", args: ["/c"], scriptExtension: "cmd", shellKind: "cmd" });
assert.deepEqual(describeShell("win32", null, "bash.exe"), { executable: "bash.exe", args: [], scriptExtension: "sh", shellKind: "posix" });

const seen = [];
assert.equal(resolvePowerShellExecutable({ SHELL: "C:\\Tools\\pwsh.exe" }, {
  pathWin32Join: path.win32.join,
  pathJoin: path.join,
  resolveCandidate: (candidate) => { seen.push(candidate); return null; },
}), "C:\\Tools\\pwsh.exe");
assert.equal(resolvePowerShellExecutable({ PATH: "C:\\Windows\\System32", LOCALAPPDATA: "C:\\Users\\u\\AppData\\Local" }, {
  pathWin32Join: path.win32.join,
  pathJoin: path.join,
  resolveCandidate: (candidate) => candidate.endsWith("powershell.exe") ? candidate : null,
}), "C:\\Windows\\System32\\powershell.exe");
assert.ok(seen.length === 0);

console.log("8 worker shell config assertions passed");
