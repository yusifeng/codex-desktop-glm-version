import assert from "node:assert/strict";
import fs from "node:fs";
import {
  createGlobalDictationLifecycleManagerClass,
  isGlobalDictationMessage,
  isGlobalDictationPlatformSupported,
} from "../src/main/main-app/dictation/global-dictation-lifecycle-manager.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

equal(isGlobalDictationPlatformSupported("darwin"), true);
equal(isGlobalDictationPlatformSupported("win32"), true);
equal(isGlobalDictationPlatformSupported("linux"), false);
equal(isGlobalDictationMessage({ type: "global-dictation-completed" }), true);
equal(isGlobalDictationMessage({ type: "global-dictation-unknown" }), false);

function createHarness(overrides = {}) {
  const calls = [];
  const history = [];
  const registrations = [];
  const state = new Map();
  class WindowController {
    constructor(windowManager) { this.windowManager = windowManager; calls.push(["window", windowManager]); }
    close() { calls.push(["close"]); }
    hide() { calls.push(["hide"]); }
    prewarm() { calls.push(["prewarm"]); }
    setRendererReady(id) { calls.push(["renderer-ready", id]); }
    setPointerInteractive(id, value) { calls.push(["pointer", id, value]); }
    getFocusedInAppWindow() { return null; }
    async showAndStart() { calls.push(["show-and-start"]); return true; }
    sendStop(...args) { calls.push(["stop", ...args]); }
    showRecovery() { calls.push(["recovery"]); }
    async showPasteFailure(value) { calls.push(["paste-failure", value]); }
  }
  const deps = {
    WindowController,
    shared: { iu: { GLOBAL_DICTATION_FORCE_LOCK_DEBUG_ENABLED: "force-lock" } },
    validateGlobalDictationHotkey: () => null,
    getCommandBinding: () => ({ hasBinding: false }),
    resolveConfiguredHotkey: ({ keymapHotkey, legacyHotkey }) =>
      keymapHotkey.hasBinding ? keymapHotkey.accelerator : (legacyHotkey ?? null),
    isSupported: () => true,
    requestAccessibilityPermission: () => calls.push(["accessibility"]),
    isGlobalDictationMessage: (message) => message.type.startsWith("global-dictation-"),
    getClipboardFingerprint: () => "fingerprint",
    ensureGlobalDictationPermissions: (hotkey) => calls.push(["permissions", hotkey]),
    acquireCrossInstanceLock: (options) => {
      calls.push(["lock", options.name, options.force]);
      return { dispose: () => calls.push(["unlock"]) };
    },
    crossInstanceLocks: { globalDictation: "global-dictation" },
    registerGlobalHotkey: (hotkey, handlers, options) => {
      const registration = {
        hotkey,
        handlers,
        options,
        handlesRelease: true,
        unregister: () => calls.push(["unregister", hotkey]),
      };
      registrations.push(registration);
      calls.push(["register", hotkey]);
      return registration;
    },
    watchGlobalDictationRelease: () => ({ isActive: true, dispose() {} }),
    isBareModifierHotkey: () => false,
    random: { randomUUID: () => "uuid" },
    logger: { n: () => ({ warning: (...args) => calls.push(["warning", ...args]) }) },
    pasteGlobalDictation: async (...args) => { calls.push(["paste", ...args]); return null; },
    appendGlobalDictationHistory: (entry) => history.push(entry),
    ...overrides,
  };
  const Manager = createGlobalDictationLifecycleManagerClass(deps);
  const windowManager = {
    sendMessageToWebContents: (...args) => calls.push(["send", ...args]),
    sendMessageToWebContentsId: (...args) => calls.push(["send-id", ...args]),
  };
  const globalState = {
    get: (key) => state.get(key),
    set: (key, value) => { state.set(key, value); calls.push(["state", key, value]); },
  };
  const manager = new Manager({
    canForceGlobalDictationLock: true,
    forceGlobalDictationLock: false,
    getVisibleNativePetWebContents: () => null,
    windowManager,
    globalState,
  });
  return { calls, globalState, history, manager, registrations, state, windowManager };
}

{
  const harness = createHarness();
  equal(harness.manager.getHotkeyState(), {
    supported: false,
    configuredHotkey: null,
    configuredToggleHotkey: null,
  });
  equal(await harness.manager.handleMessage({ sender: { id: 1 } }, { type: "other" }), false);
  equal(await harness.manager.handleMessage(
    { sender: { id: 1 } },
    { type: "global-dictation-enabled-changed", enabled: true },
  ), true);
  equal(harness.manager.getHotkeyState().supported, true);

  equal(harness.manager.setHotkey("Ctrl+D"), {
    success: true,
    state: {
      supported: true,
      configuredHotkey: "Ctrl+D",
      configuredToggleHotkey: null,
    },
  });
  equal(harness.registrations[0].hotkey, "Ctrl+D");
  equal(harness.registrations[0].options.bareModifierTrigger, "cancellablePress");
  equal(harness.state.get("globalDictationHotkey"), "Ctrl+D");
  equal(harness.calls.some(([name]) => name === "prewarm"), true);

  harness.manager.syncCommandKeybindings({ holdHotkey: "Alt+D", toggleHotkey: "Alt+T" });
  equal(harness.state.get("globalDictationHotkey"), "Alt+D");
  equal(harness.state.get("globalDictationToggleHotkey"), "Alt+T");
  equal(harness.calls.some((call) => call[0] === "permissions" && call[1] === "Alt+D"), true);
  harness.manager.dispose();
  equal(harness.calls.some(([name]) => name === "unlock"), true);
}

{
  const harness = createHarness({ validateGlobalDictationHotkey: () => "invalid" });
  harness.manager.setGateEnabled(true);
  equal(harness.manager.setHotkey("bad"), {
    success: false,
    error: "invalid",
    state: { supported: true, configuredHotkey: null, configuredToggleHotkey: null },
  });
  equal(harness.registrations, []);
}

{
  const harness = createHarness({ isSupported: () => false });
  harness.manager.setGateEnabled(true);
  equal(harness.manager.setToggleHotkey("Ctrl+T").success, false);
  equal(harness.manager.getHotkeyState().supported, false);
}

{
  const harness = createHarness();
  harness.manager.setGateEnabled(true);
  await harness.manager.handleMessage(
    { sender: { id: 7 } },
    { type: "global-dictation-renderer-ready" },
  );
  await harness.manager.handleMessage(
    { sender: { id: 7 } },
    { type: "global-dictation-pointer-interaction-changed", isInteractive: true },
  );
  equal(harness.calls.some((call) => call[0] === "renderer-ready" && call[1] === 7), true);
  equal(harness.calls.some((call) => call[0] === "pointer" && call[2] === true), true);

  await harness.manager.handleMessage(
    { sender: { id: 7 } },
    { type: "global-dictation-record-history-item", text: "  transcript  " },
  );
  equal(harness.history, [{ id: "uuid", createdAtMs: harness.history[0].createdAtMs, text: "transcript" }]);
  equal(harness.manager.recordHistoryText("empty", "   "), null);
}

{
  const visible = { id: 99 };
  const harness = createHarness();
  harness.manager.options.getVisibleNativePetWebContents = () => visible;
  harness.manager.setNativePetRendererReady(99, true);
  equal(harness.calls.some((call) => call[0] === "send" && call[2].type === "global-dictation-idle"), true);
  await harness.manager.startSession("toggle");
  equal(harness.manager.activeSession.type, "pet");
  equal(harness.calls.some((call) => call[0] === "send" && call[2].type === "global-dictation-start"), true);
  harness.manager.stopRecording("uuid");
  equal(harness.calls.some((call) => call[0] === "send-id" && call[2].type === "global-dictation-stop"), true);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createGlobalDictationLifecycleManagerClass"), true);
equal(main.includes("dat = createGlobalDictationLifecycleManagerClass({"), true);
equal(main.includes("dat = class"), false);
equal(main.includes("function W7("), false);
equal(main.includes("function G7("), false);
equal(main.includes("function fat("), false);

console.log(`${assertions} main global-dictation lifecycle-manager assertions passed`);
