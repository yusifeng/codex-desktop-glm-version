import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationPreloadBridge } = require("../app/.vite/build/browser-page-preload/annotation-preload-bridge.js");
const calls = [];
const listeners = [];
let requests = { clear: () => calls.push("clear"), subscribe: () => {} };
let active = false;
let state = { canUseSiteAnnotationApi: true };
const bridge = createAnnotationPreloadBridge({
  ipcRenderer: {
    on: (_channel, listener) => listeners.push(listener),
    removeListener: () => {},
    invoke: (...args) => calls.push(args),
  },
  channels: { hostMessage: "host", runtime: "runtime" },
  getState: () => state,
  getControlsRegistry: () => ({ getTargets: () => ["target"], getControls: (target) => [target] }),
  getSiteAnnotationRequests: () => requests,
  getMountedMessageAction: (type) => type === "sync" ? "sync" : "forward",
  reducePendingEditorMessage: (_pending, message) => message,
  setActiveEditor: (value) => { active = value; },
});

bridge.bufferTextSelection();
bridge.bufferEditorMessage({ type: "editor", id: "e1" });
const received = [];
bridge.bridge.subscribeToHostMessages((message) => received.push(message));
assert.deepEqual(received, [{ type: "browser-sidebar-runtime-capture-text-selection" }, { type: "editor", id: "e1" }]);
bridge.bridge.sendMessageToHost({ type: "browser-sidebar-runtime-open-editor" });
assert.equal(active, true);
bridge.bridge.sendMessageToHost({ type: "browser-sidebar-runtime-cancel-editor" });
assert.equal(active, false);
assert.deepEqual(calls, ["clear", ["runtime", { type: "browser-sidebar-runtime-open-editor" }], "clear", ["runtime", { type: "browser-sidebar-runtime-cancel-editor" }]]);
state = { canUseSiteAnnotationApi: false };
assert.equal(bridge.bridge.getAnnotationControls("target"), undefined);
console.log("7 annotation preload bridge assertions passed");
