import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const nativeExports = [
  "stopRemoteHostedPIPContentHost",
  "connectRemoteHostedPIPContentHost",
  "setRemoteHostedPIPContentSuppressedThreadIDs",
  "setRemoteHostedPIPContentVideoFrameHandler",
  "setRemoteHostedPIPContentNativeVideoEnabled",
  "setRemoteHostedPIPContentNativeVideoReady",
  "setRemoteHostedPIPContentMaxDisplaySize",
  "setRemoteHostedPIPContentMaxDisplaySizeChangedHandler",
  "setRemoteHostedPIPContentPetWakeRequestHandler",
  "unregisterRemoteHostedPIPContentHost",
  "completeRemoteHostedPIPContentThread",
  "invalidateRemoteHostedPIPContentTurn",
];
const bundle = await build({
  stdin: {
    contents: `
      export * from "./src/main/main-app/avatar-overlay/geometry.ts";
      export * from "./src/main/main-app/avatar-overlay/pip.ts";
    `,
    resolveDir: root,
    sourcefile: "avatar-overlay-runtime-test-entry.ts",
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  plugins: [{
    name: "avatar-overlay-runtime-doubles",
    setup(builder) {
      builder.onResolve({ filter: /^electron$/ }, () => ({ path: "electron", namespace: "test" }));
      builder.onResolve({ filter: /^@chunk\/bootstrap$/ }, () => ({ path: "bootstrap", namespace: "test" }));
      builder.onResolve({ filter: /windows\/native-app-icons$/ }, () => ({ path: "native", namespace: "test" }));
      builder.onLoad({ filter: /^electron$/, namespace: "test" }, () => ({
        loader: "js",
        contents: `
          export const screen = {
            getAllDisplays: () => [],
            getDisplayMatching: (bounds) => ({ id: 1, bounds, workArea: bounds }),
            getDisplayNearestPoint: () => ({ bounds: { x: 0, y: 0, width: 1000, height: 800 } }),
          };
          export const BrowserWindow = {
            getAllWindows: () => globalThis.__avatarWindows ?? [],
            getFocusedWindow: () => globalThis.__avatarFocusedWindow ?? null,
            fromWebContents: (webContents) => (globalThis.__avatarWindows ?? []).find((window) => window.webContents === webContents) ?? null,
          };
        `,
      }));
      builder.onLoad({ filter: /^bootstrap$/, namespace: "test" }, () => ({
        loader: "js",
        contents: `export const Q = "pip-task-state"; export const Z = "pip-size";`,
      }));
      builder.onLoad({ filter: /^native$/, namespace: "test" }, () => ({
        loader: "js",
        contents: `
          globalThis.__avatarNative = { calls: [], handlers: {} };
          const state = globalThis.__avatarNative;
          export const startRemoteHostedPIPContentHost = (options) => (state.calls.push(["start"]), true);
          export const setRemoteHostedPIPContentShouldShowTaskHandler = (handler) => (state.handlers.shouldShow = handler, true);
          export const setRemoteHostedPIPContentVisibilityRequestHandler = (handler) => (state.handlers.visibility = handler, true);
          export const setRemoteHostedPIPContentActiveThreadID = (threadId) => (state.calls.push(["active", threadId]), true);
          export const setRemoteHostedPIPContentPlacement = (locator, placement) => (state.calls.push(["placement", locator, placement]), true);
          export const interactWithRemoteHostedPIPContentPresentation = (locator, presentationId, interaction) => (state.calls.push(["interact", locator, presentationId, interaction]), true);
          export const refreshRemoteHostedPIPContentVisibility = (presentationIds) => (state.calls.push(["refresh", presentationIds]), true);
          export const registerRemoteHostedPIPContentHost = (hostId) => (state.calls.push(["register", hostId]), true);
          export const hasRemoteHostedPIPContentAnyPresentation = () => false;
          export const getRemoteHostedPIPContentActiveTaskIDs = () => [];
          ${nativeExports.map((name) => `export const ${name} = () => true;`).join("\n")}
        `,
      }));
    },
  }],
});
const runtime = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const attraction = runtime.computeDockAttraction({
  current: { x: 0, y: 0 },
  next: { x: 10, y: 0 },
  target: { x: 50, y: 0 },
});
equal(attraction.shouldDock, true);
equal(attraction.acceleration.x > 0, true);
equal(runtime.computeDockAttraction({
  current: { x: 0, y: 0 },
  next: { x: -10, y: 0 },
  target: { x: 50, y: 0 },
}).acceleration, { x: 0, y: 0 });
equal(runtime.mascotSizeForWidth(10), { width: 80, height: 87 });
equal(runtime.clampMascotWidth(999), 224);
equal(runtime.boundsEqual(
  { x: 1, y: 2, width: 3, height: 4 },
  { x: 1, y: 2, width: 3, height: 4 },
), true);

const tracker = new runtime.CursorTracker("native", 2, 3, { x: 0, y: 0, width: 100, height: 100 });
equal(tracker.shouldSuppressRendererThrow(), true);
tracker.recordMove({ x: 100, y: 0, width: 100, height: 100 });
equal(tracker.crossedDisplay, true);
equal(tracker.shouldSuppressRendererThrow(), true);

const persisted = [];
const stateStore = {
  get: () => undefined,
  getStored: () => ({ existing: "hidden" }),
  set: (key, value) => persisted.push([key, { ...value }]),
};
const visibility = new runtime.PipTaskVisibilityStore(stateStore, () => false);
equal(visibility.getVisibility("existing"), "hidden");
equal(visibility.captureDefaults(["new", "new"], "shown").changedConversationIds, ["new"]);
equal(visibility.revision, 1);
equal(persisted, [["pip-task-state", { existing: "hidden", new: "shown" }]]);
equal(visibility.setTaskVisibility("new", "shown").changedConversationIds, []);
equal(visibility.deleteTask("missing").changedConversationIds, []);
equal(visibility.deleteTask("new").changedConversationIds, ["new"]);
equal(visibility.revision, 2);

const manager = runtime.createRemoteHostedPipManager({
  getAlwaysHidePictureInPicture: () => false,
  isEnabled: () => true,
  isMacOS: false,
  nativeIntl: { formatMessage: ({ defaultMessage }) => defaultMessage },
  preferenceStore: stateStore,
  setAlwaysHidePictureInPicture() {},
  stateStore,
  videoFrameChannel: "pip-video",
});
equal(manager.getTaskState().activeTaskIds, []);
manager.setTaskActivity("computer-use", "thread-1", true);
equal(manager.getTaskState().activeTaskIds, ["thread-1"]);
equal(manager.hideTask("thread-1").taskVisibilities["thread-1"], "hidden");
equal(manager.showTask("thread-1").taskVisibilities["thread-1"], "shown");
manager.completeTurn({ threadId: "thread-1", turnId: "turn-1" }, "failed");
equal(manager.getTaskState().activeTaskIds, []);
manager.setTaskActivity("computer-use", "thread-1", true);
manager.completeTurn({ threadId: "thread-1", turnId: "turn-2" }, "completed");
equal(manager.getTaskState().activeTaskIds, []);
manager.dispose();
equal(manager.showTask("thread-2").taskVisibilities["thread-2"], undefined);

const macPersisted = new Map();
const macStore = {
  get: (key) => macPersisted.get(key),
  getStored: (key) => macPersisted.get(key),
  set: (key, value) => macPersisted.set(key, value),
};
const macManager = runtime.createRemoteHostedPipManager({
  getAlwaysHidePictureInPicture: () => false,
  isEnabled: () => true,
  isMacOS: true,
  nativeIntl: { formatMessage: ({ defaultMessage }) => defaultMessage },
  preferenceStore: macStore,
  setAlwaysHidePictureInPicture() {},
  stateStore: macStore,
  videoFrameChannel: "pip-video",
});
macManager.setTaskActivity("computer-use", "thread-1", true);
equal(typeof globalThis.__avatarNative.handlers.shouldShow, "function");
equal(typeof globalThis.__avatarNative.handlers.visibility, "function");
equal(globalThis.__avatarNative.handlers.shouldShow("thread-1"), true);
globalThis.__avatarNative.handlers.visibility("hide-for-task", ["thread-1"]);
equal(macManager.getTaskState().taskVisibilities["thread-1"], "hidden");
equal(globalThis.__avatarNative.calls.some((call) =>
  JSON.stringify(call) === JSON.stringify(["refresh", ["thread-1"]])
), true);

const listeners = new Map();
const webContents = {
  getURL: () => "https://codex.local/local/thread-1",
  isDestroyed: () => false,
  on: (name, listener) => listeners.set(name, listener),
  off: (name) => listeners.delete(name),
  send() {},
};
const window = {
  id: 41,
  webContents,
  isFocused: () => true,
  on: (name, listener) => listeners.set(`window:${name}`, listener),
};
globalThis.__avatarWindows = [window];
globalThis.__avatarFocusedWindow = window;
macManager.registerWindow(window);
macManager.setHostLayoutForWebContents(webContents, {
  hostId: "thread-1",
  anchors: [],
  anchorRect: { x: 0, y: 0, width: 20, height: 20 },
});
macManager.syncActiveThreadForFocusedWindow();
equal(globalThis.__avatarNative.calls.filter(([name, id]) => name === "active" && id === "thread-1").length, 1);
macManager.setPlacement("thread-1", "pet");
macManager.interactWithPresentation("thread-1", "presentation-7", { type: "click" });
equal(globalThis.__avatarNative.calls.some((call) =>
  JSON.stringify(call) === JSON.stringify(["placement", "thread-1", "pet"])
), true);
equal(globalThis.__avatarNative.calls.some((call) =>
  JSON.stringify(call) === JSON.stringify(["interact", "thread-1", "presentation-7", { type: "click" }])
), true);
macManager.setHostLayoutForWebContents(webContents, {
  hostId: "thread-1",
  anchors: [],
  anchorRect: null,
});
macManager.setHostLayoutForWebContents(webContents, {
  hostId: "thread-1",
  anchors: [],
  anchorRect: { x: 0, y: 0, width: 20, height: 20 },
});
equal(globalThis.__avatarNative.calls.filter(([name, id]) => name === "active" && id === null).length >= 1, true);
equal(globalThis.__avatarNative.calls.filter(([name, id]) => name === "active" && id === "thread-1").length, 2);
macManager.dispose();
globalThis.__avatarWindows = [];
globalThis.__avatarFocusedWindow = null;

const main = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
const windowContext = fs.readFileSync(path.join(root, "src/main/main-app/window/window-context.ts"), "utf8");
const binding = fs.readFileSync(path.join(root, "src/main/main-app/browser-sidebar/browser-page-webview-binding-controller.ts"), "utf8");
equal(main.includes('require("./main-app/avatar-overlay/pip.js")'), true);
equal(main.includes("U = createRemoteHostedPipManager({"), true);
equal(main.includes("videoFrameChannel: a.qt"), true);
equal(main.includes("var zu = getVoiceController"), false);
equal(main.includes("function mle("), false);
equal(main.includes("function lue("), false);
equal(main.includes("V = new AvatarOverlayWindowManager(B, u, x)"), true);
equal(windowContext.includes("getVoiceController(this.options.avatarOverlayManager)"), true);
equal(windowContext.includes("zu(this.options.avatarOverlayManager)"), false);
equal(binding.includes("const { e, id, c,"), false);
equal(main.includes("createBrowserPageWebviewBindingControllerClass({ e, id, c,"), false);

console.log(`${assertions} main avatar overlay runtime owner assertions passed`);
