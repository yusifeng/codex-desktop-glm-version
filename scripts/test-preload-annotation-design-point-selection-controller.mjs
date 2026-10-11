import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationDesignPointSelectionController } = require(
  "../app/.vite/build/browser-page-preload/annotation-design-point-selection-controller.js",
);

const events = [];
let captured = null;
const controller = createAnnotationDesignPointSelectionController({
  focusEditor: () => events.push("focus"),
  getCapturedPoint: () => captured,
  clearCapturedPoint: () => {
    captured = null;
    events.push("clear-capture");
  },
  now: () => 100,
  captureMaxAge: 20,
  resolveElement: (_point, _canUse, mode) => {
    events.push(["resolve", mode]);
    return "resolved";
  },
  projectAnchor: (element, point) => ({ element, point }),
  openDesignEditor: (element, anchor) => {
    events.push(["open", element, anchor]);
    return true;
  },
});
assert.equal(controller.open({ x: 1, y: 2 }, "design", { isEditorOpen: true, canUseSiteAnnotationApi: true }), true);
assert.deepEqual(events, ["focus"]);
events.length = 0;
captured = { capturedAt: 90, designElement: "captured", element: "captured", anchorState: "saved" };
assert.equal(controller.open({ x: 1, y: 2 }, "design", { isEditorOpen: false, canUseSiteAnnotationApi: true }), true);
assert.deepEqual(events, ["clear-capture", ["open", "captured", "saved"]]);
events.length = 0;
assert.equal(controller.open({ x: 1, y: 2 }, "alternate", { isEditorOpen: false, canUseSiteAnnotationApi: false }), true);
assert.deepEqual(events.map((event) => Array.isArray(event) ? event[0] : event), ["clear-capture", "resolve", "open"]);
controller.dispose();
assert.equal(controller.open({ x: 1, y: 2 }, "design", { isEditorOpen: false, canUseSiteAnnotationApi: true }), false);
console.log("10 preload annotation design-point-selection-controller assertions passed");
