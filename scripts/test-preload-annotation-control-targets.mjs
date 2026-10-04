import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  attachAnnotationControlTargets,
  collectAnnotationControlTargets,
  detachAnnotationControlTargets,
  getAnnotationControlsForTarget,
} = require("../app/.vite/build/browser-page-preload/annotation-control-targets.js");

const documentRef = {};
const first = { ownerDocument: documentRef };
const second = { ownerDocument: documentRef };
const foreign = { ownerDocument: {} };
const index = new WeakMap();
const firstRecord = { order: 2, targets: [] };
const secondRecord = { order: 1, targets: [] };

assert.equal(attachAnnotationControlTargets(firstRecord, new Set([first, second]), index, 2), 2);
assert.equal(attachAnnotationControlTargets(secondRecord, new Set([first]), index, 1), 1);
assert.equal(index.get(first).length, 2);
assert.deepEqual(collectAnnotationControlTargets([firstRecord, secondRecord], (target) => target === first || target === second), [first, second]);
assert.deepEqual(collectAnnotationControlTargets([firstRecord], (target) => target === second), [second]);
assert.equal(getAnnotationControlsForTarget(first, documentRef, new WeakMap([[first, [{ controls: "new" }, { controls: "old" }]]])), "old");
assert.equal(getAnnotationControlsForTarget(foreign, documentRef, new WeakMap([[foreign, [{ controls: "foreign" }]]])), undefined);
assert.equal(detachAnnotationControlTargets(secondRecord, index), 1);
assert.equal(index.get(first).length, 1);
assert.equal(detachAnnotationControlTargets(firstRecord, index), 2);
assert.equal(index.has(first), false);

console.log("test-preload-annotation-control-targets: 10 assertions passed");
