import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationEditorAnchorRestoreController } = require("../app/.vite/build/browser-page-preload/annotation-editor-anchor-restore-controller.js");
const calls = [];
const controller = createAnnotationEditorAnchorRestoreController({
  createTargetMap: () => new Map([[`id`, { node: true }]]),
  buildAnchorPayload: (state, targets) => ({ state, targetCount: targets.size }),
  setEditorState: (state) => calls.push(state),
});
assert.equal(controller.restore({ target: { mode: `create` }, anchor: { type: `element` } }, {}), true);
assert.deepEqual(calls, [{ state: { target: { mode: `create` }, anchor: { type: `element` } }, targetCount: 1 }]);
controller.dispose();
assert.equal(controller.restore({}, {}), false);
console.log("4 preload annotation editor-anchor-restore-controller assertions passed");
