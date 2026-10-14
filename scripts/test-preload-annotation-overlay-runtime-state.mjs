import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationOverlayRuntimeState } = require("../app/.vite/build/browser-page-preload/annotation-overlay-runtime-state.js");

let renderInput;
const state = projectAnnotationOverlayRuntimeState({
  active: { id: "active" }, selectionRects: [{ x: 1 }], highlightRect: { x: 2 },
  additionalHighlights: [], markerRecords: [], markerPoints: [], zoomFactor: 2,
  hasActiveSelection: false, editor: { target: { mode: "create" }, anchor: { type: "element" } },
  modifierActive: true, selectedPoint: { id: 7 }, additionalSelections: [{ id: 7 }],
  nativeTextSelection: false, interactionMode: "comment", suspended: false,
  draftAnchor: null, viewport: { width: 800 }, baseStyle: { position: "fixed" }, viewportScale: 1,
}, {
  projectScreenshotPayload: (input) => ({ annotationViewportRect: input.highlightRect, markerViewportPoint: null }),
  unionRects: () => null,
  projectRenderState: (input) => { renderInput = input; return { mode: "select", hotspot: { x: 0 } }; },
  collectFlexGapOverlays: () => [],
  projectDraftMarkerState: () => ({ markerPoint: { x: 4 }, commentNumber: 3 }),
  resolveMarkerPoint: () => null,
  countComments: () => 0,
  getCommentNumber: () => 0,
  projectOverlayStyle: ({ baseStyle }) => ({ ...baseStyle }),
  selectionsEqual: (left, right) => left.id === right.id,
});
assert.equal(renderInput.hasLinkedDraftSelection, true);
assert.deepEqual(state.screenshotPayload.annotationViewportRect, { x: 2 });
assert.equal(state.renderState.mode, "select");
assert.deepEqual(state.draftMarkerState.markerPoint, { x: 4 });
assert.equal(state.draftMarkerState.commentNumber, 3);
assert.equal(state.overlayStyle.position, "fixed");
assert.equal(state.overlayStyle.cursor, undefined);
assert.equal(state.overlayStyle.pointerEvents, undefined);

const idle = projectAnnotationOverlayRuntimeState({
  selectionRects: [], additionalHighlights: [], markerRecords: [], markerPoints: [],
  hasActiveSelection: false, editor: null, modifierActive: false, additionalSelections: [],
  nativeTextSelection: false, interactionMode: "comment", suspended: false, baseStyle: {},
}, {
  projectScreenshotPayload: () => ({}), unionRects: () => null,
  projectRenderState: () => ({}), collectFlexGapOverlays: () => [],
  projectDraftMarkerState: () => ({}), resolveMarkerPoint: () => null,
  countComments: () => 0, getCommentNumber: () => 0,
  projectOverlayStyle: () => ({}), selectionsEqual: () => false,
});
assert.equal(idle.overlayStyle.cursor, "none");
assert.equal(idle.overlayStyle.pointerEvents, "auto");
console.log("10 preload annotation overlay-runtime-state assertions passed");
