import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationMarkerRecords } = require("../app/.vite/build/browser-page-preload/annotation-marker-record-projection.js");

const elementAnchor = { kind: "element", framePath: ["main"], selector: ".target", elementPath: "div" };
const textAnchor = { kind: "text", framePath: [], selector: null, elementPath: "text" };
const virtualAnchor = { kind: "virtual", framePath: [], selector: null, elementPath: "virtual" };
const annotation = {
  id: "comment-1",
  anchor: elementAnchor,
  additionalAnchors: [virtualAnchor, textAnchor],
  markerViewportSize: { width: 800, height: 600 },
  selectionSourceIndexes: [0, 8, 9],
};
const liveElements = [];
const projected = projectAnnotationMarkerRecords([annotation], new Map([["comment-1", 7]]), { width: 800, height: 600 }, 1.25, {
  resolveLiveElement: (anchor, id) => { liveElements.push({ anchor, id }); return id == null ? null : { id }; },
  resolveMarkerPoint: (anchor, viewport, options) => anchor === virtualAnchor ? null : { x: anchor === elementAnchor ? 10 : 20, y: viewport.height / options.zoomFactor },
});
assert.equal(projected.length, 2);
assert.equal(projected[0].comment, annotation);
assert.equal(projected[0].commentNumber, 7);
assert.equal(projected[0].savedSelectionIndex, 0);
assert.equal(projected[0].markerPoint.x, 10);
assert.equal(projected[1].anchor, textAnchor);
assert.equal(projected[1].savedSelectionIndex, 9);
assert.equal(projected[1].key, "comment-1::text:2");
assert.deepEqual(liveElements.map(({ id }) => id), ["comment-1"]);

const omitted = projectAnnotationMarkerRecords([annotation], new Map(), { width: 1, height: 1 }, 1, {
  resolveLiveElement: () => { throw new Error("should not resolve without comment number"); },
  resolveMarkerPoint: () => ({ x: 1, y: 1 }),
});
assert.deepEqual(omitted, []);
console.log("9 preload annotation marker-record projection assertions passed");
