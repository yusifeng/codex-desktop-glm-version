import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/diagnostics/native-command-crash.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createNativeCommandCrashRuntime } = await import(
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

function parseShellWords(command) {
  const doubleQuotes = (command.match(/"/g) ?? []).length;
  const singleQuotes = (command.match(/'/g) ?? []).length;
  if (doubleQuotes % 2 !== 0 || singleQuotes % 2 !== 0) throw new Error("unterminated quote");
  return (command.match(/"[^"]*"|'[^']*'|[^\s]+/g) ?? [])
    .map((token) => token.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/u, (_match, double, single) => double ?? single));
}

const runtime = createNativeCommandCrashRuntime({
  notificationSchema: {
    safeParse(value) {
      return value?.item?.type === "commandExecution" && typeof value.threadId === "string"
        ? { success: true, data: value }
        : { success: false };
    },
  },
  parseShellWords,
  path,
  pathContains(candidate, parent) {
    return candidate === parent || candidate.startsWith(`${parent}${path.sep}`);
  },
});

equal(runtime.normalizeSessionSource(null), null, "null session source remains null");
equal(runtime.normalizeSessionSource("cli"), "cli", "string session source is preserved");
equal(runtime.normalizeSessionSource({ custom: {} }), "custom", "custom session source is normalized");
equal(runtime.normalizeSessionSource({ subAgent: "review" }), "subAgent.review", "named subagent is normalized");
equal(runtime.normalizeSessionSource({ subAgent: { thread_spawn: {} } }), "subAgent.thread_spawn", "thread-spawn subagent is normalized");
equal(runtime.normalizeSessionSource({ subAgent: { other: {} } }), "subAgent.other", "unknown subagent object has stable label");

equal(runtime.classifyExecutable("C:\\Tools\\Python3.12.exe"), "python", "versioned Python executable is classified cross-platform");
equal(runtime.classifyExecutable("/usr/bin/libreoffice"), "soffice", "LibreOffice aliases to soffice");
equal(runtime.classifyExecutable("pdftoppm"), "pdftoppm", "known PDF utility is classified");
equal(runtime.classifyExecutable("bash"), null, "unknown executable is not attributed");

equal(runtime.splitShellSegments("node a.js && git status | pdfinfo file.pdf"), [
  "node a.js ", " git status ", " pdfinfo file.pdf",
], "shell control operators split command segments");
equal(runtime.splitShellSegments("node \"a|b.js\"; python 'x;y.py'"), [
  "node \"a|b.js\"", " python 'x;y.py'",
], "quoted separators do not split segments");
equal(runtime.splitShellSegments("echo a \\| b &> out"), ["echo a \\| b &> out"], "escaped pipe and output redirection ampersand do not split");

equal(runtime.resolveExecutable(["NODE_ENV=test node app.js"]), "node", "environment assignments are skipped");
equal(runtime.resolveExecutable(["python3.11 script.py"]), "python", "Python version aliases resolve");
equal(runtime.resolveExecutable(["git status && git diff"]), "git", "same executable across segments remains attributable");
equal(runtime.resolveExecutable(["git status | node filter.js"]), "unknown", "mixed executables become unknown");
equal(runtime.resolveExecutable(["bash script.sh"]), "unknown", "unrecognized command becomes unknown");
equal(runtime.resolveExecutable(["node \"unterminated"]), "unknown", "shell parse failure is contained");

const baseItem = {
  aggregatedOutput: "",
  command: "node app.js",
  cwd: "/repo",
  durationMs: 120,
  exitCode: 139,
  id: "item-1",
  source: "agent",
  status: "failed",
  type: "commandExecution",
};
const notification = (item = baseItem, overrides = {}) => ({
  method: "item/completed",
  params: { item, threadId: "thread-1", turnId: "turn-1", ...overrides },
});
equal(runtime.classifyCrashNotification({ method: "other" }), null, "unrelated notifications are ignored");
equal(runtime.classifyCrashNotification({ method: "item/completed", params: {} }), null, "invalid completion payload is ignored");
equal(runtime.classifyCrashNotification(notification({ ...baseItem, source: "userShell" })), null, "user shell crashes are excluded");
equal(runtime.classifyCrashNotification(notification({ ...baseItem, status: "declined" })), null, "declined commands are excluded");
const classified = runtime.classifyCrashNotification(notification());
equal(classified.signal, "SIGSEGV", "exit code maps to native signal");
equal(classified.signalSource, "exit-code", "mapped exit signal records its source");
equal(classified.executable, "node", "crash includes executable classification");
equal(classified.dedupeKey, "thread-1:turn-1:item-1", "crash identity includes thread, turn, and item");
equal(classified.durationMs, 120, "crash preserves duration");

const outputCrash = runtime.classifyCrashNotification(notification({
  ...baseItem,
  aggregatedOutput: "Segmentation fault: 11",
  exitCode: 1,
}));
equal(outputCrash.signal, "SIGSEGV", "output signature recovers missing signal exit code");
equal(outputCrash.signalSource, "output", "output-derived signal is marked");
equal(runtime.classifyCrashNotification(notification({
  ...baseItem,
  aggregatedOutput: "Segmentation fault",
  exitCode: 1,
  status: "completed",
})), null, "output signature requires failed status");
equal(runtime.classifyCrashNotification(notification({ ...baseItem, exitCode: 0 })), null, "ordinary successful exit is ignored");
const actionCrash = runtime.classifyCrashNotification(notification({
  ...baseItem,
  commandActions: [{ command: "git status" }, { command: "git diff" }],
}));
equal(actionCrash.commands, ["git status", "git diff"], "command actions replace the aggregate command");

equal(runtime.resolvePrimaryRuntimeScript({ executable: "node", args: ["script.mjs"] }), "script.mjs", "Node script extension is admitted");
equal(runtime.resolvePrimaryRuntimeScript({ executable: "node", args: ["--version"] }), null, "Node option is not treated as script");
equal(runtime.resolvePrimaryRuntimeScript({ executable: "python", args: ["script.py"] }), "script.py", "Python script extension is admitted");
equal(runtime.resolvePrimaryRuntimeScript({ executable: "python", args: ["script.txt"] }), null, "non-Python extension is rejected");

equal(runtime.attributePrimaryRuntime({
  crash: { commands: ["/runtime/bin/node /runtime/scripts/task.js"], cwd: "/repo", executable: "node" },
  primaryRuntimeRoot: "/runtime",
}), { attribution: "primary-runtime-script", scriptName: "task.js" }, "absolute runtime script is attributed");
equal(runtime.attributePrimaryRuntime({
  crash: { commands: ["node scripts/task.js"], cwd: "/runtime", executable: "node" },
  primaryRuntimeRoot: "/runtime",
}), { attribution: "primary-runtime-script", scriptName: "task.js" }, "relative runtime script is resolved from cwd");
equal(runtime.attributePrimaryRuntime({
  crash: { commands: ["/runtime/bin/git status"], cwd: "/repo", executable: "git" },
  primaryRuntimeRoot: "/runtime",
}), { attribution: "primary-runtime-executable" }, "runtime executable is attributed when no script applies");
equal(runtime.attributePrimaryRuntime({
  crash: { commands: ["/usr/bin/git status"], cwd: "/repo", executable: "git" },
  primaryRuntimeRoot: "/runtime",
}), null, "system executable is not attributed to runtime");
equal(runtime.attributePrimaryRuntime({
  crash: { commands: ["node a.js", "node b.js"], cwd: "/runtime", executable: "node" },
  primaryRuntimeRoot: "/runtime",
}), null, "different command actions cannot claim one runtime attribution");
equal(runtime.attributePrimaryRuntime({
  crash: { commands: ["node a.js | node b.js"], cwd: "/runtime", executable: "node" },
  primaryRuntimeRoot: "/runtime",
}), null, "multi-segment pipeline is not attributed as one runtime script");

function reportingOptions(overrides = {}) {
  const captures = [];
  let diagnoses = 0;
  return {
    captures,
    get diagnoses() { return diagnoses; },
    options: {
      captureMessage(message, context) { captures.push({ message, context }); },
      crash: classified,
      async diagnosePrimaryRuntimeDependencies() {
        diagnoses += 1;
        return { installed: true, bundleVersion: "runtime-1" };
      },
      async getMetadataTags() {
        return { app_build: "42", app_version: "1.0", cli_version: "0.1", session_source: "local" };
      },
      async getPlatformOs() { return "macos"; },
      async getPrimaryRuntimeDependencyRoot() { return null; },
      ...overrides,
    },
  };
}

const directReport = reportingOptions();
await runtime.reportNativeCommandCrash(directReport.options);
equal(directReport.captures.length, 1, "exit-code crash is reported");
equal(directReport.captures[0].message, "Native command crashed", "diagnostic message is stable");
equal(directReport.captures[0].context.fingerprint, ["native-command-crash", "macos", "node", "SIGSEGV"], "fingerprint captures platform, executable, and signal");
equal(directReport.captures[0].context.extra.processAttribution, "direct-command", "non-runtime executable is direct");
equal(directReport.captures[0].context.extra.usedPrimaryRuntime, false, "non-runtime crash does not claim bundled runtime");
equal(directReport.diagnoses, 0, "non-runtime crash skips runtime diagnosis");

const suppressed = reportingOptions({
  crash: { ...outputCrash, executable: "git", commands: ["git status"] },
});
await runtime.reportNativeCommandCrash(suppressed.options);
equal(suppressed.captures.length, 0, "weak output-only signal is suppressed for direct git");

const soffice = reportingOptions({
  crash: { ...outputCrash, executable: "soffice", commands: ["soffice --headless"] },
});
await runtime.reportNativeCommandCrash(soffice.options);
equal(soffice.captures.length, 1, "soffice output crash is allowed as a known native process");

const runtimeReport = reportingOptions({
  crash: {
    ...outputCrash,
    commands: ["/runtime/bin/node /runtime/scripts/task.js"],
    cwd: "/repo",
    executable: "node",
  },
  async getPrimaryRuntimeDependencyRoot() { return "/runtime"; },
});
await runtime.reportNativeCommandCrash(runtimeReport.options);
equal(runtimeReport.captures.length, 1, "output crash in bundled runtime script is reported");
equal(runtimeReport.diagnoses, 1, "attributed runtime crash diagnoses dependencies");
equal(runtimeReport.captures[0].context.tags["runtime.bundle_version"], "runtime-1", "installed runtime bundle version is tagged");
equal(runtimeReport.captures[0].context.tags["runtime.script_name"], "task.js", "runtime script basename is tagged");
equal(runtimeReport.captures[0].context.extra.processAttribution, "primary-runtime-script", "runtime script attribution is explicit");

const fallbackReport = reportingOptions({
  async getPlatformOs() { throw new Error("platform unavailable"); },
  async getPrimaryRuntimeDependencyRoot() { throw new Error("root unavailable"); },
  async getMetadataTags() { throw new Error("metadata unavailable"); },
});
await runtime.reportNativeCommandCrash(fallbackReport.options);
equal(fallbackReport.captures.length, 1, "platform/root/metadata failures do not suppress reporting");
equal(fallbackReport.captures[0].context.tags.app_build, undefined, "missing metadata remains absent");

await runtime.reportNativeCommandCrash(reportingOptions({
  captureMessage() { throw new Error("capture unavailable"); },
}).options);
assertions += 1;

let notificationHandler;
const installerCaptures = [];
const disposer = runtime.installNativeCommandCrashReporting({
  captureMessage(message, context) { installerCaptures.push({ message, context }); },
  async diagnosePrimaryRuntimeDependencies() { return null; },
  async getMetadataTags() { return {}; },
  async getPlatformOs() { return "linux"; },
  async getPrimaryRuntimeDependencyRoot() { return null; },
  registerInternalNotificationHandler(handler) {
    notificationHandler = handler;
    return "dispose-token";
  },
});
equal(disposer, "dispose-token", "installer returns notification registration disposer");
notificationHandler(notification());
notificationHandler(notification());
await new Promise((resolve) => setImmediate(resolve));
equal(installerCaptures.length, 1, "installer deduplicates repeated item completion identity");

ok(assertions >= 55, "native command crash owner has broad classification, attribution, and reporting coverage");
console.log(`${assertions} main native command crash owner assertions passed`);
