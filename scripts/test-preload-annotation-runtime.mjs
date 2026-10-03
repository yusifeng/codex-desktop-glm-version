import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { cloneRecord, sanitizeAnnotationHit } = require("../app/.vite/build/browser-page-preload/annotation-runtime.js");
const limits = { maxIdLength: 128, maxRoleLength: 64, rolePattern: "^[a-z][a-z0-9-]*(?![\\s\\S])", metadataLimits: { maxKeys: 6, maxKeyLength: 32, maxStringValueLength: 128, maxSerializedBytes: 8192 } };

assert.deepEqual(cloneRecord({ id: "x" }, 2).id, "x");
assert.equal(cloneRecord({ a: 1, b: 2, c: 3 }, 2), null);
assert.deepEqual(sanitizeAnnotationHit({ id: "hit-1", role: "button", rect: { x: 1, y: 2, width: 10, height: 20 }, metadata: { Source: "test" } }, limits), { id: "hit-1", role: "button", rect: { x: 1, y: 2, width: 10, height: 20 }, metadata: { Source: "test" } });
assert.equal(sanitizeAnnotationHit({ id: "" }, limits), undefined);
assert.equal(sanitizeAnnotationHit({ id: "hit-1", rect: { x: 0, y: 0, width: 0, height: 1 } }, limits), undefined);
assert.equal(sanitizeAnnotationHit(null, limits), null);
assert.equal(sanitizeAnnotationHit({ id: "hit-1", metadata: { "bad key!": true } }, limits).metadata, undefined);

console.log("6 preload annotation runtime assertions passed");
