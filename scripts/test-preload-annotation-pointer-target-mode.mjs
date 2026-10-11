import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveAnnotationPointerTarget } = require("../app/.vite/build/browser-page-preload/annotation-pointer-target-mode.js");
const point = { x: 3, y: 4 };
const target = {};
const options = {};
assert.equal(resolveAnnotationPointerTarget(point, target, "marker", options, { isMarker: (event) => event === "marker", resolveMarker: () => "marker-result", resolvePoint: () => "point-result" }), "marker-result");
assert.equal(resolveAnnotationPointerTarget(point, target, "pointer", options, { isMarker: () => false, resolveMarker: () => "marker-result", resolvePoint: (x, y, receivedOptions, receivedTarget) => { assert.equal(x, 3); assert.equal(y, 4); assert.equal(receivedOptions, options); assert.equal(receivedTarget, target); return "point-result"; } }), "point-result");

console.log("2 preload annotation pointer-target assertions passed");
