import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationSelectionCommentController } = require(
  "../app/.vite/build/browser-page-preload/annotation-selection-comment-controller.js",
);

const events = [];
let prepared = { anchor: { kind: "text" }, id: "prepared" };
let current = null;
const controller = createAnnotationSelectionCommentController({
  focusEditor: () => events.push("focus"),
  getPreparedSelection: () => prepared,
  clearPreparedSelection: () => {
    prepared = null;
    events.push("clear-prepared");
  },
  getCurrentSelection: () => current,
  clearSelection: () => events.push("clear-selection"),
  retryAtPoint: (point) => {
    events.push(["retry", point]);
    return true;
  },
  openFromSelection: (selection) => {
    events.push(["open", selection.id]);
    return true;
  },
});
assert.equal(controller.create({ fallbackViewportPoint: { x: 1, y: 2 } }, true), true);
assert.deepEqual(events, ["focus"]);
events.length = 0;
assert.equal(controller.create({ fallbackViewportPoint: null }, false), true);
assert.deepEqual(events, ["clear-prepared", ["open", "prepared"]]);
events.length = 0;
assert.equal(controller.create({ fallbackViewportPoint: { x: 3, y: 4 } }, false), true);
assert.deepEqual(events, ["clear-prepared", "clear-selection", ["retry", { x: 3, y: 4 }]]);
controller.dispose();
assert.equal(controller.create({ fallbackViewportPoint: null }, false), false);
console.log("10 preload annotation selection-comment-controller assertions passed");
