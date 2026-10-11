import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationInteractionResetController } = require("../app/.vite/build/browser-page-preload/annotation-interaction-reset-controller.js");
const calls = [];
const names = [`close`, `modifier`, `pointer`, `transient`, `prepared`, `hover`, `selection`, `preview`, `suppression`, `captured`, `editor`, `generation`, `viewport`, `drag`];
const controller = createAnnotationInteractionResetController(Object.fromEntries(names.map((name) => [
  name === `close` ? `closePreview` : name === `modifier` ? `resetModifier` : name === `pointer` ? `clearPointer` : name === `transient` ? `clearTransient` : name === `prepared` ? `clearPreparedSelection` : name === `hover` ? `clearHover` : name === `selection` ? `clearSelectionHover` : name === `preview` ? `clearPreview` : name === `suppression` ? `clearSelectionSuppression` : name === `captured` ? `clearCapturedPoint` : name === `editor` ? `clearEditorState` : name === `generation` ? `nextInteractionGeneration` : name === `viewport` ? `clearViewportSelection` : `clearDragState`, name === `close` ? (id) => calls.push(`${name}:${id}`) : () => calls.push(name),
])));
assert.equal(controller.reset(`comment-1`), true);
assert.deepEqual(calls, [`close:comment-1`, ...names.slice(1)]);
controller.dispose();
assert.equal(controller.reset(null), false);
console.log("15 preload annotation interaction-reset-controller assertions passed");
