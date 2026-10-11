import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationPreparedScreenshotController } = require(
  "../app/.vite/build/browser-page-preload/annotation-prepared-screenshot-controller.js",
);

const values = [];
const controller = createAnnotationPreparedScreenshotController({
  setPreparedComment: (commentId) => values.push(commentId),
});
assert.equal(controller.prepare("comment-1"), true);
assert.equal(controller.reconcile([{ id: "comment-1" }]), false);
assert.equal(controller.reconcile([{ id: "comment-2" }]), true);
assert.deepEqual(values, ["comment-1", null]);
assert.equal(controller.prepare("comment-3"), true);
assert.equal(controller.clear(), true);
controller.dispose();
assert.equal(controller.prepare("comment-4"), false);
assert.equal(controller.clear(), false);
assert.equal(controller.reconcile([{ id: "comment-4" }]), false);
assert.deepEqual(values, ["comment-1", null, "comment-3", null]);
console.log("11 preload annotation prepared-screenshot-controller assertions passed");
