import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createNodePtyBackendRuntime } from "../src/main/main-app/terminal/node-pty-backend.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createHarness({
  platform = "linux",
  environment = { SAFE: "yes" },
  stdout = "",
  processTree = [],
  killProcess = () => {},
} = {}) {
  const execCalls = [];
  const spawnCalls = [];
  const ptyCalls = [];
  let dataListener;
  let exitListener;
  const pty = {
    pid: 700,
    onData(listener) { dataListener = listener; },
    onExit(listener) { exitListener = listener; },
    write(data) { ptyCalls.push(["write", data]); },
    resize(columns, rows) { ptyCalls.push(["resize", columns, rows]); },
    kill(signal) { ptyCalls.push(["kill", signal]); },
  };
  const runtime = createNodePtyBackendRuntime({
    runtime: {
      Bi: (value) => ({ SAFE: value.SAFE }),
      hf: () => ({
        parse(values) {
          return values.map((value) => {
            const parsed = Number(value);
            if (!Number.isInteger(parsed) || parsed <= 0) throw Error("invalid process id");
            return parsed;
          });
        },
      }),
      if: () => ({ int() { return this; }, positive() { return this; } }),
      nn: async () => processTree,
    },
    promisify: (operation) => operation,
    execFile: async (...args) => {
      execCalls.push(args);
      return { stdout };
    },
    path,
    createRequire: (filename) => {
      equal(filename, "/app/main.js");
      return (specifier) => {
        equal(specifier, "node-pty");
        return {
          spawn(command, args, options) {
            spawnCalls.push({ command, args, options });
            return pty;
          },
        };
      };
    },
    moduleFilename: "/app/main.js",
    platform,
    environment,
    killProcess,
  });
  return {
    ...runtime,
    emitData: (data) => dataListener(data),
    emitExit: (event) => exitListener(event),
    execCalls,
    ptyCalls,
    spawnCalls,
  };
}

{
  const windows = createHarness({
    platform: "win32",
    environment: { SystemRoot: "D:\\Windows", SAFE: "retained", SECRET: "removed" },
    stdout: "101,202\n",
  });
  equal(await windows.getWindowsConsoleProcessList(55), [101, 202]);
  equal(windows.execCalls.length, 1);
  const [executable, args, options] = windows.execCalls[0];
  equal(executable, "D:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe");
  equal(args.slice(0, 4), ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command"]);
  equal(args[4].includes("GetConsoleProcessList"), true);
  equal(args[4].includes("$env:CODEX_CONSOLE_PROCESS_ID"), true);
  equal(options.env, { SAFE: "retained", CODEX_CONSOLE_PROCESS_ID: "55" });
  equal(options.maxBuffer, 65_536);
  equal(options.timeout, 5_000);
  equal(options.windowsHide, true);

  const events = [];
  const backend = windows.NodePtyBackend.create({
    command: ["pwsh.exe", "-NoLogo"],
    cols: 100,
    rows: 30,
    cwd: "D:\\repo",
    env: { TERM: "xterm-256color" },
    callbacks: {
      onData: (data) => events.push(["data", data]),
      onExit: (event) => events.push(["exit", event]),
    },
  });
  equal(windows.spawnCalls[0].command, "pwsh.exe");
  equal(windows.spawnCalls[0].args, ["-NoLogo"]);
  equal(windows.spawnCalls[0].options.cols, 100);
  equal(windows.spawnCalls[0].options.rows, 30);
  equal(windows.spawnCalls[0].options.cwd, "D:\\repo");
  equal(windows.spawnCalls[0].options.env, { TERM: "xterm-256color" });
  equal(typeof windows.spawnCalls[0].options.getConsoleProcessList, "function");
  windows.emitData("hello");
  windows.emitExit({ exitCode: 7, signal: 9 });
  equal(events, [["data", "hello"], ["exit", { code: 7, signal: "9" }]]);
  equal(windows.normalizeExitSignal(null), null);
  await backend.write("input");
  await backend.resize(120, 40);
  await backend.terminate();
  equal(windows.ptyCalls, [["write", "input"], ["resize", 120, 40], ["kill", undefined]]);
}

{
  const empty = createHarness({ platform: "win32", stdout: "  " });
  equal(await empty.getWindowsConsoleProcessList(1), []);
}

{
  const linux = createHarness();
  const backend = linux.NodePtyBackend.create({
    command: ["/bin/zsh"],
    callbacks: { onData: () => {}, onExit: () => {} },
  });
  equal(linux.spawnCalls[0].options.getConsoleProcessList, undefined);
  linux.emitExit({ exitCode: 0, signal: null });
  await backend.dispose({ killProcessTree: true });
  equal(linux.ptyCalls, [["kill", undefined]]);
}

{
  const killed = [];
  const darwin = createHarness({
    platform: "darwin",
    processTree: [{ pid: 10 }, { pid: 20 }, { pid: 30 }],
    killProcess: (pid, signal) => killed.push([pid, signal]),
  });
  const backend = darwin.NodePtyBackend.create({
    command: ["/bin/zsh"],
    callbacks: { onData: () => {}, onExit: () => {} },
  });
  await backend.dispose({ killProcessTree: true });
  equal(killed, [[30, "SIGKILL"], [20, "SIGKILL"], [10, "SIGKILL"]]);
  equal(darwin.ptyCalls, [["kill", "SIGKILL"]]);
}

{
  const attempted = [];
  const expectedCause = Object.assign(Error("permission denied"), { code: "EPERM" });
  const darwin = createHarness({
    platform: "darwin",
    processTree: [{ pid: 1 }, { pid: 2 }, { pid: 3 }],
    killProcess(pid) {
      attempted.push(pid);
      if (pid === 3) throw Object.assign(Error("gone"), { code: "ESRCH" });
      if (pid === 2) throw expectedCause;
    },
  });
  const backend = darwin.NodePtyBackend.create({
    command: ["/bin/zsh"],
    callbacks: { onData: () => {}, onExit: () => {} },
  });
  await assert.rejects(
    backend.dispose({ killProcessTree: true }),
    (error) => {
      equal(error.message, "Failed to stop terminal process");
      equal(error.cause, expectedCause);
      return true;
    },
  );
  assertions += 1;
  equal(attempted, [3, 2, 1]);
  equal(darwin.ptyCalls, [["kill", "SIGKILL"]]);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("NodePtyBackend: ztt"), true);
equal(main.includes("createNodePtyBackendRuntime({"), true);
equal(main.includes("ztt = class"), false);
equal(main.includes("async function Ltt("), false);
equal(main.includes("function Btt("), false);
equal(main.includes("  ztt,\n"), true);

console.log(`${assertions} main node-pty backend assertions passed`);
