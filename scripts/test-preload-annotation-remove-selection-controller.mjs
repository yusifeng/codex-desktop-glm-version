import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationRemoveSelectionController } = require(
  "../app/.vite/build/browser-page-preload/annotation-remove-selection-controller.js",
);

const events = [];
const editorState = { target: { mode: "create" }, anchor: { type: "element" } };
const controller = createAnnotationRemoveSelectionController({
  getAnchorSelections: () => ({ primary: "primary", additional: ["extra"] }),
  projectSelection: (selections, selection) => {
    events.push(["project", selections, selection]);
    return { anchor: selection };
  },
  applyAnchorUpdate: (state, anchor) => events.push(["apply", state, anchor]),
});
assert.equal(controller.remove(1, { multiSelectEnabled: true, editorState }), true);
assert.deepEqual(events.map(([name]) => name), ["project", "apply"]);
assert.equal(controller.remove(4, { multiSelectEnabled: true, editorState }), false);
assert.equal(controller.remove(0, { multiSelectEnabled: false, editorState }), false);
assert.equal(controller.remove(0, { multiSelectEnabled: true, editorState: { target: { mode: "edit" }, anchor: { type: "element" } } }), false);
controller.dispose();
assert.equal(controller.remove(0, { multiSelectEnabled: true, editorState }), false);
console.log("9 preload annotation remove-selection-controller assertions passed");
