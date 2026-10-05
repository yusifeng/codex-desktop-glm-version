import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { mergeAnnotationViewportSize } = require("../app/.vite/build/browser-page-preload/annotation-viewport-merge-policy.js");
const value = { width: 10, height: 20, zoom: 2 };
assert.equal(mergeAnnotationViewportSize(value, null), value);
assert.deepEqual(mergeAnnotationViewportSize(value, { width: 30, height: 40 }), { width: 30, height: 40, zoom: 2 });
console.log("test-preload-annotation-viewport-merge-policy: 2 assertions passed");
