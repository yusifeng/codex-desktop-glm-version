import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveAnnotationHitTargetWithFallback } = require("../app/.vite/build/browser-page-preload/annotation-hit-target-fallback.js");
const element = {};
const point = { x: 1, y: 2 };
const fallback = {};
assert.equal(resolveAnnotationHitTargetWithFallback(element, point, {
  resolve: (value, receivedPoint) => { assert.equal(value, element); assert.equal(receivedPoint, point); return undefined; },
  fallback: (value) => { assert.equal(value, element); return fallback; },
}), fallback);
assert.equal(resolveAnnotationHitTargetWithFallback(element, point, { resolve: () => null, fallback: () => fallback }), null);

console.log("2 preload annotation hit-target fallback assertions passed");
