import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isSafeAnnotationName } = require("../app/.vite/build/browser-page-preload/annotation-name-policy.js");

assert.equal(isSafeAnnotationName("Button", 16), true);
assert.equal(isSafeAnnotationName("   ", 16), false);
assert.equal(isSafeAnnotationName("button\u0000", 16), false);

console.log("test-preload-annotation-name-policy: 3 assertions passed");
