import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationViewportRefreshScheduler } = require("../app/.vite/build/browser-page-preload/annotation-viewport-refresh-scheduler.js");

let nextFrame = 0;
const callbacks = new Map();
const cancelled = [];
let refreshes = 0;
const scheduler = createAnnotationViewportRefreshScheduler({
  requestAnimationFrame: (callback) => {
    const handle = ++nextFrame;
    callbacks.set(handle, callback);
    return handle;
  },
  cancelAnimationFrame: (handle) => {
    cancelled.push(handle);
    callbacks.delete(handle);
  },
  refresh: () => {
    refreshes += 1;
  },
});

scheduler.schedule();
scheduler.schedule();
assert.deepEqual(cancelled, [1]);
callbacks.get(2)();
assert.equal(refreshes, 1);
scheduler.schedule();
scheduler.dispose();
assert.deepEqual(cancelled, [1, 3]);
assert.doesNotThrow(() => scheduler.schedule());
assert.equal(refreshes, 1);

console.log("7 preload annotation viewport-refresh-scheduler assertions passed");
