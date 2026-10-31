import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { createTerminalWindowRuntime } from "../src/main/main-app/terminal/terminal-window-runtime.ts";

function createRuntime({ platform = "linux", executables = {}, environment = {} } = {}) {
  const traces = [];
  const runtime = createTerminalWindowRuntime({
    runtime: {
      Uf: class {},
      Jn: () => "/bin/zsh",
      aa: async (metadata, operation) => { traces.push(metadata); return operation(); },
    },
    platform,
    environment,
    shellNames: { wsl: "WSL", powershell: "PowerShell", commandPrompt: "Command Prompt", gitBash: "Git Bash" },
    findExecutable: (name) => executables[name] ?? null,
    path,
    pathExists: (candidate) => candidate === "C:\\Git\\bin\\bash.exe",
    findProgramFilesPath: () => null,
    createUsingScope: () => ({ e: undefined, u: (value) => value, d: () => {} }),
  });
  return { ...runtime, traces };
}

const linux = createRuntime();
assert.deepEqual(linux.getAvailableShells(), []);
assert.deepEqual(linux.resolveShellCommand(), ["/bin/zsh"]);
assert.equal(linux.getShellLabel(["/bin/zsh"]), "zsh");
assert.equal(linux.getShellLabel([]), "Shell");

const windows = createRuntime({
  platform: "win32",
  environment: { COMSPEC: " C:\\Windows\\cmd.exe " },
  executables: {
    "pwsh.exe": "C:\\PowerShell\\pwsh.exe",
    "git-bash.exe": "C:\\Git\\git-bash.exe",
    "wsl.exe": "C:\\Windows\\wsl.exe",
  },
});
assert.deepEqual(windows.getAvailableShells(), ["powershell", "commandPrompt", "gitBash", "wsl"]);
assert.deepEqual(windows.resolveShellCommand("powershell"), ["C:\\PowerShell\\pwsh.exe"]);
assert.deepEqual(windows.resolveShellCommand("commandPrompt"), ["C:\\Windows\\cmd.exe"]);
assert.deepEqual(windows.resolveShellCommand("gitBash"), ["C:\\Git\\git-bash.exe", "--login", "-i"]);
assert.deepEqual(windows.resolveShellCommand("wsl"), ["C:\\Windows\\wsl.exe"]);
assert.equal(windows.getShellLabel(["C:\\Windows\\wsl.exe"]), "WSL");
assert.equal(windows.getShellLabel(["C:\\PowerShell\\pwsh.exe"]), "PowerShell");
assert.equal(windows.getShellLabel(["C:\\Windows\\cmd.exe"]), "Command Prompt");
assert.equal(windows.getShellLabel(["C:\\Git\\git-bash.exe"]), "Git Bash");

assert.equal(linux.stripTerminalQueries("plain"), "plain");
assert.equal(linux.stripTerminalQueries("a\x1b[5nb"), "ab");
assert.equal(linux.stripTerminalQueries("a\x1b]10;?\x07b"), "ab");
assert.equal(linux.stripTerminalQueries("a\x1b]11;?\x1b\\b"), "ab");
assert.equal(linux.stripTerminalQueries("\x1b[31mred\x1b[0m"), "\x1b[31mred\x1b[0m");
assert.equal(linux.stripTerminalQueries("x\x1b["), "x\x1b[");

const calls = [];
let managerListener;
let managerUnsubscribes = 0;
const manager = {
  createOrAttach: async (...args) => calls.push(["createOrAttach", ...args]),
  attachExisting: async (...args) => calls.push(["attachExisting", ...args]),
  close: (...args) => calls.push(["close", ...args]),
  getShellCwd: async (...args) => calls.push(["cwd", ...args]),
  getSnapshotForConversationId: (...args) => ["snapshot", ...args],
  transferSessionOwnership: async (...args) => calls.push(["transfer", ...args]),
  resize: (...args) => calls.push(["resize", ...args]),
  runAction: (...args) => calls.push(["action", ...args]),
  subscribe: (_origin, listener) => { managerListener = listener; return () => { managerUnsubscribes += 1; }; },
  write: (...args) => calls.push(["write", ...args]),
};
const origin = new EventEmitter();
origin.id = 17;
const service = new linux.TerminalWindowService(manager, origin);
await service.attach({ sessionId: "one" });
await service.create({ sessionId: "two" });
await service.create({ sessionId: "three", hostId: "remote", trace: { traceId: "trace" } });
assert.equal(linux.traces.length, 1);
assert.equal(linux.traces[0].attributes["terminal.host_kind"], "remote");
assert.equal(calls.filter(([name]) => name === "createOrAttach").length, 3);
assert.equal(calls[0][2].type, "attach");
assert.equal(calls[1][2].type, "create");
service.close("one");
service.resize("one", 80, 24, 2);
service.runAction("one", "/work", "ls");
service.write("one", "data");
assert.deepEqual(service.getThreadSnapshot("thread"), ["snapshot", "thread", 17]);

const delivered = [];
let callbackBroken;
let callbackDisposals = 0;
const callback = (event) => delivered.push(event);
callback.onRpcBroken = (handler) => { callbackBroken = handler; };
callback[Symbol.dispose] = () => { callbackDisposals += 1; };
service.subscribe({ dup: () => callback });
managerListener({ type: "data", value: "hello" });
assert.deepEqual(delivered, [{ type: "data", value: "hello" }]);
service.subscribe({ dup: () => callback });
assert.equal(managerUnsubscribes, 1);
assert.equal(callbackDisposals, 1);
callbackBroken();
assert.equal(managerUnsubscribes, 2);
assert.equal(callbackDisposals, 2);
origin.emit("destroyed");
assert.equal(origin.listenerCount("destroyed"), 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /TerminalWindowService: Mtt/);
assert.match(main, /stripTerminalQueries: Ntt/);
assert.doesNotMatch(main, /Mtt = class/);
assert.doesNotMatch(main, /function Att\(/);
assert.match(main, /terminal: new Mtt\(this\.terminalManager, e\)/);

console.log("terminal window runtime assertions: 44");
