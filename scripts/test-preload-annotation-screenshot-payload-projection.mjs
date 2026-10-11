import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationScreenshotPayload } = require("../app/.vite/build/browser-page-preload/annotation-screenshot-payload-projection.js");

const active = { kind: "comment", annotation: { id: "comment-1" } };
const markerRecords = [{ comment: { id: "comment-0" } }, { comment: { id: "comment-1" } }];
const markerPoints = [{ x: 10, y: 20 }, { x: 40, y: 80 }];
const unionCalls = [];
const projected = projectAnnotationScreenshotPayload({
  active,
  selectionRects: [{ x: 0, y: 0, width: 4, height: 5 }],
  highlightRect: { x: 2, y: 3, width: 6, height: 7 },
  additionalHighlights: [{ rect: { x: 8, y: 9, width: 10, height: 11 } }],
  markerRecords,
  markerPoints,
  zoomFactor: 2,
}, { unionRects: (rects) => { unionCalls.push(rects); return { x: 0, y: 0, width: 18, height: 20 }; } });
assert.deepEqual(projected.annotationViewportRect, { x: 0, y: 0, width: 18, height: 20 });
assert.equal(unionCalls[0].length, 3);
assert.deepEqual(projected.markerViewportPoint, { x: 20, y: 40 });

const noActive = projectAnnotationScreenshotPayload({ active: null, selectionRects: [], highlightRect: null, additionalHighlights: [], markerRecords, markerPoints, zoomFactor: 1 }, { unionRects: () => { throw new Error("should not union without active annotation"); } });
assert.equal(noActive.annotationViewportRect, null);
assert.equal(noActive.markerViewportPoint, undefined);

const design = projectAnnotationScreenshotPayload({ active: { kind: "design", annotation: { id: "comment-1" } }, selectionRects: [], highlightRect: null, additionalHighlights: [], markerRecords, markerPoints, zoomFactor: 2 }, { unionRects: () => null });
assert.equal(design.markerViewportPoint, undefined);
console.log("7 preload annotation screenshot-payload projection assertions passed");
