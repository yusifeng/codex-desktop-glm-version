#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "src/main/main-app/hotkey/appshot-hotkey-manager.ts");
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "appshot-hotkey-manager-"));
const output = path.join(temporaryDirectory, "appshot-hotkey-manager.mjs");

await build({
  bundle: true,
  entryPoints: [source],
  format: "esm",
  logLevel: "silent",
  outfile: output,
  platform: "node",
});
const { AppshotHotkeyManager } = await import(pathToFileURL(output));

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const ok = (value, message) => {
  assert.ok(value, message);
  assertions += 1;
};

function createHarness(overrides = {}) {
  const calls = [];
  const logs = [];
  const stored = new Map();
  if (Object.hasOwn(overrides, "storedHotkey")) stored.set("appshotHotkey", overrides.storedHotkey);
  let destination = overrides.destination ?? "automatic";
  let shortcutState = {
    canAcceptAppshotShortcut: true,
    isNewChatRoute: false,
    ...overrides.shortcutState,
  };
  let focusedRecently = overrides.focusedRecently ?? true;
  let quickChatResult = overrides.quickChatResult ?? false;
  let nativeRegistration = null;
  let globalRegistration = null;
  let nextGlobalRegistration = overrides.globalRegistration ?? true;
  let nextNativeRegistration = overrides.nativeRegistration ?? true;
  let validationError = overrides.validationError ?? null;
  const timers = [];
  const webContents = {
    id: 41,
    backgroundThrottling: overrides.backgroundThrottling ?? true,
    destroyed: false,
    getBackgroundThrottling() {
      return this.backgroundThrottling;
    },
    isDestroyed() {
      return this.destroyed;
    },
    setBackgroundThrottling(value) {
      this.backgroundThrottling = value;
      calls.push(["background-throttling", value]);
    },
  };
  const window = {
    id: 7,
    destroyed: false,
    webContents,
    isDestroyed() {
      return this.destroyed;
    },
  };
  const bridge = overrides.bridge === null ? null : {
    claimHotkeyFlight(owner) {
      calls.push(["claim-flight", owner.id]);
    },
    registerHotkey(hotkey, handlers) {
      calls.push(["native-register", hotkey]);
      if (nextNativeRegistration instanceof Error) throw nextNativeRegistration;
      if (!nextNativeRegistration) return null;
      nativeRegistration = {
        handlers,
        unregister() {
          calls.push(["native-unregister", hotkey]);
        },
      };
      return nativeRegistration;
    },
    async release() {
      calls.push(["bridge-release"]);
    },
  };
  const dependencies = {
    destinationSettingKey: "destination",
    enabled: overrides.enabled ?? true,
    globalState: {
      getStored(key) {
        return stored.get(key);
      },
      set(key, value) {
        stored.set(key, value);
        calls.push(["persist", key, value]);
      },
    },
    handleQuickChatAppshotShortcut(payload) {
      calls.push(["quick-chat", payload]);
      return quickChatResult;
    },
    logger() {
      return {
        info(message, context) {
          logs.push(["info", message, context]);
        },
        warning(message, context) {
          logs.push(["warning", message, context]);
        },
      };
    },
    onSupportChanged() {
      calls.push(["support-changed"]);
    },
    platform: overrides.platform ?? "win32",
    registerGlobalHotkey(hotkey, handlers, options) {
      calls.push(["global-register", hotkey, options]);
      if (nextGlobalRegistration instanceof Error) throw nextGlobalRegistration;
      if (!nextGlobalRegistration) return null;
      globalRegistration = {
        handlers,
        unregister() {
          calls.push(["global-unregister", hotkey]);
        },
      };
      return globalRegistration;
    },
    setTimeout(callback, delay) {
      const timer = {
        callback,
        delay,
        refreshCount: 0,
        refresh() {
          this.refreshCount += 1;
        },
        unref() {
          return this;
        },
      };
      timers.push(timer);
      return timer;
    },
    settingsStore: {
      getEffective() {
        return destination;
      },
    },
    validateBareModifierHotkey(hotkey, options) {
      calls.push(["validate-bare", hotkey, options]);
    },
    validateHotkey(hotkey) {
      calls.push(["validate", hotkey]);
      return validationError;
    },
    windowManager: {
      getAppShellShortcutState() {
        return shortcutState;
      },
      getPrimaryWindow() {
        return overrides.noWindow ? null : window;
      },
      sendMessageToWindow(target, message) {
        calls.push(["send", target.id, message]);
      },
      wasPrimaryWindowFocusedWithin(target, duration) {
        calls.push(["focused-within", target.id, duration]);
        return focusedRecently;
      },
    },
    windowsCaptureNativeBridge: bridge,
  };
  const manager = new AppshotHotkeyManager(dependencies);
  return {
    bridge,
    calls,
    dependencies,
    get globalRegistration() { return globalRegistration; },
    logs,
    manager,
    get nativeRegistration() { return nativeRegistration; },
    setDestination(value) { destination = value; },
    setFocusedRecently(value) { focusedRecently = value; },
    setGlobalRegistration(value) { nextGlobalRegistration = value; },
    setNativeRegistration(value) { nextNativeRegistration = value; },
    setQuickChatResult(value) { quickChatResult = value; },
    setShortcutState(value) { shortcutState = value; },
    setValidationError(value) { validationError = value; },
    stored,
    timers,
    webContents,
    window,
  };
}

{
  const h = createHarness();
  equal(h.manager.getState(), { configuredHotkey: "DoubleAlt", isActive: true, supported: true });
  equal(h.calls[0], ["native-register", "DoubleAlt"]);
  h.nativeRegistration.handlers.onPressed();
  equal(h.webContents.backgroundThrottling, false);
  equal(h.calls.filter(([name]) => name === "claim-flight").length, 1);
  equal(h.calls.at(-1), ["send", 7, { type: "appshot-shortcut" }]);
  equal(h.timers[0].delay, 2_000);
  h.nativeRegistration.handlers.onPressed();
  equal(h.timers.length, 1);
  equal(h.timers[0].refreshCount, 1);
  h.nativeRegistration.handlers.onReleased();
  equal(h.calls.filter(([name]) => name === "send").length, 2);
  h.manager.dispose();
  equal(h.webContents.backgroundThrottling, true);
  equal(h.calls.some(([name]) => name === "native-unregister"), true);
}

{
  const h = createHarness({ focusedRecently: false });
  h.nativeRegistration.handlers.onPressed();
  h.nativeRegistration.handlers.onReleased();
  equal(h.calls.at(-1), ["send", 7, { type: "new-chat-with-appshot" }]);
  equal(h.calls.filter(([name]) => name === "quick-chat").length, 1);
}

{
  const h = createHarness({ platform: "darwin" });
  equal(h.manager.getState().configuredHotkey, "DoubleCommand");
  equal(h.calls[0][0], "validate-bare");
  equal(h.calls[1][0], "global-register");
  h.globalRegistration.handlers.onPressed();
  equal(h.calls.at(-1), ["send", 7, { type: "appshot-shortcut" }]);
}

{
  const h = createHarness({ platform: "darwin", quickChatResult: true, focusedRecently: false });
  h.globalRegistration.handlers.onPressed();
  equal(h.calls.filter(([name]) => name === "send").length, 0);
  equal(h.calls.at(-1), ["quick-chat", null]);
}

{
  const h = createHarness({ platform: "darwin", storedHotkey: null });
  equal(h.manager.getState(), { configuredHotkey: null, isActive: false, supported: true });
  equal(h.calls.some(([name]) => name.endsWith?.("register")), false);
  equal(h.manager.setHotkey("CommandOrControl+Shift+P").success, true);
  equal(h.stored.get("appshotHotkey"), "CommandOrControl+Shift+P");
}

{
  const h = createHarness({ platform: "darwin", validationError: "invalid" });
  const result = h.manager.setHotkey("bad");
  equal(result.success, false);
  equal(result.error, "invalid");
  equal(h.manager.getState().configuredHotkey, "DoubleCommand");
  equal(h.calls.some(([name]) => name === "persist"), false);
}

{
  const h = createHarness({ platform: "darwin" });
  h.setGlobalRegistration(new Error("registration failed"));
  const result = h.manager.setHotkey("CommandOrControl+K");
  equal(result.success, false);
  equal(result.error, "registration failed");
  equal(h.manager.getState().configuredHotkey, "DoubleCommand");
  equal(h.calls.some(([name]) => name === "persist"), false);
  ok(h.logs.some(([, message]) => message === "Failed to restore appshot hotkey after update failure"));
}

{
  const h = createHarness();
  h.nativeRegistration.handlers.onRegistrationFailed();
  equal(h.manager.getState().supported, false);
  equal(h.manager.getState().isActive, false);
  equal(h.calls.at(-1), ["support-changed"]);
  h.setNativeRegistration(true);
  await h.manager.setEnabled(false);
  equal(h.calls.some(([name]) => name === "bridge-release"), true);
  await h.manager.setEnabled(true);
  equal(h.manager.getState().supported, true);
}

{
  const h = createHarness({ enabled: false });
  equal(h.manager.getState().supported, false);
  equal(h.manager.getState().isActive, false);
  const result = h.manager.setHotkey("DoubleAlt");
  equal(result, { success: false, error: "Not supported.", state: h.manager.getState() });
}

{
  const h = createHarness({ destination: "last-chat", focusedRecently: false });
  h.nativeRegistration.handlers.onPressed();
  equal(h.calls.at(-1), ["send", 7, { type: "appshot-shortcut" }]);
  h.manager.dispose();
  h.manager.dispose();
  equal(h.calls.filter(([name]) => name === "native-unregister").length, 1);
}

{
  const h = createHarness({ destination: "new-chat", shortcutState: { canAcceptAppshotShortcut: true, isNewChatRoute: false } });
  h.nativeRegistration.handlers.onPressed();
  h.nativeRegistration.handlers.onReleased();
  equal(h.calls.at(-1), ["send", 7, { type: "new-chat-with-appshot" }]);
}

const main = await fs.readFile(
  path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"),
  "utf8",
);
assertions += 4;
assert.match(main, /require\("\.\/main-app\/hotkey\/appshot-hotkey-manager\.js"\)/);
assert.match(main, /new AppshotHotkeyManager\(\{/);
assert.doesNotMatch(main, /Pit = class/);
assert.doesNotMatch(main, /function S7\(/);

console.log(`${assertions} main appshot hotkey manager assertions passed`);
