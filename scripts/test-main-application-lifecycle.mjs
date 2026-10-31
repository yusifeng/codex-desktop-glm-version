import assert from "node:assert/strict";
import fs from "node:fs";
import {
  formatQuitConfirmationDetail,
  installApplicationLifecycle,
} from "../src/main/main-app/startup/application-lifecycle.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const settle = async () => {
  for (let index = 0; index < 5; index += 1) await new Promise((resolve) => setImmediate(resolve));
};

function createHarness(options = {}) {
  const handlers = new Map();
  const calls = [];
  const dialogs = [];
  const existingWindow = options.existingWindow === false
    ? null
    : { webContents: "existing-contents", isDestroyed: () => false };
  const createdWindow = {
    webContents: "created-contents",
    isDestroyed: () => options.createdDestroyed ?? false,
  };
  const app = {
    isPackaged: options.packaged ?? false,
    getName: () => "Codex",
    on(event, handler) { handlers.set(event, handler); },
    quit() { calls.push("app-quit"); },
  };
  const quitState = {
    allowQuitTemporarily: () => calls.push("allow-quit"),
    canQuitWithoutPrompt: () => options.canQuitWithoutPrompt ?? false,
    markQuitApproved: () => calls.push("quit-approved"),
    shouldSkipDrainBeforeQuit: () => options.skipDrain ?? false,
  };
  const windows = {
    markAppQuitting: () => calls.push("mark-app-quitting"),
    showLastActivePrimaryWindow: () => existingWindow,
    windowManager: {
      hasPendingAuxiliaryActivationTarget: () => options.pendingAuxiliary ?? false,
    },
  };
  installApplicationLifecycle({
    app,
    BrowserWindow: {
      getFocusedWindow: () => options.focusedWindow ?? null,
    },
    showMessageBoxSync: (dialogOptions) => {
      dialogs.push(dialogOptions);
      return options.dialogResponse ?? 1;
    },
    getNativeIntl: () => ({
      formatMessage({ messageId, defaultMessage, values = {} }) {
        calls.push(["format", messageId]);
        return Object.entries(values).reduce(
          (message, [key, value]) => message.replace(`{${key}}`, String(value)),
          defaultMessage,
        );
      },
    }),
    shouldBlockQuit: () => options.blockQuit ?? false,
    hasInProgressLocalConversation: () => options.activeLocal ?? false,
    getAutomations: () => options.automations ?? [],
    observeSystemShutdown: (callback) => { handlers.set("system-shutdown", callback); },
    armWindowsForcedExit: () => calls.push("arm-windows-exit"),
    waitForContextCleanup: async (cleanup) => {
      calls.push("wait-context");
      await cleanup();
    },
    isWindows: options.isWindows ?? false,
    disableQuitConfirmationPrompt: options.disablePrompt ?? false,
    quitState,
    windows,
    applicationMenuManager: { refresh: () => calls.push("refresh-menu") },
    ensureWindow: async () => {
      calls.push("ensure-window");
      return createdWindow;
    },
    hotkeyWindowLifecycleManager: { dispose: () => calls.push("dispose-hotkeys") },
    globalDictationLifecycleManager: { dispose: () => calls.push("dispose-dictation") },
    globalState: { flush: async () => { calls.push("flush-global"); } },
    settingsStore: { flush: async () => { calls.push("flush-settings"); } },
    getPendingWorktrees: () => options.pendingWorktrees ?? null,
    stopCodexMicro: async () => { calls.push("stop-codex-micro"); },
    flushTracingBeforeQuit: async () => { calls.push("flush-tracing"); },
    flushAndDisposeContext: async () => { calls.push("flush-context"); },
    disposables: { dispose: () => calls.push("dispose-all") },
    appEvent: { emit: (event) => calls.push(["app-event", event]) },
    onAppEntrySource: (source, webContents) => calls.push(["entry", source, webContents]),
    canAttributeAppReactivation: () => options.attributeReactivation ?? false,
  });
  const event = () => ({ preventDefaultCalls: 0, preventDefault() { this.preventDefaultCalls += 1; } });
  return { app, calls, createdWindow, dialogs, emit: (name, ...args) => handlers.get(name)(...args), event, handlers };
}

{
  const harness = createHarness({ blockQuit: true });
  const event = harness.event();
  harness.emit("before-quit", event);
  equal(event.preventDefaultCalls, 1);
  equal(harness.dialogs, []);
  equal(harness.calls.includes("mark-app-quitting"), false);
}

{
  const harness = createHarness();
  const event = harness.event();
  harness.emit("before-quit", event);
  equal(event.preventDefaultCalls, 0);
  equal(harness.calls, ["mark-app-quitting"]);
}

{
  const harness = createHarness({
    activeLocal: true,
    automations: [{ status: "ACTIVE" }],
    pendingWorktrees: [
      { launchMode: "create-stable-worktree", phase: "creating" },
      { launchMode: "worktree", phase: "failed" },
      { launchMode: "worktree", phase: "creating", conversationStartResult: { status: "pending" } },
    ],
    dialogResponse: 1,
  });
  const event = harness.event();
  harness.emit("before-quit", event);
  equal(event.preventDefaultCalls, 1);
  equal(harness.dialogs.length, 1);
  equal(harness.dialogs[0].title, "Quit Codex?");
  equal(harness.dialogs[0].detail, "Chats still starting in new worktrees may be lost, including on remote hosts. Active local chats will be interrupted and scheduled tasks won't run while Codex is closed");
  equal(harness.calls.includes("quit-approved"), false);
}

{
  const harness = createHarness({ activeLocal: true, dialogResponse: 0 });
  const event = harness.event();
  harness.emit("before-quit", event);
  equal(event.preventDefaultCalls, 0);
  equal(harness.calls.slice(-2), ["quit-approved", "mark-app-quitting"]);
  harness.emit("activate");
  equal(harness.calls.includes("refresh-menu"), false);
}

{
  const harness = createHarness({ isWindows: true, activeLocal: true });
  harness.emit("before-quit", harness.event());
  equal(harness.dialogs, []);
  equal(harness.calls, ["mark-app-quitting"]);
}

{
  const harness = createHarness({ attributeReactivation: true });
  harness.emit("activate");
  equal(harness.calls, [
    ["entry", { channel: "shortcut", source: "shortcut" }, "existing-contents"],
    "refresh-menu",
  ]);
  harness.emit("browser-window-blur");
  harness.emit("browser-window-focus");
  equal(harness.calls.slice(-3), [
    ["app-event", "background"],
    ["app-event", "foreground"],
    "refresh-menu",
  ]);
}

{
  const harness = createHarness({ existingWindow: false, attributeReactivation: true });
  harness.emit("activate");
  await settle();
  equal(harness.calls, [
    "ensure-window",
    "refresh-menu",
    ["entry", { channel: "shortcut", source: "shortcut" }, "created-contents"],
  ]);
  harness.emit("system-shutdown");
  equal(harness.calls.at(-1), "allow-quit");
}

{
  const harness = createHarness({ pendingAuxiliary: true });
  harness.emit("activate");
  equal(harness.calls, ["refresh-menu"]);
}

{
  const harness = createHarness({ isWindows: true, packaged: true });
  const event = harness.event();
  harness.emit("will-quit", event);
  equal(event.preventDefaultCalls, 1);
  await settle();
  equal(harness.calls, [
    "arm-windows-exit",
    "dispose-hotkeys",
    "dispose-dictation",
    "flush-global",
    "flush-settings",
    "stop-codex-micro",
    "flush-tracing",
    "wait-context",
    "flush-context",
    "dispose-all",
    "app-quit",
  ]);
  const repeat = harness.event();
  harness.emit("will-quit", repeat);
  equal(repeat.preventDefaultCalls, 0);
  equal(harness.calls.filter((call) => call === "dispose-all").length, 1);
}

{
  const harness = createHarness({ skipDrain: true });
  harness.emit("will-quit", harness.event());
  await settle();
  equal(harness.calls.includes("flush-settings"), false);
  equal(harness.calls.includes("flush-context"), true);
}

const nativeIntl = { formatMessage: ({ messageId }) => messageId };
const details = [
  [false, true, false, "desktop.quitConfirmation.scheduledTasksDetail"],
  [true, false, false, "desktop.quitConfirmation.activeLocalTasksDetail"],
  [true, true, false, "desktop.quitConfirmation.activeLocalAndScheduledTasksDetail"],
  [false, false, true, "desktop.quitConfirmation.pendingWorktreeChatsDetail"],
  [true, false, true, "desktop.quitConfirmation.pendingWorktreeAndLocalChatsDetail"],
  [false, true, true, "desktop.quitConfirmation.pendingWorktreeAndScheduledTasksDetail"],
  [true, true, true, "desktop.quitConfirmation.pendingWorktreeLocalAndScheduledTasksDetail"],
];
for (const [active, scheduled, pending, expected] of details) {
  equal(formatQuitConfirmationDetail({
    nativeIntl,
    appName: "Codex",
    hasInProgressLocalConversation: active,
    hasEnabledAutomations: scheduled,
    hasPendingWorktreeChats: pending,
  }), expected);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("installApplicationLifecycle"), true);
equal(main.includes("installApplicationLifecycle({"), true);
equal(main.includes("observeSystemShutdown: _rt"), true);
equal(main.includes("function Brt("), false);
equal(main.includes("function Vrt("), false);
equal(main.includes("desktop.quitConfirmation.pendingWorktreeLocalAndScheduledTasksDetail"), false);

console.log(`${assertions} main application-lifecycle assertions passed`);
