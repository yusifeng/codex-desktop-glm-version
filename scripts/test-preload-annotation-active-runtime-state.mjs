import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationActiveRuntimeState } = require("../app/.vite/build/browser-page-preload/annotation-active-runtime-state.js");

const comments = [
  { id: "a", anchor: { kind: "element", key: 1 }, additionalAnchors: [] },
  { id: "b", anchor: { kind: "element", key: 2 }, additionalAnchors: [] },
];
let markerInput;
let regionInput;
const state = projectAnnotationActiveRuntimeState({
  previewCommentId: "a", visibleComments: comments, allComments: comments, selectedCommentId: "a",
  editor: { target: { mode: "create" }, anchor: { type: "element", primary: { key: 2 }, additionalSelections: [], viewportSize: { width: 10 } } },
  multiSelectEnabled: true, activeHighlightRect: null, linkedSelectionIndex: 0, elementCache: {}, pageUrl: "page",
  numbering: new Map(), viewport: { width: 500 }, zoomFactor: 2, markersEnabled: true, markersVisible: true, suspended: false,
}, {
  projectActiveView: (_preview, visible) => ({ active: { kind: "comment", annotation: visible[0] }, activeId: "a", displayAnnotations: visible, hasActiveSelection: false }),
  resolveEditorAnchor: (anchor) => anchor.primary,
  splitEditorAnchor: (anchor) => ({ primary: anchor.primary }),
  resolveAdditionalAnchor: (anchor) => anchor,
  selectionsEqual: (left, right) => left.key === right.key,
  textAnchorsEqual: () => false,
  isOriginalPage: () => true,
  projectMarkerRecords: (annotations) => { markerInput = annotations; return annotations.map((annotation) => ({ markerPoint: { id: annotation.id } })); },
  resolveLiveElement: () => null,
  resolveMarkerPoint: () => null,
  clusterMarkerPoints: (points, width) => ({ points, width }),
  projectActiveGeometry: () => ({ activeElement: "element", additionalAnchors: ["extra"], skipScreenshotCapture: true }),
  resolveCommentElement: () => null,
  resolveDesignElement: () => null,
  projectRegionRecords: (input) => { regionInput = input; return ["region"]; },
  shouldSuppressRegion: () => false,
  projectTextPreviewState: (input) => ({ resolvedAnchor: input.selectedComment?.anchor ?? null, selectionRects: [] }),
  resolveTextAnchor: () => null,
  resolveSelectionRects: () => [],
});
assert.equal(state.activeId, "a");
assert.equal(state.hasActiveSelection, false);
assert.equal(state.linkedSelectionIndex, 0);
assert.equal(state.matchedAnnotation.id, "b");
assert.equal(state.originalPage, true);
assert.deepEqual(markerInput.map((comment) => comment.id), ["a"]);
assert.equal(state.markerPoints.width, 1000);
assert.equal(state.activeGeometry.activeElement, "element");
assert.equal(state.selectedComment.id, "a");
assert.equal(regionInput.enabled, true);
assert.deepEqual(state.regionRecords, ["region"]);
assert.equal(state.textPreviewState.resolvedAnchor.kind, "element");
console.log("12 preload annotation active-runtime-state assertions passed");
