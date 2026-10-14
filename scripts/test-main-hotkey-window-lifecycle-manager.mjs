import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(root, "src/main/main-app/hotkey/hotkey-window-lifecycle-manager.ts");
const bundle = await esbuild.build({
  bundle: true,
  entryPoints: [modulePath],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createHotkeyWindowLifecycleManagerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => { assert.equal(actual, expected); assertions += 1; };
const deepEqual = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };

const registrations = [];
const locks = [];
const timers = [];
const keymapUpdates = [];
const logEntries = [];
const attributions = [];
let commandBinding = { hasBinding: true, hotkey: "Cmd+K" };
let allowLock = true;
let rejectRegistration = null;

class FakeHotkeyWindowController {
  constructor(windowManager, globalState, shouldRetainWindows) {
    this.windowManager = windowManager;
    this.globalState = globalState;
    this.shouldRetainWindows = shouldRetainWindows;
    this.calls = [];
  }
  async toggleHotkey() {
    this.calls.push(["toggle"]);
    return { isDestroyed: () => false, webContents: { id: 41 } };
  }
  async openDetailRoute(path, state) { this.calls.push(["detail", path, state]); }
  async openHome() { this.calls.push(["home"]); }
  async collapseToHome() { this.calls.push(["collapse"]); }
  hideAll() { this.calls.push(["hide"]); }
  handleTransitionDone(origin, input) { this.calls.push(["transition", origin, input]); }
  setHomePointerInteraction(origin, input) { this.calls.push(["pointer", origin, input]); }
  setHomeLayout(origin, input) { this.calls.push(["layout", origin, input]); }
  startHomeDrag(origin, input) { this.calls.push(["drag-start", origin, input]); }
  moveHomeDrag(origin) { this.calls.push(["drag-move", origin]); }
  endHomeDrag(origin) { this.calls.push(["drag-end", origin]); }
  async prewarm() { this.calls.push(["prewarm"]); }
  dispose() { this.calls.push(["dispose"]); }
}

const dependencies = {
  HotkeyWindowController: FakeHotkeyWindowController,
  acquireCrossInstanceLock(options) {
    if (!allowLock) return null;
    const lock = { disposed: false, isOwner: () => true, options, dispose() { this.disposed = true; } };
    locks.push(lock);
    return lock;
  },
  clearTimeout(timer) { timer.cleared = true; },
  createDetailRouteState: () => ({ focusComposerNonce: 123 }),
  crossInstanceLocks: { hotkeyWindow: "hotkey-window" },
  ensureHotkeyPermissions: (hotkey) => logEntries.push(["permission", hotkey]),
  getCommandBinding: () => commandBinding,
  logger: {
    n: () => ({
      info: (message, context) => logEntries.push(["info", message, context]),
      warning: (message, context) => logEntries.push(["warning", message, context]),
    }),
  },
  registerGlobalHotkey(hotkey, handlers, options) {
    if (hotkey === rejectRegistration) return null;
    const registration = {
      handlers,
      hotkey,
      options,
      unregistered: false,
      unregister() { this.unregistered = true; },
    };
    registrations.push(registration);
    return registration;
  },
  resolveConfiguredHotkey: ({ keymapHotkey, legacyHotkey }) =>
    keymapHotkey.hasBinding ? keymapHotkey.hotkey : legacyHotkey,
  setTimeout(callback, delayMs) {
    const timer = { callback, cleared: false, delayMs, unrefCalled: false, unref() { this.unrefCalled = true; return this; } };
    timers.push(timer);
    return timer;
  },
  shared: {
    _o: (route) => route.split("/").at(-1),
    go: () => "/new",
    Tt: async (update) => { keymapUpdates.push(update); },
    yo: (route) => route.startsWith("/"),
  },
  validateHotkey: (hotkey) => hotkey === "invalid" ? "Invalid hotkey." : null,
};

const HotkeyWindowLifecycleManager = createHotkeyWindowLifecycleManagerClass(dependencies);
const stateWrites = [];
const globalState = {
  get: () => "Legacy+K",
  set: (key, value) => stateWrites.push([key, value]),
};
const windowManager = { getRendererWindowLogFields: () => ({ rendererWindowId: 7 }) };
const manager = new HotkeyWindowLifecycleManager(
  windowManager,
  globalState,
  false,
  () => true,
  (source, webContents) => attributions.push([source, webContents.id]),
);

equal(manager.getState().configuredHotkey, "Cmd+K");
deepEqual(stateWrites, [["hotkeyWindowHotkey", "Cmd+K"]]);
manager.setGateEnabled(true);
equal(manager.getState().isActive, true);
equal(locks.length, 1);
equal(locks[0].options.name, "hotkey-window");
equal(registrations.length, 1);
equal(registrations[0].hotkey, "Cmd+K");
equal(registrations[0].options.ownership, locks[0]);
const firstController = manager.getHotkeyWindowController();
deepEqual(firstController.calls, [["prewarm"]]);

await manager.openFromRenderer({ id: 7 }, { path: "/thread/abc" });
manager.handleTransitionDone({ id: 7 }, { transitionId: 1 });
manager.handleHomePointerInteractionChanged({ id: 7 }, { active: true });
manager.handleHomeLayoutChanged({ id: 7 }, { width: 300 });
manager.handleHomeDragStart({ id: 7 }, { x: 1 });
manager.handleHomeDragMove({ id: 7 });
manager.handleHomeDragEnd({ id: 7 });
await manager.collapseToHome();
manager.dismiss();
deepEqual(firstController.calls.slice(1), [
  ["detail", "/thread/abc", undefined],
  ["transition", { id: 7 }, { transitionId: 1 }],
  ["pointer", { id: 7 }, { active: true }],
  ["layout", { id: 7 }, { width: 300 }],
  ["drag-start", { id: 7 }, { x: 1 }],
  ["drag-move", { id: 7 }],
  ["drag-end", { id: 7 }],
  ["collapse"],
  ["hide"],
]);
equal(logEntries.some((entry) => entry[1] === "hotkey_window_open_requested"), true);

registrations[0].handlers.onPressed();
await Promise.resolve();
deepEqual(attributions, [[{ channel: "shortcut", source: "shortcut" }, 41]]);

let result = await manager.setHotkey("invalid");
equal(result.success, false);
equal(result.error, "Invalid hotkey.");
equal(manager.getState().configuredHotkey, "Cmd+K");
rejectRegistration = "Cmd+Fail";
result = await manager.setHotkey("Cmd+Fail");
equal(result.success, false);
equal(manager.getState().configuredHotkey, "Cmd+K");
equal(registrations[0].unregistered, false);
rejectRegistration = null;
result = await manager.setHotkey("Cmd+L");
equal(result.success, true);
equal(manager.getState().configuredHotkey, "Cmd+L");
equal(registrations[0].unregistered, true);
deepEqual(keymapUpdates.at(-1), { commandId: "hotkeyWindow", update: { type: "set", accelerator: "Cmd+L" } });
deepEqual(stateWrites.at(-1), ["hotkeyWindowHotkey", "Cmd+L"]);

locks[0].options.onLost();
equal(manager.getState().isActive, false);
equal(firstController.calls.at(-1)[0], "dispose");
equal(timers.length, 1);
equal(timers[0].delayMs, 1_000);
equal(timers[0].unrefCalled, true);
timers[0].callback();
equal(manager.getState().isActive, true);
equal(locks.length, 2);
equal(manager.getHotkeyWindowController().calls[0][0], "prewarm");

manager.dispose();
equal(manager.getState().isActive, false);
equal(locks[1].disposed, true);
equal(manager.getHotkeyWindowController(), null);
manager.dispose();
equal(manager.getState().isActive, false);

commandBinding = { hasBinding: false, hotkey: null };
const noHotkeyState = { get: () => null, set() {} };
const unconfigured = new HotkeyWindowLifecycleManager(windowManager, noHotkeyState, false, () => true);
unconfigured.setGateEnabled(true);
equal(unconfigured.getState().isActive, false);
await unconfigured.open({ path: "/hotkey-window" });
deepEqual(unconfigured.getHotkeyWindowController().calls, [["detail", "/new", { focusComposerNonce: 123 }]]);
unconfigured.dispose();

commandBinding = { hasBinding: true, hotkey: "Cmd+D" };
const devManager = new HotkeyWindowLifecycleManager(windowManager, globalState, true, () => true);
devManager.setGateEnabled(true);
equal(devManager.getState().isActive, false);
equal(devManager.setDevOverrideEnabled(true).success, true);
equal(devManager.getState().isActive, true);
equal(devManager.setDevOverrideEnabled(false).success, true);
equal(devManager.getState().isActive, false);
devManager.dispose();

allowLock = false;
const retryManager = new HotkeyWindowLifecycleManager(windowManager, globalState, false, () => true);
retryManager.setGateEnabled(true);
equal(retryManager.getState().isActive, false);
const retryTimer = timers.at(-1);
equal(retryTimer.delayMs, 1_000);
retryManager.dispose();
equal(retryTimer.cleared, true);

const source = fs.readFileSync(modulePath, "utf8");
const methodNames = [...source.matchAll(/^    (?:async )?([A-Za-z_$][\w$]*)\(/gm)].map((match) => match[1]);
equal(methodNames.length, 38);
equal(new Set(methodNames).size, 38);
for (const method of ["applyLifecycleOrThrow", "scheduleLifecycleRetry", "setHotkeyWindowHotkey", "handleHomeDragMove", "dispose"]) {
  equal(methodNames.includes(method), true);
}
const fieldNames = [...source.matchAll(/^    ([A-Za-z_$][\w$]*)(?: = [^;]+)?;$/gm)].map((match) => match[1]);
equal(fieldNames.length, 15);

const mainSource = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
equal(mainSource.includes('require("./main-app/hotkey/hotkey-window-lifecycle-manager.js")'), true);
equal(mainSource.includes("Eat = createHotkeyWindowLifecycleManagerClass({"), true);
equal(mainSource.includes("Eat = class"), false);
equal((mainSource.match(/new Eat\(/g) ?? []).length, 1);

console.log(`${assertions} hotkey window lifecycle assertions passed`);
