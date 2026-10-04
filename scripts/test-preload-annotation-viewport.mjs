import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { readAnnotationViewportSize } = require("../app/.vite/build/browser-page-preload/annotation-viewport.js");
assert.deepEqual(readAnnotationViewportSize({ innerWidth: 1280, innerHeight: 720 }), { width: 1280, height: 720 }, "viewport dimensions");
assert.deepEqual(readAnnotationViewportSize({ innerWidth: 0, innerHeight: 0 }), { width: 0, height: 0 }, "zero dimensions");
console.log("2 preload annotation viewport assertions passed");
