import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  TERMINAL_ENVIRONMENT,
  captureEnvironmentDiff,
  containsLineBreak,
  createCmdWrapper,
  createLocalEnvironmentRuntime,
  createPosixWrapper,
  createPowerShellWrapper,
  createWrapperScript,
  detectPlatform,
  diffEnvironment,
  indexEnvironment,
  isExcludedEnvironmentKey,
  normalizeEnvironmentKey,
  parseEnvironment,
  quoteCmd,
  quotePosix,
  quotePowerShell,
  readStream,
  scriptLabel,
  selectEnvironmentScript,
  selectPlatformScript,
} = require("../app/.vite/build/worker/git-local-environment.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const match = (...args) => { assertions += 1; assert.match(...args); };

deepEqual(parseEnvironment("\uFEFFALPHA=one\r\nEMPTY=\r\nCOMPLEX=a=b\nINVALID\n=bad\n"), {
  ALPHA: "one",
  EMPTY: "",
  COMPLEX: "a=b",
});
deepEqual(parseEnvironment(""), {});
equal(normalizeEnvironmentKey("Path", "win32"), "PATH");
equal(normalizeEnvironmentKey("Path", "darwin"), "Path");
deepEqual([...indexEnvironment({ Path: "one", PATH: "two", EMPTY: undefined }, "win32")], [
  ["PATH", { key: "PATH", value: "two" }],
]);
equal(containsLineBreak("one\ntwo"), true);
equal(containsLineBreak("one\rtwo"), true);
equal(containsLineBreak("one"), false);
equal(isExcludedEnvironmentKey("secret", "win32", new Set(["SECRET"])), true);
equal(isExcludedEnvironmentKey("BASH_FUNC_tool%%", "linux", new Set()), true);

deepEqual(
  diffEnvironment(
    { ZED: "old", REMOVE: "gone", SAME: "same" },
    { ZED: "new", ALPHA: "added", SAME: "same" },
    "linux",
    new Set(),
  ),
  { version: 1, set: { ALPHA: "added", ZED: "new" }, exclude: ["REMOVE"] },
);
deepEqual(
  diffEnvironment({ Path: "old", Gone: "x" }, { PATH: "new" }, "win32", new Set()),
  { version: 1, set: { PATH: "new" }, exclude: ["Gone"] },
);
equal(diffEnvironment({ SAME: "x" }, { SAME: "x" }, "linux", new Set()), null);
equal(
  diffEnvironment(
    { SECRET: "old", MULTI: "one\ntwo", BASH_FUNC_x: "old" },
    { SECRET: "new", MULTI: "three", BASH_FUNC_x: "new" },
    "linux",
    new Set(["SECRET"]),
  ),
  null,
);

equal(quoteCmd('C:\\a"b'), '"C:\\a""b"');
equal(quotePosix("/tmp/a'b"), "'/tmp/a'\\''b'");
equal(quotePowerShell("C:\\a'b"), "'C:\\a''b'");

equal(
  createPosixWrapper("/tmp/a'b.sh", "/tmp/out env", "/tmp/before"),
  [
    "set -xeo pipefail",
    "capture_path='/tmp/out env'",
    "before_capture_path='/tmp/before'",
    'env > "$before_capture_path"',
    'trap \'code=$?; if [ "$code" -eq 0 ]; then env > "$capture_path"; fi\' EXIT',
    ". '/tmp/a'\\''b.sh'",
  ].join("\n"),
);
equal(
  createCmdWrapper('C:\\setup"x.cmd', "C:\\after.txt", "C:\\before.txt"),
  [
    "@echo off",
    'set > "C:\\before.txt"',
    'call "C:\\setup""x.cmd"',
    "set CODEX_SETUP_EXIT_CODE=%ERRORLEVEL%",
    'if "%CODEX_SETUP_EXIT_CODE%"=="0" set > "C:\\after.txt"',
    "exit /b %CODEX_SETUP_EXIT_CODE%",
  ].join("\r\n"),
);
equal(
  createPowerShellWrapper("C:\\setup's.ps1", "C:\\after's.txt", "C:\\before.txt"),
  [
    "$ErrorActionPreference = 'Stop'",
    "$PSNativeCommandUseErrorActionPreference = $true",
    "$exitCode = 0",
    "Get-ChildItem Env: | Sort-Object Name | ForEach-Object { '{0}={1}' -f $_.Name, $_.Value } | Set-Content -LiteralPath 'C:\\before.txt' -Encoding utf8",
    "try {",
    "  & 'C:\\setup''s.ps1'",
    "} finally {",
    "  $exitCode = if ($null -eq $LASTEXITCODE) {",
    "    if ($?) { 0 } else { 1 }",
    "  } else {",
    "    [int]$LASTEXITCODE",
    "  }",
    "  if ($exitCode -eq 0) {",
    "    Get-ChildItem Env: | Sort-Object Name | ForEach-Object { '{0}={1}' -f $_.Name, $_.Value } | Set-Content -LiteralPath 'C:\\after''s.txt' -Encoding utf8",
    "  }",
    "}",
    "exit $exitCode",
  ].join("\n"),
);
equal(createWrapperScript("posix", "s", "a", "b"), createPosixWrapper("s", "a", "b"));
equal(createWrapperScript("cmd", "s", "a", "b"), createCmdWrapper("s", "a", "b"));
equal(createWrapperScript("powershell", "s", "a", "b"), createPowerShellWrapper("s", "a", "b"));

equal(await detectPlatform({ platformFamily: async () => "windows", platformOs: async () => "Windows" }), "win32");
equal(await detectPlatform({ platformFamily: async () => "posix", platformOs: async () => "macOS" }), "darwin");
equal(await detectPlatform({ platformFamily: async () => "posix", platformOs: async () => "FreeBSD" }), "linux");
equal(selectPlatformScript({ script: "fallback", darwin: { script: "mac" } }, "darwin"), "mac");
equal(selectPlatformScript({ script: "fallback", linux: { script: "" } }, "linux"), "fallback");
equal(selectEnvironmentScript({ environment: { setup: "setup", cleanup: "cleanup" } }, "setup"), "setup");
equal(selectEnvironmentScript({ environment: { setup: "setup" } }, "cleanup"), null);
equal(scriptLabel("setup"), "Setup script");
equal(scriptLabel("cleanup"), "Cleanup script");
deepEqual(TERMINAL_ENVIRONMENT, { COLORTERM: "truecolor", FORCE_COLOR: "1", TERM: "xterm-256color" });

{
  const chunks = [new Uint8Array([1, 2]), new Uint8Array([3])];
  let released = false;
  const received = [];
  await readStream({
    getReader: () => ({
      read: async () => chunks.length === 0 ? { done: true } : { done: false, value: chunks.shift() },
      releaseLock: () => { released = true; },
    }),
  }, (chunk) => received.push(...chunk));
  deepEqual(received, [1, 2, 3]);
  equal(released, true);
}

function byteStream(parts) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part));
      controller.close();
    },
  });
}

function fixture(overrides = {}) {
  const calls = [];
  const files = new Map();
  const ids = ["run", "script", "wrapper", "before", "after"];
  let time = 1000;
  const processResult = overrides.processResult ?? { code: 0, signal: null };
  const process = {
    stdout: byteStream(overrides.stdout ?? ["hello\nlast"]),
    stderr: byteStream(overrides.stderr ?? ["bad\n"]),
    wait: async () => processResult,
    kill: () => { calls.push(["kill"]); },
    ...overrides.process,
  };
  const host = {
    isLocal: overrides.isLocal ?? true,
    platformFamily: async () => overrides.platformFamily ?? "posix",
    platformOs: async () => overrides.platformOs ?? "darwin",
    platformPath: async () => ({ join: (...parts) => parts.join("/").replace(/\/+/g, "/") }),
    codexHome: async () => "/codex",
    createDirectory: async (...args) => { calls.push(["create-directory", ...args]); },
    writeFile: async (path, contents) => { calls.push(["write-file", path, contents]); files.set(path, contents); },
    readFile: async (path) => {
      calls.push(["read-file", path]);
      if (path.endsWith("after-captured_env.txt")) return new TextEncoder().encode("BASE=two\nADD=yes\n");
      if (path.endsWith("before-before_env.txt")) return new TextEncoder().encode("BASE=one\nDROP=gone\n");
      throw new Error(`unexpected read: ${path}`);
    },
    remove: async (...args) => { calls.push(["remove", ...args]); },
    spawn: async (options) => { calls.push(["spawn", options]); return process; },
    ...overrides.host,
  };
  const dependencies = {
    getExcludedEnvironmentVariables: () => new Set(["SECRET"]),
    getProcessCwd: () => "/process-cwd",
    getProcessEnvironment: () => ({ PROCESS: "yes", FORCE_COLOR: "process" }),
    getShellDescriptor: (...args) => {
      calls.push(["shell-descriptor", ...args]);
      return { executable: "/bin/zsh", args: ["-l"], scriptExtension: "sh", shellKind: "posix" };
    },
    getShellEnvironment: async (...args) => {
      calls.push(["shell-environment", ...args]);
      return { SHELL_VALUE: "base", FORCE_COLOR: "shell" };
    },
    logger: {
      error: (...args) => calls.push(["error", ...args]),
      info: (...args) => calls.push(["info", ...args]),
      warning: (...args) => calls.push(["warning", ...args]),
    },
    now: () => time++,
    randomUUID: () => ids.shift(),
    ...overrides.dependencies,
  };
  return { calls, dependencies, files, host, process };
}

function localEnvironment(overrides = {}) {
  return {
    configPath: "/repo/.codex/environment.toml",
    cwdRelativeToGitRoot: "packages/app",
    environment: { setup: { script: "echo setup\r\n" }, cleanup: { script: "echo cleanup" } },
    ...overrides,
  };
}

{
  const state = fixture();
  const runtime = createLocalEnvironmentRuntime(state.dependencies);
  equal(await runtime.runSetupScript("/repo", localEnvironment({ environment: {} }), null, undefined, {}, state.host), null);
  equal(await runtime.runCleanupScript("/repo", localEnvironment({ environment: {} }), null, undefined, state.host), null);
  equal(state.calls.length, 0);
}

{
  const state = fixture();
  const controller = new AbortController();
  controller.abort();
  const result = await createLocalEnvironmentRuntime(state.dependencies).runSetupScript(
    "/repo", localEnvironment(), null, controller.signal, {}, state.host,
  );
  deepEqual(result, {
    setupResult: {
      cwd: "/repo",
      scriptPath: "/repo/.codex/environment.toml",
      status: "failed",
      startedAt: 1000,
      finishedAt: 1001,
      error: "Setup script canceled",
      log: "",
    },
    shellEnvironment: null,
  });
  equal(state.calls.length, 0);
}

{
  const state = fixture();
  const streamed = [];
  const result = await createLocalEnvironmentRuntime(state.dependencies).runSetupScript(
    "/repo",
    localEnvironment(),
    (kind, bytes) => streamed.push([kind, new TextDecoder().decode(bytes)]),
    undefined,
    { INJECTED: "yes", FORCE_COLOR: "injected" },
    state.host,
  );
  equal(result.setupResult.status, "succeeded");
  equal(result.setupResult.cwd, "/repo/packages/app");
  equal(result.setupResult.scriptPath, "/codex/tmp/local-environment/run/script-setup_script.sh");
  equal(result.setupResult.log, "hello\nbad\nlast");
  deepEqual(result.shellEnvironment, {
    version: 1,
    set: { ADD: "yes", BASE: "two" },
    exclude: ["DROP"],
  });
  deepEqual(streamed, [["stdout", "hello\nlast"], ["stderr", "bad\n"]]);
  const spawn = state.calls.find((call) => call[0] === "spawn")[1];
  deepEqual(spawn.args, ["/bin/zsh", "-l", "/codex/tmp/local-environment/run/wrapper-setup_wrapper.sh"]);
  equal(spawn.cwd, "/repo/packages/app");
  deepEqual(spawn.env, {
    SHELL_VALUE: "base",
    FORCE_COLOR: "injected",
    COLORTERM: "truecolor",
    TERM: "xterm-256color",
    INJECTED: "yes",
  });
  deepEqual(state.calls.find((call) => call[0] === "shell-environment").slice(1), [
    state.host,
    "darwin",
    { PROCESS: "yes", FORCE_COLOR: "process" },
    "/process-cwd",
  ]);
  equal(state.files.get(result.setupResult.scriptPath), "echo setup\n");
  match(state.files.get("/codex/tmp/local-environment/run/wrapper-setup_wrapper.sh"), /capture_path='\/codex\/tmp\/local-environment\/run\/after-captured_env\.txt'/);
  deepEqual(state.calls.filter((call) => call[0] === "remove"), [
    ["remove", "/codex/tmp/local-environment/run", { recursive: true, force: true }],
  ]);
  deepEqual(state.calls.filter((call) => call[0] === "info").map((call) => call[1]), ["[stdout] hello", "[stdout] last"]);
  deepEqual(state.calls.filter((call) => call[0] === "error").map((call) => call[1]), ["[stderr] bad"]);
}

{
  const state = fixture();
  const result = await createLocalEnvironmentRuntime(state.dependencies).runCleanupScript(
    "/repo", localEnvironment(), null, undefined, state.host,
  );
  equal(result.status, "succeeded");
  match(result.scriptPath, /script-setup_script\.sh$/);
  equal(state.calls.some((call) => call[0] === "read-file"), false);
}

for (const processResult of [{ code: 7, signal: null }, { code: null, signal: "SIGTERM" }]) {
  const state = fixture({ processResult, stdout: [], stderr: [] });
  const result = await createLocalEnvironmentRuntime(state.dependencies).runSetupScript(
    "/repo", localEnvironment(), null, undefined, {}, state.host,
  );
  equal(result.setupResult.status, "failed");
  equal(
    result.setupResult.error,
    processResult.signal == null ? "Setup script exited with code 7" : "Setup script exited with signal SIGTERM",
  );
  equal(result.shellEnvironment, null);
}

{
  let finishWait;
  const state = fixture({
    stdout: [],
    stderr: [],
    process: {
      wait: () => new Promise((resolve) => { finishWait = resolve; }),
      kill: () => { state.calls.push(["kill"]); finishWait({ code: null, signal: "SIGTERM" }); },
    },
  });
  const controller = new AbortController();
  const pending = createLocalEnvironmentRuntime(state.dependencies).runSetupScript(
    "/repo", localEnvironment(), null, controller.signal, {}, state.host,
  );
  while (finishWait == null) await new Promise((resolve) => setImmediate(resolve));
  controller.abort();
  const result = await pending;
  equal(state.calls.filter((call) => call[0] === "kill").length, 1);
  equal(result.setupResult.status, "failed");
  equal(result.setupResult.error, "Setup script canceled");
}

{
  const boom = new Error("spawn failed");
  const state = fixture({ host: { spawn: async () => { throw boom; } } });
  const result = await createLocalEnvironmentRuntime(state.dependencies).runSetupScript(
    "/repo", localEnvironment(), null, undefined, {}, state.host,
  );
  equal(result.setupResult.status, "failed");
  equal(result.setupResult.error, "Error: spawn failed");
  equal(result.setupResult.scriptPath, "/repo/.codex/environment.toml");
  equal(result.shellEnvironment, null);
  equal(state.calls.filter((call) => call[0] === "remove").length, 1);
  deepEqual(state.calls.find((call) => call[0] === "warning").slice(1), [
    "[local-environment] setup script failed",
    { safe: {}, sensitive: { error: boom } },
  ]);
}

{
  const warning = [];
  const result = await captureEnvironmentDiff("after", "linux", {
    readFile: async () => { throw new Error("missing capture"); },
  }, "before", {
    getExcludedEnvironmentVariables: () => new Set(),
    logger: { warning: (...args) => warning.push(args) },
  });
  equal(result, null);
  equal(warning.length, 1);
  equal(warning[0][0], "[local-environment] failed to capture shell env");
}

console.log(`${assertions} worker git local environment assertions passed`);
