import assert from "node:assert/strict";
import fs from "node:fs";
import { createGlobalDictationWindowControllerClass } from "../src/main/main-app/dictation/global-dictation-window-controller.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

class LazyWindow {
  constructor(factory) { this.factory = factory; this.value = null; this.pending = null; this.waiters = []; }
  clear() { this.value = null; this.pending = null; this.cleared = (this.cleared ?? 0) + 1; }
  async get() {
    this.pending ??= Promise.resolve(this.factory()).then((value) => {
      this.value = value;
      for (const waiter of this.waiters.splice(0)) waiter(value);
      return value;
    });
    return this.pending;
  }
  peek() { return this.value; }
  prewarm() { void this.get(); }
  runWhenAvailable(callback) { this.value == null ? this.waiters.push(callback) : callback(this.value); }
}

function createWindow(id = 41) {
  const calls = [];
  const events = new Map();
  return {
    calls,
    destroyed: false,
    events,
    visible: false,
    webContents: { id },
    hide() { calls.push("hide"); this.visible = false; },
    isDestroyed() { return this.destroyed; },
    isVisible() { return this.visible; },
    once(event, handler) { events.set(event, handler); },
    setAlwaysOnTop(value, level) { calls.push(["always", value, level]); },
    setBounds(bounds, animate) { calls.push(["bounds", bounds, animate]); },
    setIgnoreMouseEvents(value, options) { calls.push(["pointer", value, options]); },
    showInactive() { calls.push("showInactive"); this.visible = true; },
  };
}

function createHarness({ createError } = {}) {
  const messages = [];
  const logs = [];
  const screenHandlers = new Map();
  const window = createWindow();
  const screen = {
    getCursorScreenPoint: () => ({ x: 1, y: 2 }),
    getDisplayNearestPoint: () => ({ workArea: { x: 100, y: 50, width: 820, height: 600 } }),
    on(event, handler) { screenHandlers.set(event, handler); },
    off(event, handler) { if (screenHandlers.get(event) === handler) screenHandlers.delete(event); },
  };
  let focusedWindow = null;
  const BrowserWindow = { getFocusedWindow: () => focusedWindow };
  const windowManager = {
    async createWindow(options) {
      if (createError) throw createError;
      this.options = options;
      return window;
    },
    sendMessageToWebContents(webContents, message) { messages.push({ webContents, message }); },
  };
  const Controller = createGlobalDictationWindowControllerClass({
    LazyWindow,
    BrowserWindow,
    screen,
    logger: { n: () => ({ warning: (message, details) => logs.push({ message, details }) }) },
    initialRoute: "/dictation",
  });
  const controller = new Controller(windowManager);
  return {
    controller,
    get focusedWindow() { return focusedWindow; },
    set focusedWindow(value) { focusedWindow = value; },
    logs,
    messages,
    screenHandlers,
    window,
    windowManager,
  };
}

{
  const harness = createHarness();
  const showing = harness.controller.showAndStart("session-1", "press-and-hold", () => true, 123);
  await new Promise(setImmediate);
  equal(harness.windowManager.options, {
    title: "Dictation",
    width: 720,
    height: 84,
    appearance: "globalDictation",
    show: false,
    initialRoute: "/dictation",
    focusable: false,
  });
  equal(harness.window.calls[0], ["always", true, "floating"]);
  equal(harness.window.calls[1], ["bounds", { width: 720, height: 84, x: 150, y: 550 }, false]);
  equal(harness.window.calls[2], ["pointer", true, { forward: false }]);
  equal([...harness.screenHandlers.keys()], ["display-added", "display-removed", "display-metrics-changed"]);
  harness.controller.setRendererReady(41);
  equal(await showing, true);
  equal(harness.messages[0], {
    webContents: harness.window.webContents,
    message: {
      type: "global-dictation-start",
      sessionId: "session-1",
      startGesture: "press-and-hold",
      activationStartedAtMs: 123,
    },
  });
  equal(harness.window.calls.at(-2), "showInactive");
  equal(harness.window.calls.at(-1), ["pointer", true, { forward: true }]);

  harness.controller.sendStop("session-1", true);
  equal(harness.messages.at(-1).message, {
    type: "global-dictation-stop",
    sessionId: "session-1",
    cancel: true,
  });
  const callCount = harness.window.calls.length;
  harness.controller.setPointerInteractive(999, true);
  equal(harness.window.calls.length, callCount);
  harness.controller.setPointerInteractive(41, true);
  equal(harness.window.calls.at(-1), ["pointer", false, undefined]);

  harness.controller.showRecovery();
  equal(harness.window.calls.at(-2), ["bounds", { width: 720, height: 180, x: 150, y: 454 }, false]);
  equal(harness.window.calls.at(-1), ["pointer", false, undefined]);
  harness.controller.hide();
  equal(harness.window.calls.at(-2), ["pointer", true, { forward: false }]);
  equal(harness.window.calls.at(-1), "hide");

  harness.focusedWindow = harness.window;
  equal(harness.controller.getFocusedInAppWindow(), null);
  const appWindow = { isDestroyed: () => false };
  harness.focusedWindow = appWindow;
  equal(harness.controller.getFocusedInAppWindow(), appWindow);
  harness.focusedWindow = { isDestroyed: () => true };
  equal(harness.controller.getFocusedInAppWindow(), null);

  harness.window.visible = true;
  const boundsBefore = harness.window.calls.filter((call) => Array.isArray(call) && call[0] === "bounds").length;
  harness.screenHandlers.get("display-metrics-changed")();
  equal(
    harness.window.calls.filter((call) => Array.isArray(call) && call[0] === "bounds").length,
    boundsBefore + 1,
  );
  harness.window.events.get("closed")();
  equal(harness.screenHandlers.size, 0);
  harness.controller.close();
  equal(harness.controller.recorderWindow.cleared, 1);
  equal(harness.controller.rendererReadyWebContentsId, null);
}

{
  const harness = createHarness();
  const showing = harness.controller.showPasteFailure({ reason: "clipboard" }, () => true);
  await new Promise(setImmediate);
  harness.controller.setRendererReady(41);
  equal(await showing, true);
  equal(harness.messages.at(-1).message, {
    type: "global-dictation-paste-failed",
    failure: { reason: "clipboard" },
  });
  equal(harness.window.calls.at(-1), ["pointer", false, undefined]);
}

{
  const harness = createHarness();
  equal(await harness.controller.showAndStart("stale", "tap", () => false, 0), false);
  equal(harness.messages, []);
}

{
  const error = new Error("create failed");
  const harness = createHarness({ createError: error });
  equal(await harness.controller.showAndStart("failed", "tap", () => true, 0), false);
  equal(harness.logs.length, 1);
  equal(harness.logs[0].message, "Failed to create global dictation window");
  equal(harness.logs[0].details.sensitive.error, error);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("sat = createGlobalDictationWindowControllerClass({"), true);
equal(main.includes("new sat(e.windowManager)"), true);
equal(main.includes("sat = class"), false);
equal(main.includes("oat = 16"), false);
equal(main.includes("H7 = { width: 720"), false);

console.log(`${assertions} main global-dictation window controller assertions passed`);
