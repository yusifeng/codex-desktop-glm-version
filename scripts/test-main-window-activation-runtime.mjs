import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/startup/window-activation-runtime.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { createWindowActivationRuntime } = loaded.exports;

const calls = [];
const immediateCallbacks = [];
let primaryWindow = null;
let createdWindow = null;
let createError = null;
const makeWindow = (overrides = {}) => ({
  webContents: overrides.webContents ?? "contents",
  minimized: overrides.minimized ?? false,
  visible: overrides.visible ?? false,
  destroyed: overrides.destroyed ?? false,
  isMinimized() { return this.minimized; },
  isVisible() { return this.visible; },
  isDestroyed() { return this.destroyed; },
  restore() { calls.push("restore"); this.minimized = false; },
  show() { calls.push("show"); this.visible = true; },
  showInactive() { calls.push("show-inactive"); this.visible = true; },
  focus() { calls.push("focus"); },
  setOpacity(value) { calls.push(["opacity", value]); },
});
let applyOpacityWorkaround = false;
const runtime = createWindowActivationRuntime({
  createFreshWindow: async (route) => {
    calls.push(["create", route]);
    if (createError != null) throw createError;
    return createdWindow;
  },
  dismissNotificationByNavigationPath: (path) => calls.push(["dismiss", path]),
  ensureWindow: async () => (calls.push("ensure"), primaryWindow),
  getPrimaryWindow: () => primaryWindow,
  hideHotkeyWindow: () => calls.push("hide-hotkey"),
  isWindows: true,
  navigateToRoute: (window, path) => calls.push(["navigate", window.webContents, path]),
  onAppEntrySource: (source, contents) => calls.push(["app-entry", source, contents]),
  reportNonFatal: (error, context) => calls.push(["error", error, context]),
  setImmediate: (callback) => immediateCallbacks.push(callback),
  shouldApplyWindowsOpacityWorkaround: ({ isWindows, isVisible, isMinimized }) =>
    applyOpacityWorkaround && isWindows && !isVisible && !isMinimized,
  showPrimaryWindow: (window) => calls.push(["show-primary", window.webContents]),
});

equal(runtime.isReady(), false);
equal(await runtime.ensureWindow(), null);
equal(await runtime.createFreshWindow("/before-ready"), null);
runtime.showPrimaryWindow(makeWindow());
await runtime.openSecondInstance({ source: "ignored" });
equal(await runtime.navigate("/before-ready", { navigateExistingWindow: true }), null);
equal(calls, []);

const inactiveWindow = makeWindow();
runtime.presentWindow(inactiveWindow, false);
equal(calls, ["show-inactive"]);
calls.length = 0;
const minimizedWindow = makeWindow({ minimized: true });
runtime.presentWindow(minimizedWindow);
equal(calls, ["restore", "show", "focus"]);

calls.length = 0;
applyOpacityWorkaround = true;
const opacityWindow = makeWindow();
runtime.presentWindow(opacityWindow);
equal(calls, [["opacity", 0], "show", "focus"]);
equal(immediateCallbacks.length, 1);
immediateCallbacks.shift()();
equal(calls.at(-1), ["opacity", 1]);
const destroyedWindow = makeWindow();
runtime.presentWindow(destroyedWindow);
destroyedWindow.destroyed = true;
const opacityCallCount = calls.length;
immediateCallbacks.shift()();
equal(calls.length, opacityCallCount);
applyOpacityWorkaround = false;

runtime.markReady();
equal(runtime.isReady(), true);
primaryWindow = makeWindow({ webContents: "primary", minimized: true });
equal(await runtime.ensureWindow(), primaryWindow);
equal(calls.at(-1), "ensure");
runtime.showPrimaryWindow(primaryWindow);
equal(calls.at(-1), ["show-primary", "primary"]);

calls.length = 0;
await runtime.openSecondInstance({ channel: "shortcut", source: "shortcut" });
equal(calls, [
  "hide-hotkey",
  "restore",
  "show",
  "focus",
  ["app-entry", { channel: "shortcut", source: "shortcut" }, "primary"],
]);

calls.length = 0;
await runtime.navigateWithAttribution("/thread/1", { navigateExistingWindow: true });
equal(calls, [
  "hide-hotkey",
  ["dismiss", "/thread/1"],
  ["navigate", "primary", "/thread/1"],
  "show",
  "focus",
  ["app-entry", { channel: "shortcut", source: "shortcut" }, "primary"],
]);

calls.length = 0;
primaryWindow = null;
createdWindow = makeWindow({ webContents: "created" });
equal(await runtime.navigate("/new", { navigateExistingWindow: true }), createdWindow);
equal(calls, [
  "hide-hotkey",
  ["create", "/new"],
  ["dismiss", "/new"],
  "show",
  "focus",
]);

calls.length = 0;
createdWindow = null;
equal(await runtime.navigate("/missing", { navigateExistingWindow: true }), null);
equal(calls, ["hide-hotkey", ["create", "/missing"]]);

calls.length = 0;
createdWindow = makeWindow({ webContents: "second-instance" });
await runtime.openSecondInstance();
equal(calls, ["hide-hotkey", ["create", "/"], "show", "focus"]);

calls.length = 0;
createError = "create failed";
await runtime.openSecondInstance();
equal(calls[0], "hide-hotkey");
equal(calls[1], ["create", "/"]);
equal(calls[2], [
  "error",
  "Failed to open window on second instance",
  { kind: "second-instance-open-window-failed" },
]);

console.log(`${assertions} window-activation runtime assertions passed`);
