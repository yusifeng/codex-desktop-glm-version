import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationDraftMarkerState } = require("../app/.vite/build/browser-page-preload/annotation-draft-marker-state.js");

const anchor = { kind: "element" };
const live = { id: "live" };
const calls = [];
const deps = {
  resolveMarkerPoint: (value, viewport, options) => { calls.push({ value, viewport, options }); return { x: 20, y: 40 }; },
  countComments: () => 3,
  getCommentNumber: (annotation) => annotation.id === "matched" ? 2 : undefined,
};
const draft = projectAnnotationDraftMarkerState({ hasActiveSelection: false, anchor, matchedAnnotation: null, isOriginalPage: false, additionalSelections: [{ liveElement: live }], viewportSize: { width: 800, height: 600 }, viewport: { width: 800, height: 600 }, zoomFactor: 1.25 }, deps);
assert.deepEqual(draft.markerPoint, { x: 20, y: 40 });
assert.equal(draft.commentNumber, 4);
assert.equal(calls[0].options.liveElement, live);
assert.equal(calls[0].options.includeElementFrameScroll, true);

const matched = projectAnnotationDraftMarkerState({ hasActiveSelection: false, anchor, matchedAnnotation: { id: "matched" }, isOriginalPage: false, additionalSelections: [], viewportSize: null, viewport: null, zoomFactor: 1 }, deps);
assert.equal(matched.commentNumber, 2);
const blocked = projectAnnotationDraftMarkerState({ hasActiveSelection: true, anchor, matchedAnnotation: null, isOriginalPage: false, additionalSelections: [], viewportSize: null, viewport: null, zoomFactor: 1 }, deps);
assert.equal(blocked.markerPoint, null);
const virtual = projectAnnotationDraftMarkerState({ hasActiveSelection: false, anchor: { kind: "virtual" }, matchedAnnotation: null, isOriginalPage: false, additionalSelections: [], viewportSize: null, viewport: null, zoomFactor: 1 }, deps);
assert.equal(virtual.markerPoint, null);
console.log("8 preload annotation draft-marker-state assertions passed");
