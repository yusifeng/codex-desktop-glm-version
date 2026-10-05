import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { annotationSurfaceResponseTypes } = require("../app/.vite/build/browser-page-preload/annotation-protocol-response-policy.js");
assert.deepEqual(annotationSurfaceResponseTypes(), ["registered", "invalidated", "disposed", "rendering-failed", "result"]);
console.log("test-preload-annotation-protocol-response-policy: 1 assertion passed");
