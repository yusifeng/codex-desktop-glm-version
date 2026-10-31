import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const settle = async () => {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/startup/app-update-lifecycle.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { createAppUpdateLifecycle } = loaded.exports;

function createHarness(options = {}) {
  const calls = [];
  let bridge;
  const installSnapshot = {
    clearAfterAbort: () => (calls.push(["clear-snapshot"]), options.clearAfterAbort ?? true),
    saveForInstall: (request) => {
      calls.push(["save-snapshot", request]);
      return options.snapshot ?? { threadIds: ["thread-1", "thread-2"] };
    },
  };
  const lifecycle = createAppUpdateLifecycle({
    allowQuitTemporarily: () => calls.push(["allow-quit"]),
    appQuit: () => calls.push(["app-quit"]),
    applyQuitForUpdatePolicy: ({ exitImmediately, exitImmediatelyForUpdateInstall, quitForUpdateInstall, allowQuitTemporarily }) => {
      calls.push(["quit-policy", exitImmediately]);
      if (exitImmediately) exitImmediatelyForUpdateInstall();
      else { allowQuitTemporarily(); quitForUpdateInstall(); }
    },
    armWindowsForcedExit: () => calls.push(["arm-forced-exit"]),
    beforeImmediateExit: () => calls.push(["before-immediate-exit"]),
    broadcastAppUpdateState: () => calls.push(["broadcast"]),
    cleanupBeforeImmediateExit: async (cleanupOptions) => calls.push(["cleanup", cleanupOptions]),
    cleanupForImmediateQuitOnUpdate: async (cleanupOptions) => {
      calls.push(["immediate-cleanup"]);
      cleanupOptions.markAppQuitting();
      await cleanupOptions.runCleanupBeforeImmediateExit();
      cleanupOptions.exit(0);
    },
    disposables: "disposables",
    exit: (code) => calls.push(["exit", code]),
    flushAndDisposeContext: "flush-context",
    flushGitWorker: async () => calls.push(["flush-git-worker"]),
    flushGlobalState: async () => calls.push(["flush-global-state"]),
    flushGlobalStateOrThrow: async () => calls.push(["flush-global-state-or-throw"]),
    flushTracing: async () => calls.push(["flush-tracing"]),
    getAppServerClient: () => Object.hasOwn(options, "client") ? options.client : { id: "client" },
    getLogger: () => ({
      info: (...args) => calls.push(["info", ...args]),
      warning: (...args) => calls.push(["warning", ...args]),
    }),
    getProjectRootPaths: () => ["/one", "/two"],
    globalDictationLifecycleManager: "dictation",
    hotkeyWindowLifecycleManager: "hotkey",
    installSnapshot,
    isPackaged: options.isPackaged ?? true,
    isTrustedIpcEvent: "trusted-check",
    isWindows: options.isWindows ?? true,
    listWindows: () => [],
    markAppQuitting: () => calls.push(["mark-quitting"]),
    quitState: {
      allowQuitTemporarily: (value) => calls.push(["quit-state-allow", value]),
    },
    registerBridgeHandlers: (handlers) => { bridge = handlers; },
    stopFsmonitor: async (root, client) => calls.push(["stop-fsmonitor", root, client.id]),
    stopService: async () => calls.push(["stop-service"]),
    terminateProcessTree: () => calls.push(["terminate-tree"]),
  });
  return { bridge, calls, lifecycle };
}

{
  const { bridge, calls, lifecycle } = createHarness();
  equal(bridge.isTrustedIpcEvent, "trusted-check");
  bridge.onDownloadProgressChanged();
  bridge.onDownloadedUpdateAppBrandChanged();
  bridge.onInstallProgressChanged();
  bridge.onUpdateReadyChanged();
  bridge.onUpdateLifecycleStateChanged();
  bridge.onRelaunchNoticeChanged();
  equal(calls.filter(([type]) => type === "broadcast").length, 6);
  calls.length = 0;
  bridge.onInstallUpdatesRequested({ quitImmediately: false });
  equal(calls, [["allow-quit"]]);
  calls.length = 0;
  bridge.onInstallUpdatesRequested({});
  equal(calls, [["allow-quit"], ["app-quit"]]);
  calls.length = 0;
  bridge.onInstallUpdatesAborted();
  equal(calls, [
    ["quit-state-allow", { allowWithoutPrompt: false }],
    ["clear-snapshot"],
    ["info", "update_resume_state_cleared_after_install_abort"],
  ]);

  calls.length = 0;
  lifecycle.enableHostReadyInstallHandling();
  bridge.onInstallUpdatesRequested({ quitImmediately: false });
  equal(calls[0], ["save-snapshot", { quitImmediately: false }]);
  equal(calls[1], ["info", "update_resume_state_saved", { safe: { threadCount: 2 } }]);
  equal(calls.some(([type]) => type === "allow-quit"), false);

  calls.length = 0;
  bridge.onInstallUpdatesRequested({});
  equal(calls.slice(0, 4), [
    ["arm-forced-exit"],
    ["save-snapshot", {}],
    ["info", "update_resume_state_saved", { safe: { threadCount: 2 } }],
    ["quit-policy", true],
  ]);
  await settle();
  equal(calls.some(([type]) => type === "flush-global-state"), true);
  equal(calls.some(([type]) => type === "stop-service"), true);
  equal(calls.some(([type]) => type === "flush-tracing"), true);
  equal(calls.some(([type]) => type === "flush-git-worker"), true);
  equal(calls.some(([type]) => type === "immediate-cleanup"), true);
  equal(calls.some(([type]) => type === "mark-quitting"), true);
  equal(calls.some(([type]) => type === "before-immediate-exit"), true);
  equal(calls.some((call) => call[0] === "cleanup" && call[1].disposables === "disposables"), true);
  equal(calls.at(-1), ["exit", 0]);

  calls.length = 0;
  await lifecycle.prepareWindowsUpdate();
  equal(calls.slice(0, 3), [
    ["save-snapshot", { quitImmediately: false }],
    ["info", "update_resume_state_saved", { safe: { threadCount: 2 } }],
    ["flush-global-state-or-throw"],
  ]);
  equal(calls.slice(-2), [
    ["stop-fsmonitor", "/one", "client"],
    ["stop-fsmonitor", "/two", "client"],
  ]);
}

{
  const { bridge, calls, lifecycle } = createHarness({ isPackaged: false, isWindows: false });
  bridge.onInstallProgressChanged();
  equal(calls, []);
  lifecycle.enableHostReadyInstallHandling();
  bridge.onInstallUpdatesRequested({ quitImmediately: false });
  equal(calls.at(-1), ["quit-state-allow", {
    allowWithoutPrompt: true,
    skipDrainBeforeQuit: true,
  }]);
  calls.length = 0;
  bridge.onInstallUpdatesRequested({});
  equal(calls.some(([type]) => type === "arm-forced-exit"), false);
  equal(calls.slice(-3), [["quit-policy", false], ["allow-quit"], ["app-quit"]]);
}

{
  const { calls, lifecycle } = createHarness({ client: null });
  lifecycle.enableHostReadyInstallHandling();
  await lifecycle.prepareWindowsUpdate();
  equal(calls.some(([type]) => type === "flush-global-state-or-throw"), true);
  equal(calls.some(([type]) => type === "stop-fsmonitor"), false);
}

console.log(`${assertions} app-update lifecycle assertions passed`);
