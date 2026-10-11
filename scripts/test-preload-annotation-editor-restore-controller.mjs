import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { restoreAnnotationEditor } = require("../app/.vite/build/browser-page-preload/annotation-editor-restore-controller.js");

const events = [];
const message = { target: { mode: "edit", commentId: "one" } };
restoreAnnotationEditor(message, {
  clearInteraction: () => events.push("interaction"),
  resetModifierState: () => events.push("modifier"),
  clearAnchorPoint: () => events.push("anchor"),
  clearPointerState: () => events.push("pointer"),
  clearTransientState: () => events.push("transient"),
  clearHover: () => events.push("hover"),
  clearSelectionHover: () => events.push("selection-hover"),
  restoreEditor: (value) => { events.push("restore"); assert.equal(value, message); },
});
assert.deepEqual(events, [
  "interaction", "modifier", "anchor", "pointer", "transient", "hover", "selection-hover", "restore",
]);

let restored = 0;
restoreAnnotationEditor(null, {
  clearInteraction: () => {}, resetModifierState: () => {}, clearAnchorPoint: () => {},
  clearPointerState: () => {}, clearTransientState: () => {}, clearHover: () => {},
  clearSelectionHover: () => {},
  restoreEditor: (value) => { restored += value == null ? 1 : 0; },
});
assert.equal(restored, 1);
console.log("12 preload annotation editor-restore-controller assertions passed");
