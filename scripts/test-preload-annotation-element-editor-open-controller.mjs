import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationElementEditorOpenController } = require("../app/.vite/build/browser-page-preload/annotation-element-editor-open-controller.js");
const calls = [];
const controller = createAnnotationElementEditorOpenController({
  clearDomInteraction: () => calls.push(`dom`), normalizeAnchor: (element, anchor) => ({ ...anchor, element }), closePreview: (id) => calls.push(`preview:${id}`), projectDesign: () => ({ id: `design` }), rememberTarget: () => calls.push(`remember`), createTargetMap: () => new Map(), openEditor: () => calls.push(`open`), resetModifier: () => calls.push(`modifier`), clearPointer: () => calls.push(`pointer`), refreshViewport: () => calls.push(`refresh`), setEditorState: () => calls.push(`state`), clearHover: () => calls.push(`hover`), clearSelectionHover: () => calls.push(`selection`),
});
assert.equal(controller.open({}, { anchor: {} }, { annotationEditorDefault: {} }, { canUseSiteAnnotationApi: true, previewCommentId: `preview`, rootHost: {}, getAnnotationControls: () => ({}) }), true);
assert.deepEqual(calls, [`dom`, `preview:preview`, `remember`, `open`, `modifier`, `pointer`, `refresh`, `state`, `hover`, `selection`]);
controller.dispose();
assert.equal(controller.open({}, { anchor: {} }, {}, { canUseSiteAnnotationApi: false, previewCommentId: null, rootHost: {} }), false);
console.log("10 preload annotation element-editor-open-controller assertions passed");
