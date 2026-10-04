import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { overrideAnnotationViewportSize } = require("../app/.vite/build/browser-page-preload/annotation-viewport-override.js");
const value = { width: 10, height: 20, x: 1 };
assert.equal(overrideAnnotationViewportSize(value, null), value, "null keeps identity");
assert.deepEqual(overrideAnnotationViewportSize(value, { width: 100, height: 200 }), { width: 100, height: 200, x: 1 }, "overrides dimensions");
assert.deepEqual(value, { width: 10, height: 20, x: 1 }, "does not mutate source");
console.log("3 preload annotation viewport-override assertions passed");
