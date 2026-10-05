import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isSafeAnnotationMetadataKey } = require("../app/.vite/build/browser-page-preload/annotation-metadata-key-policy.js");

assert.equal(isSafeAnnotationMetadataKey("data-id"), true);
assert.equal(isSafeAnnotationMetadataKey("data label_2"), true);
assert.equal(isSafeAnnotationMetadataKey("data.label"), false);

console.log("test-preload-annotation-metadata-key-policy: 3 assertions passed");
