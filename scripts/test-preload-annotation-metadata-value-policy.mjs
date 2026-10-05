import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isSafeAnnotationMetadataValue } = require("../app/.vite/build/browser-page-preload/annotation-metadata-value-policy.js");

assert.equal(isSafeAnnotationMetadataValue(null, 8), true);
assert.equal(isSafeAnnotationMetadataValue(4.5, 8), true);
assert.equal(isSafeAnnotationMetadataValue("ok", 8), true);
assert.equal(isSafeAnnotationMetadataValue("too-long", 4), false);
assert.equal(isSafeAnnotationMetadataValue("bad\u0000", 8), false);

console.log("test-preload-annotation-metadata-value-policy: 5 assertions passed");
