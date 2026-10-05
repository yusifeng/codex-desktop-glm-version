import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isSafeAnnotationText } = require("../app/.vite/build/browser-page-preload/annotation-safe-text-policy.js");

assert.equal(isSafeAnnotationText("Button label"), true);
assert.equal(isSafeAnnotationText("按钮标签"), true);
assert.equal(isSafeAnnotationText("label\u0000"), false);

console.log("test-preload-annotation-safe-text-policy: 3 assertions passed");
