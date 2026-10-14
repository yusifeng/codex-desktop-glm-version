import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationAnchorObservationController } = require("../app/.vite/build/browser-page-preload/annotation-anchor-observation-controller.js");

const listeners = new Map();
const makeTarget = (name) => ({
  addEventListener: (type, handler) => listeners.set(`${name}:${type}`, handler),
  removeEventListener: (type) => listeners.delete(`${name}:${type}`),
});
const visualViewport = makeTarget("viewport");
let nextFrame = 1;
const windowLike = Object.assign(makeTarget("window"), {
  visualViewport,
  requestAnimationFrame: (callback) => { callback(); return nextFrame++; },
  cancelAnimationFrame() {},
});
const documentLike = makeTarget("document");
let syncs = 0;
let refreshes = 0;
let frameCleanup = 0;
let textCleanup = 0;
const controller = createAnnotationAnchorObservationController({
  windowLike,
  documentLike,
  isCurrentPage: (annotation) => annotation.current,
  mergeTextAnnotations: (annotations) => { syncs += 1; return annotations; },
  updateTextAnnotations: (update) => update([]),
  refreshViewport: () => { refreshes += 1; },
  observeFrames: () => () => { frameCleanup += 1; },
  observeTextAnchors: (anchors) => { assert.equal(anchors.length, 1); return () => { textCleanup += 1; }; },
  observeMutationsOutsideOverlay: () => null,
  observeScrollContainers: () => () => {},
  flushSync: (callback) => callback(),
});
const annotations = [
  { current: true, anchor: { kind: "text" } },
  { current: false, anchor: { kind: "text" } },
];
assert.equal(controller.install({ editor: {}, annotations, hasDisplayAnnotations: true, interactionMode: "comment" }), undefined);
const cleanup = controller.install({
  editor: null, previewCommentId: null, annotations, hasDisplayAnnotations: true,
  interactionMode: "comment", observeDocumentScroll: true, observeMutations: false,
  interactionLayer: null, rootHost: {},
});
assert.equal(syncs, 1);
listeners.get("window:resize")();
assert.equal(syncs, 2);
assert.equal(refreshes, 1);
listeners.get("document:scroll")();
assert.equal(refreshes, 2);
cleanup();
assert.equal(frameCleanup, 1);
assert.equal(textCleanup, 1);
console.log("9 preload annotation anchor-observation-controller assertions passed");
