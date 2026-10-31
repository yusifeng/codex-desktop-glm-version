import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context-lifecycle.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { createWindowContextLifecycle } = loaded.exports;

const calls = [];
const timers = [];
const allWindows = [
  { id: "service", isDestroyed: () => false },
  { id: "destroyed", isDestroyed: () => true },
  { id: "ordinary", isDestroyed: () => false },
];
let primaryWindow = null;
const createdWindows = [];
const windowManager = {
  createPrimaryWindow: async (options) => {
    calls.push(["create", options]);
    const listeners = new Map();
    const window = {
      destroyed: false,
      visible: options.show,
      focused: false,
      isDestroyed() { return this.destroyed; },
      isVisible() { return this.visible; },
      show() { this.visible = true; calls.push("show-created"); },
      showInactive() { this.visible = true; calls.push("show-inactive-created"); },
      focus() { this.focused = true; calls.push("focus-created"); },
      once(event, listener) { listeners.set(event, listener); },
      emit(event) { listeners.get(event)?.(); },
    };
    createdWindows.push(window);
    return window;
  },
  getPrimaryWindow: () => primaryWindow,
  isAppServiceWindow: (window) => window.id === "service" || window.id === "destroyed",
  hasRegisteredWebContents: (contents) => contents === "registered",
  showLastActivePrimaryWindow: () => "last-active",
};
let phaseReady = false;
let idleSeconds = 9;
let startInBackground = false;
const runtime = createWindowContextLifecycle({
  app: { getName: () => "Codex" },
  BrowserWindow: { getAllWindows: () => allWindows },
  clearTimeout: (timer) => calls.push(["clear", timer.id]),
  delayedRevealMs: 25,
  getWindowManager: () => windowManager,
  isWindows: true,
  powerMonitor: { getSystemIdleTime: () => idleSeconds },
  setTimeout: (callback, delay) => {
    const timer = { id: timers.length + 1, callback, delay, unref: () => calls.push(["unref", timers.length + 1]) };
    timers.push(timer);
    return timer;
  },
  shouldStartInBackground: () => startInBackground,
  startupPhases: { hasReached: (phase) => phase === "background_ready" && phaseReady },
  backgroundIdleSeconds: 10,
});

equal(runtime.isDefaultBrowser(), false);
equal(await runtime.getLocalAuthToken("contents"), null);
equal(runtime.isBackgroundReady(), false);
equal(await runtime.ensureWindow(), null);
equal(await runtime.createFreshWindow(), null);
equal(runtime.getContextForWebContents("registered"), null);

const registered = [];
const invalidations = [];
let pendingRequests = 0;
const context = {
  appServerConnectionRegistry: {
    getAllHostIds: () => ["local", "remote"],
    getConnection: () => ({ getPendingRequestCount: () => pendingRequests }),
  },
  broadcastQueryCacheInvalidation: (keys) => invalidations.push(keys),
  getLocalAuthToken: async (contents) => `token:${contents}`,
  getMessageHandler: () => ({ isDefaultBrowser: () => true }),
  registerWindow: (window) => registered.push(window.id),
};
runtime.setWindowContext(context);
equal(registered, ["service"]);
equal(runtime.isDefaultBrowser(), true);
equal(await runtime.getLocalAuthToken("contents"), "token:contents");
runtime.registerWindow({ id: "later" });
equal(registered, ["service", "later"]);
runtime.broadcastQueryCacheInvalidation(["appshot-hotkey-state"]);
equal(invalidations, [["appshot-hotkey-state"]]);
equal(runtime.getContextForWebContents("registered"), context);
equal(runtime.getContextForWebContents("other"), null);

phaseReady = true;
equal(runtime.isBackgroundReady(), false);
idleSeconds = 10;
equal(runtime.isBackgroundReady(), true);
pendingRequests = 1;
equal(runtime.isBackgroundReady(), false);
pendingRequests = 0;

primaryWindow = {
  minimized: true,
  destroyed: false,
  isMinimized() { return this.minimized; },
  restore() { calls.push("restore"); this.minimized = false; },
  show() { calls.push("show-existing"); },
  focus() { calls.push("focus-existing"); },
  isDestroyed() { return this.destroyed; },
};
equal(await runtime.ensureWindow(), primaryWindow);
equal(calls.slice(-3), ["restore", "show-existing", "focus-existing"]);
primaryWindow.destroyed = true;
equal(await runtime.ensureWindow(), null);

primaryWindow = null;
const hiddenWindow = await runtime.ensureWindow();
equal(calls.find((call) => Array.isArray(call) && call[0] === "create")[1], {
  title: "Codex",
  show: false,
  initialRoute: undefined,
});
equal([timers.length, timers[0].delay], [1, 25]);
timers[0].callback();
equal(calls.slice(-2), ["show-created", "focus-created"]);
hiddenWindow.emit("show");
hiddenWindow.emit("closed");
equal(calls.filter((call) => Array.isArray(call) && call[0] === "clear"), [["clear", 1], ["clear", 1]]);

startInBackground = true;
const secondHiddenWindow = await runtime.ensureWindow();
timers[1].callback();
equal(calls.at(-1), "show-inactive-created");
secondHiddenWindow.visible = true;
const callCount = calls.length;
timers[1].callback();
equal(calls.length, callCount);

const freshWindow = await runtime.createFreshWindow("/thread/1");
equal(createdWindows.includes(freshWindow), true);
equal(calls.filter((call) => Array.isArray(call) && call[0] === "create").at(-1)[1], {
  title: "Codex",
  show: true,
  initialRoute: "/thread/1",
});
equal(timers.length, 2);
equal(runtime.showLastActivePrimaryWindow(), "last-active");

console.log(`${assertions} window-context lifecycle assertions passed`);
