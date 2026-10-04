import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  cloneRecord,
  sanitizeAnnotationHit,
  sanitizeAnnotationControlMetadata,
  serializeAnnotationControls,
  isValidAnnotationHitTestRequest,
  createAnnotationResponseDetail,
} = require("../app/.vite/build/browser-page-preload/annotation-control-payload.js");

const limits = {
  maxIdLength: 40,
  maxRoleLength: 30,
  rolePattern: "^[a-z-]+$",
  metadataLimits: { maxKeys: 4, maxKeyLength: 20, maxStringValueLength: 30, maxSerializedBytes: 256 },
};

assert.deepEqual(cloneRecord({ id: "ok", nested: { value: 1 } }, 2), Object.assign(Object.create(null), { id: "ok", nested: { value: 1 } }));
assert.equal(cloneRecord(Object.create({ inherited: true }), 2), null);
const polluted = {};
Object.defineProperty(polluted, "__proto__", { enumerable: true, value: "blocked" });
assert.equal(cloneRecord(polluted, 2), null);
assert.equal(cloneRecord({ a: 1, b: 2 }, 1), null);

assert.deepEqual(
  sanitizeAnnotationHit({ id: "hit-1", name: "Button", role: "button", rect: { x: 1, y: 2, width: 10, height: 20 }, metadata: { Source: "test" } }, limits),
  { id: "hit-1", name: "Button", role: "button", rect: { x: 1, y: 2, width: 10, height: 20 }, metadata: { Source: "test" } },
);
assert.equal(sanitizeAnnotationHit({ id: "hit-1", rect: { x: 0, y: 0, width: 0, height: 1 } }, limits), undefined);
assert.equal(sanitizeAnnotationHit({ id: "hit-1", role: "Bad Role" }, limits).role, undefined);
assert.equal(sanitizeAnnotationHit({ id: "hit-1", metadata: { "bad key!": true } }, limits).metadata, undefined);
assert.equal(sanitizeAnnotationHit(null, limits), null);

assert.deepEqual(sanitizeAnnotationControlMetadata({ label: "Run", enabled: true, count: 2 }, { maxKeys: 4, maxKeyLength: 20, maxStringValueLength: 20 }), { label: "Run", enabled: true, count: 2 });
assert.equal(sanitizeAnnotationControlMetadata({ label: undefined }, { maxKeys: 4, maxKeyLength: 20, maxStringValueLength: 20 }), undefined);
assert.equal(sanitizeAnnotationControlMetadata({ ["x".repeat(21)]: true }, { maxKeys: 4, maxKeyLength: 20, maxStringValueLength: 20 }), undefined);
assert.equal(sanitizeAnnotationControlMetadata(Object.create({ inherited: true }), { maxKeys: 4, maxKeyLength: 20, maxStringValueLength: 20 }), undefined);

assert.equal(serializeAnnotationControls({ controls: [{ id: "toggle" }], controlsHeading: "Actions" }, 16384), '{"controls":[{"id":"toggle"}],"controlsHeading":"Actions"}');
assert.throws(() => serializeAnnotationControls({ controls: 1n }, 16384), /only data/);
assert.throws(() => serializeAnnotationControls({ controls: ["x".repeat(100)] }, 10), /maximum size/);

assert.equal(isValidAnnotationHitTestRequest({ type: "hit-test", requestId: "r1", x: 1, y: 2 }, 10), true);
assert.equal(isValidAnnotationHitTestRequest({ type: "hit-test", requestId: "", x: 1, y: 2 }, 10), false);
assert.equal(isValidAnnotationHitTestRequest({ type: "hit-test", requestId: "r1", x: Infinity, y: 2 }, 10), false);
assert.deepEqual(createAnnotationResponseDetail({ type: "render", registrationId: "reg", customRendering: true, requestId: "r1", hit: null }), { type: "render", registrationId: "reg", customRendering: true, requestId: "r1", hit: null });

console.log("20 annotation control payload assertions passed");
