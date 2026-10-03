import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { cloneRecord, createAnnotationControlHandle, createAnnotationOpenRequestDetail, createAnnotationRangeDetail, createAnnotationResponseDetail, isValidAnnotationHitTestRequest, normalizeAnnotationControlTargets, sanitizeAnnotationControlMetadata, sanitizeAnnotationHit, serializeAnnotationControls } = require("../app/.vite/build/browser-page-preload/annotation-runtime.js");
const limits = { maxIdLength: 128, maxRoleLength: 64, rolePattern: "^[a-z][a-z0-9-]*(?![\\s\\S])", metadataLimits: { maxKeys: 6, maxKeyLength: 32, maxStringValueLength: 128, maxSerializedBytes: 8192 } };

assert.deepEqual(cloneRecord({ id: "x" }, 2).id, "x");
assert.equal(cloneRecord({ a: 1, b: 2, c: 3 }, 2), null);
assert.deepEqual(sanitizeAnnotationHit({ id: "hit-1", role: "button", rect: { x: 1, y: 2, width: 10, height: 20 }, metadata: { Source: "test" } }, limits), { id: "hit-1", role: "button", rect: { x: 1, y: 2, width: 10, height: 20 }, metadata: { Source: "test" } });
assert.equal(sanitizeAnnotationHit({ id: "" }, limits), undefined);
assert.equal(sanitizeAnnotationHit({ id: "hit-1", rect: { x: 0, y: 0, width: 0, height: 1 } }, limits), undefined);
assert.equal(sanitizeAnnotationHit(null, limits), null);
assert.equal(sanitizeAnnotationHit({ id: "hit-1", metadata: { "bad key!": true } }, limits).metadata, undefined);
assert.deepEqual(createAnnotationResponseDetail({ type: "result", registrationId: "surface-1", customRendering: true, requestId: "request-1", hit: { id: "hit-1" } }), { type: "result", registrationId: "surface-1", customRendering: true, requestId: "request-1", hit: { id: "hit-1" } });
assert.equal(JSON.stringify(createAnnotationResponseDetail({ type: "disposed", registrationId: "surface-1", customRendering: false })), '{"type":"disposed","registrationId":"surface-1","customRendering":false}');
assert.equal(isValidAnnotationHitTestRequest({ type: "hit-test", requestId: "request-1", x: 1, y: 2 }, 128), true);
assert.equal(isValidAnnotationHitTestRequest({ type: "hit-test", requestId: "", x: 1, y: 2 }, 128), false);
assert.equal(serializeAnnotationControls({ controls: [{ id: "toggle" }], controlsHeading: "Actions" }, 16384), '{"controls":[{"id":"toggle"}],"controlsHeading":"Actions"}');
assert.throws(() => serializeAnnotationControls({ controls: 1n }, 16384), /only data/);
assert.deepEqual(sanitizeAnnotationControlMetadata({ source: "toolbar", count: 2, enabled: true }, { maxKeys: 4, maxKeyLength: 32, maxStringValueLength: 64 }), { source: "toolbar", count: 2, enabled: true });
assert.equal(sanitizeAnnotationControlMetadata({ source: undefined }, { maxKeys: 4, maxKeyLength: 32, maxStringValueLength: 64 }), undefined);
class FakeElement { constructor(ownerDocument) { this.ownerDocument = ownerDocument; } }
const fakeDocument = {};
const firstTarget = new FakeElement(fakeDocument);
assert.deepEqual(normalizeAnnotationControlTargets([firstTarget, firstTarget], FakeElement, fakeDocument, 2), [firstTarget]);
assert.throws(() => normalizeAnnotationControlTargets([new FakeElement({})], FakeElement, fakeDocument, 2), /belong to this document/);
assert.throws(() => normalizeAnnotationControlTargets([firstTarget, firstTarget, firstTarget], FakeElement, fakeDocument, 2), /Too many/);
assert.deepEqual(createAnnotationRangeDetail({ startPath: [0, 1], endPath: [0, 2], startOffset: 3, endOffset: 7, rangeText: "selected" }), { startPath: [0, 1], endPath: [0, 2], startOffset: 3, endOffset: 7, rangeText: "selected" });
assert.deepEqual(createAnnotationOpenRequestDetail({ mode: "advanced", enterAnnotationMode: true, metadata: { source: "toolbar" }, initialComment: "Note", range: { startOffset: 1 } }), { mode: "advanced", enterAnnotationMode: true, metadata: { source: "toolbar" }, initialComment: "Note", range: { startOffset: 1 } });
const emitted = [];
const control = createAnnotationControlHandle("1", (value) => JSON.stringify(value), (value) => value, (type, detail) => { emitted.push([type, detail]); return true; });
control.update({ targets: ["a"] });
control.dispose();
control.dispose();
assert.equal(emitted.length, 2);
assert.throws(() => control.update({}), /disposed/);

console.log("22 preload annotation runtime assertions passed");
