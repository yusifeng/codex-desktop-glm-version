import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationEditEditorController } = require(
  "../app/.vite/build/browser-page-preload/annotation-edit-editor-controller.js",
);

const calls = [];
const target = { node: true };
const targets = new Map();
const controller = createAnnotationEditEditorController({
  createTargetMap: () => targets,
  findComment: (comments, request) => comments.find((comment) => comment.id === request.id),
  projectComment: (comment, anchor, index) => ({ id: comment.id, anchor, index, designChange: null }),
  resolveTarget: () => target,
  applyDesignChange: () => calls.push(`apply`),
  projectAnchor: (commentState, resolvedTarget, zoom) => ({ anchor: { kind: `element`, runtimeElementId: `runtime-1` }, zoom, commentState, resolvedTarget }),
  projectDraftDesign: () => ({ id: `draft` }),
  projectElementDesign: () => ({ id: `design` }),
  buildEditorAnchor: (commentState, resolvedTarget, map) => ({ commentState, resolvedTarget, mapSize: map.size }),
  closePreview: (id) => calls.push(`close:${id}`),
  openEditor: () => calls.push(`open`),
  refreshViewport: () => calls.push(`refresh`),
  setEditorState: (state) => calls.push([`state`, state]),
  clearPreview: () => calls.push(`clear`),
  rememberTarget: (id) => calls.push(`remember:${id}`),
});

assert.equal(controller.open({ id: `comment-1`, anchor: { kind: `text` } }, null, 0, {
  comments: [{ id: `comment-1` }], rootHost: {}, previewCommentId: `preview-1`,
  canUseSiteAnnotationApi: true, zoom: 1, getAnnotationControls: () => ({}),
}), true);
assert.deepEqual(calls.map((call) => Array.isArray(call) ? call[0] : call), [`close:preview-1`, `remember:design`, `open`, `refresh`, `state`, `clear`]);
assert.equal(calls[4][1].target.commentId, `comment-1`);
controller.dispose();
assert.equal(controller.open({ id: `comment-1`, anchor: {} }, null, 0, {
  comments: [], rootHost: {}, previewCommentId: null, canUseSiteAnnotationApi: false, zoom: 1,
}), false);
console.log("10 preload annotation edit-editor-controller assertions passed");
