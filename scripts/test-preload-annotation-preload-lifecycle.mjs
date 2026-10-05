import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { initializeAnnotationPreload } = require("../app/.vite/build/browser-page-preload/annotation-preload-lifecycle.js");

function target() {
  const listeners = new Map();
  return {
    addEventListener(type, listener, options) { listeners.set(type, { listener, options }); },
    removeEventListener(type) { listeners.delete(type); },
    get(type) { return listeners.get(type); },
  };
}

const windowLike = target();
windowLike.top = windowLike;
const documentLike = { readyState: "loading" };
const calls = [];
const ipcRenderer = {
  on(channel, listener) { calls.push(["on", channel, listener]); },
  sendSync(channel) { calls.push(["policy", channel]); return { enabled: true }; },
};
const mount = () => calls.push(["mount"]);
const onPageHide = () => calls.push(["pagehide"]);
initializeAnnotationPreload({
  ipcRenderer, windowLike, documentLike, globalLike: { isSecureContext: true },
  channels: { hostMessage: "host", policy: "policy" },
  initializeFeatures: (policy) => calls.push(["features", policy]),
  handleHostMessage: () => {}, mount, onPageHide,
});
assert.equal(calls[0][0], "on");
assert.deepEqual(calls[1], ["policy", "policy"]);
assert.deepEqual(calls[2], ["features", { enabled: true }]);
assert.deepEqual(windowLike.get("DOMContentLoaded").options, { once: true });
assert.equal(windowLike.get("pagehide").listener, onPageHide);
windowLike.get("DOMContentLoaded").listener();
assert.deepEqual(calls.at(-1), ["mount"]);

const immediateWindow = target();
immediateWindow.top = immediateWindow;
let immediateMounts = 0;
initializeAnnotationPreload({
  ipcRenderer: { on() {}, sendSync() { throw new Error("cross-origin policy must not sync"); } },
  windowLike: immediateWindow, documentLike: { readyState: "complete" }, globalLike: { isSecureContext: false },
  channels: { hostMessage: "host", policy: "policy" }, initializeFeatures() { throw new Error("must not initialize"); },
  handleHostMessage() {}, mount: () => immediateMounts++, onPageHide,
});
assert.equal(immediateMounts, 1);
console.log("test-preload-annotation-preload-lifecycle: 8 assertions passed");
