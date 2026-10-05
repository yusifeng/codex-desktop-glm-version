import assert from "node:assert/strict";
import { createAnnotationPreloadBridge } from "../app/.vite/build/browser-page-preload/annotation-preload-bridge.js";

const calls = [];
const listeners = new Map();
const state = { canUseSiteAnnotationApi: true };
const registry = { getTargets: () => ["target"], getControls: (target) => [target] };
const requests = {
  subscribe: () => calls.push("site-subscribe"),
  clear: () => calls.push("site-clear"),
};
const ipcRenderer = {
  on(channel, listener) { listeners.set(channel, listener); calls.push(`on:${channel}`); },
  removeListener(channel, listener) {
    assert.equal(listeners.get(channel), listener);
    listeners.delete(channel);
    calls.push(`off:${channel}`);
  },
  invoke(channel, message) { calls.push(["invoke", channel, message]); },
};

const bridgeState = createAnnotationPreloadBridge({
  ipcRenderer,
  channels: { hostMessage: "host", runtime: "runtime" },
  getState: () => state,
  getControlsRegistry: () => registry,
  getSiteAnnotationRequests: () => requests,
  getMountedMessageAction: (type) => type === "sync" ? "sync" : type === "forward" ? "forward" : "ignore",
  reducePendingEditorMessage: (pending, message) => ({ ...(pending ?? {}), ...message }),
  setActiveEditor: (active) => { state.hasActiveEditor = active; calls.push(["active", active]); },
});

bridgeState.bufferSync({ type: "sync", value: 1 });
bridgeState.bufferTextSelection();
bridgeState.bufferEditorMessage({ type: "editor", value: 2 });
assert.equal(bridgeState.hasMountedSubscriber, false);
assert.equal(bridgeState.hasPendingEditorMessage, true);

const received = [];
const unsubscribe = bridgeState.bridge.subscribeToHostMessages((message) => received.push(message));
assert.equal(bridgeState.hasMountedSubscriber, true);
assert.deepEqual(received, [
  { type: "sync", value: 1 },
  { type: "browser-sidebar-runtime-capture-text-selection" },
  { type: "editor", value: 2 },
]);
assert.equal(bridgeState.hasPendingEditorMessage, false);
assert.equal(listeners.has("host"), true);

listeners.get("host")({}, { type: "sync", value: 3 });
listeners.get("host")({}, { type: "forward", value: 4 });
listeners.get("host")({}, { type: "ignore", value: 5 });
assert.deepEqual(received.slice(-2), [
  { type: "sync", value: 3, canUseSiteAnnotationApi: true },
  { type: "forward", value: 4 },
]);

bridgeState.bridge.sendMessageToHost({ type: "browser-sidebar-runtime-open-editor" });
bridgeState.bridge.sendMessageToHost({ type: "browser-sidebar-runtime-cancel-editor" });
assert.equal(state.hasActiveEditor, false);
assert.deepEqual(calls.filter((entry) => Array.isArray(entry) && entry[0] === "active"), [["active", true], ["active", false]]);
assert.equal(calls.filter((entry) => entry === "site-clear").length, 2);
assert.deepEqual(bridgeState.bridge.getAnnotationControlTargets(), ["target"]);
assert.deepEqual(bridgeState.bridge.getAnnotationControls("target"), ["target"]);

unsubscribe();
assert.equal(bridgeState.hasMountedSubscriber, false);
assert.equal(listeners.has("host"), false);
bridgeState.bufferSync({ type: "sync", value: 6 });
assert.equal(bridgeState.hasMountedSubscriber, false);

bridgeState.bufferEditorMessage({ type: "editor", value: 7 });
bridgeState.dispose();
assert.equal(bridgeState.hasMountedSubscriber, false);
assert.equal(bridgeState.hasPendingEditorMessage, false);
bridgeState.bufferSync({ type: "sync", value: 8 });
bridgeState.bufferTextSelection();
bridgeState.bufferEditorMessage({ type: "editor", value: 9 });
bridgeState.bridge.sendMessageToHost({ type: "browser-sidebar-runtime-open-editor" });
assert.equal(calls.some((entry) => Array.isArray(entry) && entry[0] === "invoke" && entry[2]?.value === 8), false);
assert.equal(typeof bridgeState.bridge.subscribeToHostMessages(() => {}), "function");

console.log("test-preload-annotation-preload-bridge: 22 assertions passed");
