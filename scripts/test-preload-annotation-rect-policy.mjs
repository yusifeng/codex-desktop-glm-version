import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isValidAnnotationRect } = require("../app/.vite/build/browser-page-preload/annotation-rect-policy.js");

assert.equal(isValidAnnotationRect({ x: 0, y: 1, width: 10, height: 20 }), true);
assert.equal(isValidAnnotationRect({ x: 0, y: 1, width: 0, height: 20 }), false);
assert.equal(isValidAnnotationRect({ x: Number.NaN, y: 1, width: 10, height: 20 }), false);

console.log("test-preload-annotation-rect-policy: 3 assertions passed");
