import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationCreateAnchorUpdateController } = require("../app/.vite/build/browser-page-preload/annotation-create-anchor-update-controller.js");
const calls = [];
const controller = createAnnotationCreateAnchorUpdateController({
  cancelEditor: () => calls.push(`cancel`), resetModifier: () => calls.push(`modifier`),
  clearPointer: () => calls.push(`pointer`), clearTransient: () => calls.push(`transient`),
  clearHover: () => calls.push(`hover`), clearSelectionHover: () => calls.push(`selection`),
  mergeAnchor: (anchor, selection) => ({ ...anchor, selection }), serializeAnchorState: () => ({ serialized: true }),
  updateAnchor: () => calls.push(`update`), refreshViewport: () => calls.push(`refresh`),
  setSelectionHover: () => calls.push(`clear-selection`), setEditorState: () => calls.push(`state`),
});
const editor = { target: { mode: `create` }, anchor: { type: `element` } };
assert.equal(controller.update(editor, null, 0, { multiSelectEnabled: false, zoom: 1, viewportScale: 1 }), true);
assert.deepEqual(calls, [`cancel`, `modifier`, `pointer`, `transient`, `hover`, `selection`,]);
calls.length = 0;
assert.equal(controller.update(editor, { additional: [] }, 0, { multiSelectEnabled: true, zoom: 1, viewportScale: 1 }), true);
assert.deepEqual(calls, [`update`, `refresh`, `clear-selection`, `state`]);
controller.dispose();
assert.equal(controller.update(editor, null, 0, { multiSelectEnabled: true, zoom: 1, viewportScale: 1 }), false);
console.log("9 preload annotation create-anchor-update-controller assertions passed");
