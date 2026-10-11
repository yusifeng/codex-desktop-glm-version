import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationCommentPreviewController } = require(
  "../app/.vite/build/browser-page-preload/annotation-comment-preview-controller.js",
);
const calls = [];
const controller = createAnnotationCommentPreviewController({
  createTargetMap: () => new Map(),
  findComment: (comments, request) => comments.find((comment) => comment.id === request.id),
  resolveTarget: () => ({ element: true }),
  projectComment: (comment, anchor, index) => ({ comment, anchor, index }),
  projectAnchor: (state, target, zoom) => ({ state, target, zoom }),
  setPreviewComment: (id) => calls.push(`preview:${id}`),
  refreshViewport: () => calls.push(`refresh`),
  openPreview: (payload) => calls.push(payload),
});
assert.equal(controller.open({ id: `comment-1` }, { kind: `element` }, 0, {
  comments: [{ id: `comment-1` }], rootHost: {}, zoom: 1,
}), true);
assert.deepEqual(calls.map((call) => typeof call === `string` ? call : call.type), [
  `preview:comment-1`, `refresh`, `browser-sidebar-runtime-open-comment-preview`,
]);
assert.equal(calls[2].commentId, `comment-1`);
controller.dispose();
assert.equal(controller.open({ id: `comment-1` }, {}, 0, { comments: [], rootHost: {}, zoom: 1 }), false);
console.log("7 preload annotation comment-preview-controller assertions passed");
