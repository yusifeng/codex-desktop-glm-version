import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationVisualViewport } = require("../app/.vite/build/browser-page-preload/annotation-visual-viewport-policy.js");
assert.equal(projectAnnotationVisualViewport(null), undefined);
assert.equal(projectAnnotationVisualViewport({ offsetLeft: 0, offsetTop: 0, scale: 1 }), undefined);
assert.deepEqual(projectAnnotationVisualViewport({ offsetLeft: 2, offsetTop: 0, scale: 1 }), { offsetLeft: 2, offsetTop: 0, scale: 1 });
console.log("test-preload-annotation-visual-viewport-policy: 3 assertions passed");
