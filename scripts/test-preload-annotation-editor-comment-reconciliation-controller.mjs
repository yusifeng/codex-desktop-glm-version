import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationEditorCommentReconciliationController } = require(
  "../app/.vite/build/browser-page-preload/annotation-editor-comment-reconciliation-controller.js",
);

let state = { target: { mode: "edit", commentId: "comment-1" } };
const updates = [];
const controller = createAnnotationEditorCommentReconciliationController({
  updateEditorState: (update) => {
    state = update(state);
    updates.push(state);
  },
});
assert.equal(controller.reconcile([{ id: "comment-1" }]), true);
assert.equal(state.target.commentId, "comment-1");
assert.equal(controller.reconcile([{ id: "comment-2" }]), true);
assert.equal(state, null);
state = { target: { mode: "design", groupId: "group-1" } };
assert.equal(controller.reconcile([]), true);
assert.notEqual(state, null);
state = { target: { mode: "create" } };
assert.equal(controller.reconcile([]), true);
assert.notEqual(state, null);
controller.dispose();
assert.equal(controller.reconcile([]), false);
assert.equal(updates.length, 4);
console.log("10 preload annotation editor-comment-reconciliation-controller assertions passed");
