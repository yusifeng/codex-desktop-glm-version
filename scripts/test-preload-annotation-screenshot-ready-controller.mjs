import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationScreenshotReadyController } = require("../app/.vite/build/browser-page-preload/annotation-screenshot-ready-controller.js");

let nextFrame = 0;
const callbacks = new Map();
const cancelled = [];
const notifications = [];
const controller = createAnnotationScreenshotReadyController({
  requestAnimationFrame: (callback) => { const handle = ++nextFrame; callbacks.set(handle, callback); return handle; },
  cancelAnimationFrame: (handle) => { cancelled.push(handle); callbacks.delete(handle); },
});

const notify = (commentId) => notifications.push(commentId);
controller.update(null, false, notify)();
const firstCleanup = controller.update("comment-1", true, notify);
assert.equal(callbacks.size, 1);
assert.equal(controller.update("comment-1", true, notify) instanceof Function, true);
callbacks.get(1)();
assert.deepEqual(notifications, ["comment-1"]);
firstCleanup();
const secondCleanup = controller.update("comment-2", true, notify);
secondCleanup();
assert.deepEqual(cancelled, [2]);
controller.update("comment-3", true, notify);
controller.dispose();
assert.deepEqual(cancelled, [2, 3]);
assert.doesNotThrow(() => callbacks.get(3)?.());
controller.update(null, false, notify);
assert.deepEqual(notifications, ["comment-1"]);
controller.update("comment-4", true, notify);
controller.dispose();
callbacks.get(4)?.();
assert.deepEqual(notifications, ["comment-1"]);
console.log("9 preload annotation screenshot-ready-controller assertions passed");
