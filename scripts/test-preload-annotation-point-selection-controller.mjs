import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationPointSelectionController } = require(
  "../app/.vite/build/browser-page-preload/annotation-point-selection-controller.js",
);

const events = [];
let captured = null;
const controller = createAnnotationPointSelectionController({
  focusEditor: () => events.push("focus"),
  getCapturedPoint: () => captured,
  clearCapturedPoint: () => {
    captured = null;
    events.push("clear-capture");
  },
  now: () => 100,
  captureMaxAge: 20,
  selectCapturedPoint: () => {
    events.push("select-capture");
    return true;
  },
  openCapturedFallback: () => {
    events.push("open-capture-fallback");
    return true;
  },
  selectPoint: () => {
    events.push("select-point");
    return false;
  },
  resolveElement: () => ({ ownerDocument: "doc" }),
  projectAnchor: () => "anchor",
  openAt: (_element, anchor) => {
    events.push(["open", anchor]);
    return true;
  },
});
assert.equal(controller.select({ x: 1, y: 2 }, { isEditorOpen: true, canUseSiteAnnotationApi: true }), true);
assert.deepEqual(events, ["focus"]);
events.length = 0;
captured = { capturedAt: 90, viewportPoint: "captured", element: "element", anchorState: "anchor-state" };
assert.equal(controller.select({ x: 1, y: 2 }, { isEditorOpen: false, canUseSiteAnnotationApi: true }), true);
assert.deepEqual(events, ["clear-capture", "select-capture"]);
events.length = 0;
assert.equal(controller.select({ x: 1, y: 2 }, { isEditorOpen: false, canUseSiteAnnotationApi: true }), true);
assert.deepEqual(events, ["clear-capture", "select-point", ["open", "anchor"]]);
controller.dispose();
assert.equal(controller.select({ x: 1, y: 2 }, { isEditorOpen: false, canUseSiteAnnotationApi: true }), false);
console.log("10 preload annotation point-selection-controller assertions passed");
