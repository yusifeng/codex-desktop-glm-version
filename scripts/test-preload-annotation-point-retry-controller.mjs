import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationPointRetryController } = require(
  "../app/.vite/build/browser-page-preload/annotation-point-retry-controller.js",
);

const frames = [];
const cancelled = [];
let nextHandle = 0;
const controller = createAnnotationPointRetryController({
  requestAnimationFrame: (callback) => {
    const frame = { id: nextHandle++, callback };
    frames.push(frame);
    return frame;
  },
  cancelAnimationFrame: (frame) => cancelled.push(frame.id),
});
const attempts = [];
assert.equal(controller.retry("point", (value) => {
  attempts.push(value);
  return false;
}), true);
while (frames.length) frames.shift().callback();
assert.deepEqual(attempts, ["point", "point", "point"]);
const successful = [];
controller.retry("success", (value) => {
  successful.push(value);
  return true;
});
frames.shift().callback();
assert.deepEqual(successful, ["success"]);
controller.retry("stale", () => false);
controller.dispose();
assert.deepEqual(cancelled, [4]);
assert.equal(controller.retry("disposed", () => false), false);
console.log("10 preload annotation point-retry-controller assertions passed");
