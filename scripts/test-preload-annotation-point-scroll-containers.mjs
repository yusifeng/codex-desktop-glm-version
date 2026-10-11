import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { collectAnnotationPointScrollContainers } = require("../app/.vite/build/browser-page-preload/annotation-point-scroll-containers.js");
const windowLike = { document: {} };
const element = {};
const containers = [{ id: "scroll" }];

assert.deepEqual(
  collectAnnotationPointScrollContainers(windowLike, { x: 3, y: 4 }, {
    getElementFromPoint: (value, point) => { assert.equal(value, windowLike); assert.deepEqual(point, { x: 3, y: 4 }); return element; },
    isElement: (value) => value === element,
    discover: (value, options) => { assert.equal(value, element); assert.deepEqual(options, { includeElement: true }); return containers; },
  }),
  containers,
);
assert.deepEqual(
  collectAnnotationPointScrollContainers(windowLike, { x: 0, y: 0 }, {
    getElementFromPoint: () => null,
    isElement: () => false,
    discover: () => containers,
  }),
  [],
);
assert.deepEqual(
  collectAnnotationPointScrollContainers(windowLike, { x: 0, y: 0 }, {
    getElementFromPoint: () => element,
    isElement: () => false,
    discover: () => containers,
  }),
  [],
);

console.log("3 preload annotation point scroll-container assertions passed");
