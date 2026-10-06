import assert from "node:assert/strict";
import { projectAnnotationRectPoint } from "../app/.vite/build/browser-page-preload/annotation-rect-point-projection.js";
const rects = [{ x: 1, y: 2, width: 3, height: 4 }, { x: 5, y: 6, width: 7, height: 8 }];
assert.deepEqual(projectAnnotationRectPoint(rects, false), { x: 1, y: 4 });
assert.deepEqual(projectAnnotationRectPoint(rects, true), { x: 12, y: 10 });
assert.deepEqual(projectAnnotationRectPoint([], false), { x: 0, y: 0 });
console.log(`test-preload-annotation-rect-point-projection: 3 assertions passed`);
