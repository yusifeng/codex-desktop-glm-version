import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationSelectionModifierController } = require(
  "../app/.vite/build/browser-page-preload/annotation-selection-modifier-controller.js",
);

const events = [];
const pointer = { x: 3, y: 4 };
let element = { ownerDocument: "doc" };
const controller = createAnnotationSelectionModifierController({
  setModifierActive: (active) => events.push(["active", active]),
  clearPointer: () => events.push(["pointer-clear"]),
  clearHover: () => events.push(["hover-clear"]),
  clearTransient: () => events.push(["transient-clear"]),
  isSelectionSuppressed: () => false,
  getPointer: () => pointer,
  preparePointer: () => events.push(["prepare"]),
  resolveElement: () => element,
  focusDocument: (doc) => events.push(["focus", doc]),
  projectAnchor: () => ({ anchor: "anchor", liveElement: element }),
  setSelectionHover: (value) => events.push(["selection", value]),
  setHoverState: (value) => events.push(["hover", value]),
  resolveHover: () => "hover-state",
  setPointer: () => events.push(["pointer-set"]),
});
assert.equal(controller.sync(false, { rootHost: "root", isCreateElementTarget: true, canUseSiteAnnotationApi: true }), true);
assert.deepEqual(events, [["active", false], ["pointer-clear"], ["hover-clear"], ["transient-clear"]]);
events.length = 0;
assert.equal(controller.sync(true, { rootHost: "root", isCreateElementTarget: true, canUseSiteAnnotationApi: true }), true);
assert.deepEqual(events.map(([name]) => name), ["active", "prepare", "focus", "pointer-set", "selection", "hover"]);
events.length = 0;
element = null;
assert.equal(controller.sync(true, { rootHost: "root", isCreateElementTarget: true, canUseSiteAnnotationApi: false }), true);
assert.deepEqual(events.map(([name]) => name), ["active", "prepare", "pointer-clear", "hover-clear", "transient-clear"]);
controller.dispose();
assert.equal(controller.sync(true, { rootHost: "root", isCreateElementTarget: true, canUseSiteAnnotationApi: true }), false);
console.log("13 preload annotation selection-modifier-controller assertions passed");
