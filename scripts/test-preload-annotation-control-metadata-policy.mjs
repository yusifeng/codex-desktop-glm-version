import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { sanitizeAnnotationControlMetadata } = require("../app/.vite/build/browser-page-preload/annotation-control-metadata-policy.js");
const limits = { maxKeys: 2, maxKeyLength: 5, maxStringValueLength: 4 };
assert.deepEqual(sanitizeAnnotationControlMetadata({ mode: "edit", count: 2 }, limits), { mode: "edit", count: 2 });
assert.equal(sanitizeAnnotationControlMetadata({ long: "value" }, limits), undefined);
assert.equal(sanitizeAnnotationControlMetadata({ a: undefined }, limits), undefined);
console.log("test-preload-annotation-control-metadata-policy: 3 assertions passed");
