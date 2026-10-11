import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationHoverSyncController } = require(
  "../app/.vite/build/browser-page-preload/annotation-hover-sync-controller.js",
);

const pointer = { x: 12, y: 34 };
const events = [];
let domHover = false;
const controller = createAnnotationHoverSyncController({
  getPointer: () => pointer,
  updatePointer: (_pointer, enabled) => {
    events.push(["pointer", enabled]);
    return enabled === false;
  },
  clearDomHover: () => events.push(["clear-dom"]),
  isDomHover: () => domHover,
  setPointer: (value) => events.push(["set-pointer", value]),
  clearHoverState: () => events.push(["clear-state"]),
  setHoverState: (value) => events.push(["set-hover", value]),
  resolveElement: () => "element",
  resolveHover: (element, tweaks) => `${element}:${tweaks}`,
  hasDesignComments: () => true,
});

assert.equal(controller.sync({ interactionMode: "browse" }, { modeAllowsHover: true, hasOpenEditor: false }), false);
assert.deepEqual(events, []);
assert.equal(controller.sync({ interactionMode: "comment", canUseSiteAnnotationApi: true, canUseTweaks: true, comments: [], annotationEditorMode: "design" }, { modeAllowsHover: true, hasOpenEditor: false }), true);
assert.deepEqual(events, [["pointer", true], ["set-pointer", pointer], ["set-hover", "element:true"]]);
domHover = true;
assert.equal(controller.sync({ interactionMode: "comment", canUseSiteAnnotationApi: true }, { modeAllowsHover: true, hasOpenEditor: false }), true);
assert.deepEqual(events.slice(-3), [["pointer", true], ["set-pointer", pointer], ["clear-state"]]);
assert.equal(controller.sync({ interactionMode: "comment", canUseSiteAnnotationApi: false }, { modeAllowsHover: true, hasOpenEditor: false }), true);
assert.deepEqual(events.slice(-2), [["pointer", false], ["clear-dom"]]);
controller.dispose();
assert.equal(controller.sync({ interactionMode: "comment" }, { modeAllowsHover: true, hasOpenEditor: false }), false);
console.log("9 preload annotation hover-sync-controller assertions passed");
