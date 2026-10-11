import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationTextAnchorEditorController } = require(
  "../app/.vite/build/browser-page-preload/annotation-text-anchor-editor-controller.js",
);

const events = [];
const controller = createAnnotationTextAnchorEditorController({
  clearInteraction: () => events.push("clear-interaction"),
  closePreview: (id) => events.push(["close-preview", id]),
  openEditor: (anchor, extras) => events.push(["open-editor", anchor, extras]),
  refreshViewport: () => events.push("refresh"),
  setEditorState: (state) => events.push(["state", state.anchor.type]),
  clearHover: () => events.push("clear-hover"),
  clearSelectionHover: () => events.push("clear-selection-hover"),
});
const anchor = { anchor: { kind: "text", value: "text-value" }, themeVariant: "dark" };
assert.equal(controller.open(anchor, { annotationEditorDefault: "default" }, "preview-1"), true);
assert.deepEqual(events.map((event) => Array.isArray(event) ? event[0] : event), [
  "clear-interaction", "close-preview", "open-editor", "refresh", "state", "clear-hover", "clear-selection-hover",
]);
events.length = 0;
assert.equal(controller.open({ anchor: { kind: "element" } }, null, null), false);
assert.deepEqual(events, []);
controller.dispose();
assert.equal(controller.open(anchor, null, null), false);
console.log("10 preload annotation text-anchor-editor-controller assertions passed");
