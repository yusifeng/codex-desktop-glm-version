import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { clampAnnotationCoordinate, clipAnnotationSurfaceRect, intersectAnnotationRect, isLargeAnnotationRect, scaleAnnotationRect, unionAnnotationRects } = require("../app/.vite/build/browser-page-preload/annotation-surface-geometry.js");
assert.deepEqual(clipAnnotationSurfaceRect({ x: 10, y: 10, width: 100, height: 100 }, { x: 0, y: 20, width: 40, height: 40 }, { width: 80, height: 80 }), { x: 10, y: 20, width: 30, height: 40 });
assert.equal(clipAnnotationSurfaceRect({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 5, height: 5 }, { width: 100, height: 100 }), null);
assert.equal(clipAnnotationSurfaceRect({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 20, height: 20 }, { width: 10, height: 10 }).width, 5);
assert.equal(clipAnnotationSurfaceRect({ x: -20, y: -20, width: 5, height: 5 }, { x: 0, y: 0, width: 1, height: 1 }, { width: 100, height: 100 }), null);
assert.deepEqual(unionAnnotationRects([{ x: 2, y: 4, width: 3, height: 4 }, { x: 0, y: 6, width: 10, height: 2 }]), { x: 0, y: 4, width: 10, height: 4 });
assert.equal(unionAnnotationRects([]), null);
assert.deepEqual(intersectAnnotationRect({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 3, width: 10, height: 4 }, { x: true, y: true }), { x: 5, y: 3, width: 5, height: 4 });
assert.deepEqual(intersectAnnotationRect({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 3, width: 1, height: 4 }, { x: false, y: true }), { x: 0, y: 3, width: 10, height: 4 });
assert.equal(intersectAnnotationRect({ x: 0, y: 0, width: 1, height: 1 }, { x: 1, y: 0, width: 1, height: 1 }, { x: true, y: true }), null);
assert.deepEqual(scaleAnnotationRect({ x: -2, y: 3, width: 4, height: 5 }, 2), { x: -4, y: 6, width: 8, height: 10 });
assert.equal(clampAnnotationCoordinate(-1, 0, 10), 0);
assert.equal(clampAnnotationCoordinate(12, 0, 10), 10);
assert.equal(isLargeAnnotationRect({ width: 45, height: 30 }, 100, 100, 0.45, 0.3), true);
assert.equal(isLargeAnnotationRect({ width: 44, height: 30 }, 100, 100, 0.45, 0.3), false);

console.log("14 preload annotation surface geometry assertions passed");
