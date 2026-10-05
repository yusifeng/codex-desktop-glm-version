import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isSafeAnnotationId } = require("../app/.vite/build/browser-page-preload/annotation-id-policy.js");

assert.equal(isSafeAnnotationId("hit-1", 8), true);
assert.equal(isSafeAnnotationId("", 8), false);
assert.equal(isSafeAnnotationId("123456789", 8), false);
assert.equal(isSafeAnnotationId("hit\u0000", 8), false);

console.log("test-preload-annotation-id-policy: 4 assertions passed");
