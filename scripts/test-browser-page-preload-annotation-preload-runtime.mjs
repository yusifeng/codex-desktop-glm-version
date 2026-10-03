import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationPreloadRuntime } = require("../app/.vite/build/browser-page-preload/annotation-preload-runtime.js");

const calls = [];
const ipcListeners = new Map();
const windowListeners = new Map();
let resolveRuntime;
let bridge;
let featureCallback;
let modeToggle;
let permissionDeps;
const policy = {
  enabled: true,
  siteAnnotationPermissionGranted: false,
  siteAnnotationFeaturesEnabled: true,
  canUseTweaks: true,
  isAgentControllingBrowser: false,
  isAnnotationModeActive: true,
};
const requests = {
  subscribe: () => {},
  clear: () => calls.push(["requests-clear"]),
  dispose: () => calls.push(["requests-dispose"]),
};
const controls = {
  getTargets: () => ["target"],
  getControls: (target) => [`controls:${target}`],
  dispose: () => calls.push(["controls-dispose"]),
};
const mounted = {
  previews: [],
  setSiteAnnotationPreview(value) { this.previews.push(value); },
  dispose: () => calls.push(["mounted-dispose"]),
};
const windowLike = {
  top: null,
  addEventListener: (type, listener, options) => {
    calls.push(["window-on", type, options]);
    windowListeners.set(type, listener);
  },
  removeEventListener: (type, listener) => calls.push(["window-off", type, listener]),
};
windowLike.top = windowLike;
const deps = {
  ipcRenderer: {
    on: (channel, listener) => {
      calls.push(["ipc-on", channel]);
      const listeners = ipcListeners.get(channel) ?? [];
      listeners.push(listener);
      ipcListeners.set(channel, listeners);
    },
    removeListener: (channel, listener) => calls.push(["ipc-off", channel, listener]),
    sendSync: () => policy,
    send: (...args) => calls.push(["send", ...args]),
    invoke: (...args) => {
      calls.push(["invoke", ...args]);
      return Promise.resolve();
    },
  },
  windowLike,
  documentLike: {
    readyState: "complete",
    dispatchEvent: (event) => calls.push(["dispatch", event]),
  },
  navigatorLike: { userActivation: { isActive: true } },
  globalLike: { isSecureContext: true },
  channels: { hostMessage: "host", policy: "policy", pageEvent: "page", runtime: "runtime" },
  featureEvent: { type: "features" },
  intlConfig: { locale: "en" },
  createRequestId: () => "request",
  createPermissionController: (value) => {
    permissionDeps = value;
    return {
      requestPermission: () => Promise.resolve(true),
      handleResult: (...args) => calls.push(["permission-result", ...args]),
      reset: () => calls.push(["permission-reset"]),
    };
  },
  createInitialState: (intlConfig) => ({
    interactionMode: "browse",
    canUseSiteAnnotationApi: false,
    isAgentControllingBrowser: false,
    intlConfig,
  }),
  resolveSyncState: (message, available) => ({ ...message, canUseSiteAnnotationApi: available && message.siteAnnotationFeaturesEnabled !== false }),
  isCommentModeActive: (state) => state.canUseSiteAnnotationApi && state.interactionMode === "comment",
  getMountedMessageAction: (type) => type === "sync" ? "sync" : type === "forward" ? "forward" : "ignore",
  getPreMountMessageAction: (type) => ({
    permission: "permission-result",
    preview: "preview",
    sync: "sync",
    capture: "capture-text-selection",
    editor: "queue-editor-message",
    close: "close-editor",
  })[type] ?? "ignore",
  reducePendingEditorMessage: (_pending, message) => message,
  createControlsRegistry: () => controls,
  createSiteAnnotationRequests: (options) => {
    calls.push(["requests-options", options]);
    return requests;
  },
  createFeatureObserver: (callback) => {
    featureCallback = callback;
    return { recordUse: () => {}, dispose: () => calls.push(["observer-dispose"]) };
  },
  createModeController: (toggle) => {
    modeToggle = toggle;
    return () => calls.push(["mode-dispose"]);
  },
  loadCommentRuntime: () => new Promise((resolve) => { resolveRuntime = resolve; }),
  createCustomEvent: (type, init) => ({ type, ...init }),
};

const runtime = createAnnotationPreloadRuntime(deps);
runtime.initialize();
assert.equal(ipcListeners.get("host").length, 1);
assert.equal(permissionDeps.isPermissionGranted(), false);
assert.equal(typeof resolveRuntime, "function");
assert.equal(windowListeners.has("pagehide"), true);

const hostHandler = ipcListeners.get("host")[0];
hostHandler(null, { type: "sync", interactionMode: "comment", siteAnnotationFeaturesEnabled: true });
hostHandler(null, { type: "capture" });
hostHandler(null, { type: "editor", id: "editor" });
hostHandler(null, { type: "preview", preview: "preview" });
resolveRuntime({
  mountBrowserCommentRuntime(value) {
    bridge = value;
    return mounted;
  },
});
await Promise.resolve();
assert.equal(bridge.initialState.interactionMode, "comment");
assert.deepEqual(mounted.previews, ["preview"]);
assert.deepEqual(bridge.getAnnotationControlTargets(), ["target"]);
assert.deepEqual(bridge.getAnnotationControls("target"), ["controls:target"]);

const delivered = [];
const unsubscribe = bridge.subscribeToHostMessages((message) => delivered.push(message));
assert.deepEqual(delivered, [
  { type: "browser-sidebar-runtime-capture-text-selection" },
  { type: "editor", id: "editor" },
]);
ipcListeners.get("host")[1](null, { type: "sync", value: 1 });
ipcListeners.get("host")[1](null, { type: "forward", value: 2 });
assert.deepEqual(delivered.slice(-2), [
  { type: "sync", value: 1, canUseSiteAnnotationApi: true },
  { type: "forward", value: 2 },
]);
unsubscribe();
assert.equal(calls.some(([name, channel]) => name === "ipc-off" && channel === "host"), true);

bridge.sendMessageToHost({ type: "browser-sidebar-runtime-open-editor" });
assert.equal(calls.at(-1)[0], "invoke");
assert.equal(modeToggle(true), true);
assert.deepEqual(calls.at(-1).slice(0, 2), ["invoke", "runtime"]);
featureCallback(["feature"]);
assert.deepEqual(calls.at(-1), ["send", "page", { type: "features", payload: { features: ["feature"] } }]);

hostHandler(null, { type: "permission", requestId: "request", allowed: true });
assert.deepEqual(calls.at(-1), ["permission-result", "request", true]);
windowListeners.get("pagehide")({ isTrusted: true, persisted: false });
assert.equal(calls.some(([name]) => name === "mounted-dispose"), true);
assert.equal(calls.filter(([name]) => name === "permission-reset").length >= 1, true);
assert.equal(calls.some(([name]) => name === "observer-dispose"), true);
assert.equal(calls.some(([name]) => name === "controls-dispose"), true);

console.log("20 annotation preload runtime assertions passed");
