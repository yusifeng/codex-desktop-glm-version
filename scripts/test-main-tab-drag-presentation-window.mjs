import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [
    path.join(root, "src/main/main-app/window/tab-drag-presentation-window.ts"),
  ],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { TabDragPresentationWindow } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const ok = (value) => {
  assert.ok(value);
  assertions += 1;
};
const flush = async () => {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
};

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

function createHarness({ captureEmpty = false, isDarwin = true, loadDocument } = {}) {
  const calls = [];
  const timeouts = [];
  const intervals = [];
  const listeners = new Map();
  let cursor = { x: 100, y: 80 };
  const window = {
    destroyed: false,
    visible: false,
    webContents: {
      async capturePage() {
        calls.push(["capture"]);
        return { isEmpty: () => captureEmpty };
      },
      async executeJavaScriptInIsolatedWorld(worldId, scripts) {
        calls.push(["execute", worldId, scripts[0].code]);
      },
    },
    destroy() {
      calls.push(["destroy"]);
      this.destroyed = true;
    },
    emit(event) {
      listeners.get(event)?.();
    },
    isDestroyed() {
      return this.destroyed;
    },
    isVisible() {
      return this.visible;
    },
    async loadURL(url) {
      calls.push(["load-url", url]);
      if (loadDocument != null) return loadDocument.promise;
    },
    off(event, listener) {
      calls.push(["off", event]);
      if (listeners.get(event) === listener) listeners.delete(event);
    },
    on(event, listener) {
      calls.push(["on", event]);
      listeners.set(event, listener);
    },
    setIgnoreMouseEvents(value) {
      calls.push(["ignore-mouse", value]);
    },
    setOpacity(value) {
      calls.push(["opacity", value]);
    },
    setPosition(x, y) {
      calls.push(["position", x, y]);
    },
    setSize(width, height) {
      calls.push(["size", width, height]);
    },
    setVisibleOnAllWorkspaces(value) {
      calls.push(["all-workspaces", value]);
    },
    showInactive() {
      calls.push(["show-inactive"]);
      this.visible = true;
    },
  };
  let options;
  const presentation = new TabDragPresentationWindow({
    clearInterval(handle) {
      handle.cleared = true;
      calls.push(["clear-interval"]);
    },
    clearTimeout(handle) {
      if (handle != null) handle.cleared = true;
      calls.push(["clear-timeout"]);
    },
    createWindow(value) {
      options = value;
      return window;
    },
    getCursorScreenPoint() {
      calls.push(["cursor"]);
      return cursor;
    },
    isDarwin,
    operationTimeoutMs: 3_000,
    setInterval(callback, delay) {
      const handle = { callback, cleared: false, delay };
      intervals.push(handle);
      return handle;
    },
    setTimeout(callback, delay) {
      const handle = { callback, cleared: false, delay };
      timeouts.push(handle);
      return handle;
    },
  });
  return {
    calls,
    intervals,
    options: () => options,
    presentation,
    setCursor(value) {
      cursor = value;
    },
    timeouts,
    window,
  };
}

{
  const harness = createHarness();
  equal(harness.options(), {
    title: "",
    width: 1,
    height: 1,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: true,
    enableLargerThanScreen: true,
    focusable: false,
    show: false,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    hasShadow: true,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      javascript: false,
    },
  });
  equal(harness.calls[0], ["opacity", 0]);
  equal(harness.calls[1], ["all-workspaces", true]);
  equal(harness.calls[2], ["ignore-mouse", true]);
  ok(harness.calls[4][1].startsWith("data:text/html"));
  equal(await harness.presentation.ready(), true);

  const staleCue = harness.presentation.updateCue({ destination: "left" });
  const latestCue = harness.presentation.updateCue({ destination: "right" });
  equal(await staleCue, true);
  equal(await latestCue, true);
  equal(harness.calls.filter((call) => call[0] === "execute").length, 0);

  equal(
    await harness.presentation.load({
      borderRadius: 99,
      grabOffset: { x: 10, y: 5 },
      markup: '<div data-app-shell-tab-drag-cue-region><img src="data:image/png;base64,x"></div>',
      size: { width: 80, height: 100 },
      zoom: 1.5,
    }),
    true,
  );
  const executions = harness.calls.filter((call) => call[0] === "execute");
  equal(executions.length, 2);
  equal(executions[0][1], 1001);
  ok(executions[0][2].includes('borderRadius = "40px"'));
  ok(executions[0][2].includes('transform = "scale(1.5)"'));
  ok(executions[1][2].includes('destination = "right"'));
  equal(harness.calls.find((call) => call[0] === "size"), ["size", 80, 100]);
  ok(harness.calls.some((call) => call[0] === "show-inactive"));
  equal(harness.intervals.length, 1);
  equal(harness.intervals[0].delay, 16);
  equal(harness.calls.find((call) => call[0] === "position"), ["position", 90, 75]);

  equal(await harness.presentation.updateCue(null), true);
  ok(
    harness.calls
      .filter((call) => call[0] === "execute")
      .at(-1)[2]
      .includes("destination = null"),
  );
  harness.setCursor({ x: 160.4, y: 120.6 });
  harness.intervals[0].callback();
  equal(harness.calls.filter((call) => call[0] === "position").at(-1), [
    "position",
    150,
    116,
  ]);

  equal(harness.presentation.freeze({ x: 200.8, y: 301.2 }), true);
  equal(harness.intervals[0].cleared, true);
  equal(harness.calls.filter((call) => call[0] === "position").at(-1), [
    "position",
    191,
    296,
  ]);
  equal(harness.presentation.freeze({ x: 999, y: 999 }), true);
  equal(harness.calls.filter((call) => call[0] === "position").at(-1), [
    "position",
    191,
    296,
  ]);
  equal(await harness.presentation.show(), true);
  ok(harness.calls.some((call) => call[0] === "capture"));
  equal(harness.calls.filter((call) => call[0] === "opacity").at(-1), ["opacity", 1]);
  equal(await harness.presentation.load({}), false);
  harness.presentation[Symbol.dispose]();
  equal(harness.window.destroyed, true);
  equal(harness.presentation.freeze({ x: 0, y: 0 }), false);
  const destroyCount = harness.calls.filter((call) => call[0] === "destroy").length;
  harness.presentation[Symbol.dispose]();
  equal(harness.calls.filter((call) => call[0] === "destroy").length, destroyCount);
}

{
  const document = deferred();
  const harness = createHarness({ loadDocument: document, isDarwin: false });
  ok(!harness.calls.some((call) => call[0] === "all-workspaces"));
  document.reject(Error("load failed"));
  equal(await harness.presentation.ready(), false);
  equal(harness.window.destroyed, true);
}

{
  const harness = createHarness();
  const execute = deferred();
  harness.window.webContents.executeJavaScriptInIsolatedWorld = () => execute.promise;
  const loading = harness.presentation.load({
    borderRadius: 0,
    grabOffset: { x: 0, y: 0 },
    markup: "<div></div>",
    size: { width: 10, height: 10 },
    zoom: 1,
  });
  await flush();
  equal(harness.timeouts[0].delay, 3_000);
  harness.timeouts[0].callback();
  equal(await loading, false);
  equal(harness.window.destroyed, true);
  equal(harness.timeouts[0].cleared, true);
}

{
  const harness = createHarness({ captureEmpty: true });
  equal(
    await harness.presentation.load({
      borderRadius: 0,
      grabOffset: { x: 0, y: 0 },
      markup: "<div></div>",
      size: { width: 10, height: 10 },
      zoom: 1,
    }),
    true,
  );
  equal(await harness.presentation.show(), false);
  equal(harness.window.destroyed, true);
}

{
  const harness = createHarness();
  harness.window.emit("closed");
  equal(harness.window.destroyed, true);
  equal(await harness.presentation.ready(), false);
}

console.log(`${assertions} main tab-drag presentation window assertions passed`);
