import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationVirtualSelectionEditorController } = require("../app/.vite/build/browser-page-preload/annotation-virtual-selection-editor-controller.js");
const calls = [];
const controller = createAnnotationVirtualSelectionEditorController({
  clearDomInteraction: () => calls.push(`dom-clear`), closePreview: (id) => calls.push(`preview:${id}`),
  projectAnchor: (text) => ({ anchor: { themeVariant: `light`, viewportSize: { width: 1 }, text } }),
  projectDesign: () => { calls.push(`design`); return { id: `design-1` }; }, rememberTarget: () => calls.push(`remember`),
  resetModifier: () => calls.push(`modifier`), clearPointer: () => calls.push(`pointer`),
  clearHover: () => calls.push(`hover`), clearSelectionHover: () => calls.push(`selection-hover`),
  setEditorState: () => calls.push(`state`), openEditor: () => calls.push(`open`),
});
assert.equal(controller.open(`selected`, { node: true }, { editorOpen: false, previewCommentId: `preview-1`, zoom: 1, canUseTweaks: true, getAnnotationControls: () => ({ controls: [{}] }) }), true);
assert.deepEqual(calls, [`preview:preview-1`, `design`, `remember`, `modifier`, `pointer`, `hover`, `selection-hover`, `state`, `open`]);
assert.equal(controller.open(`selected`, {}, { editorOpen: true, previewCommentId: null, zoom: 1, canUseTweaks: false }), false);
assert.equal(calls.at(-1), `dom-clear`);
controller.dispose();
assert.equal(controller.open(`selected`, {}, { editorOpen: false, previewCommentId: null, zoom: 1, canUseTweaks: false }), false);
console.log("9 preload annotation virtual-selection-editor-controller assertions passed");
