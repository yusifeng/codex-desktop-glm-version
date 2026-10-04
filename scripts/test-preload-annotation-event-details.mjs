import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationOpenRequestDetail, createAnnotationRangeDetail, readAnnotationEventDetail, readAnnotationEventField } = require("../app/.vite/build/browser-page-preload/annotation-event-details.js");

assert.deepEqual(createAnnotationRangeDetail({ startPath: [0, 1], endPath: [0, 2], startOffset: 3, endOffset: 7, rangeText: "selected" }), { startPath: [0, 1], endPath: [0, 2], startOffset: 3, endOffset: 7, rangeText: "selected" });
assert.deepEqual(createAnnotationOpenRequestDetail({ mode: "advanced", enterAnnotationMode: true, metadata: { source: "toolbar" }, initialComment: "Note", range: { startOffset: 1 } }), { mode: "advanced", enterAnnotationMode: true, metadata: { source: "toolbar" }, initialComment: "Note", range: { startOffset: 1 } });
const detail = { answer: 42 };
assert.deepEqual(readAnnotationEventDetail(new CustomEvent("annotation", { detail })), detail);
assert.equal(readAnnotationEventField(detail, "answer"), 42);
assert.equal(readAnnotationEventField(Object.create({ answer: 7 }), "answer"), undefined);
assert.equal(readAnnotationEventDetail({ detail: null }), undefined);

console.log("6 preload annotation event-details assertions passed");
