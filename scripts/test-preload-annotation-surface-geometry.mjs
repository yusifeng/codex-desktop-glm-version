import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { clipAnnotationSurfaceRect, unionAnnotationRects } = require("../app/.vite/build/browser-page-preload/annotation-surface-geometry.js");
assert.deepEqual(clipAnnotationSurfaceRect({ x: 10, y: 10, width: 100, height: 100 }, { x: 0, y: 20, width: 40, height: 40 }, { width: 80, height: 80 }), { x: 10, y: 20, width: 30, height: 40 });
assert.equal(clipAnnotationSurfaceRect({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 5, height: 5 }, { width: 100, height: 100 }), null);
assert.equal(clipAnnotationSurfaceRect({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 20, height: 20 }, { width: 10, height: 10 }).width, 5);
assert.equal(clipAnnotationSurfaceRect({ x: -20, y: -20, width: 5, height: 5 }, { x: 0, y: 0, width: 1, height: 1 }, { width: 100, height: 100 }), null);
assert.deepEqual(unionAnnotationRects([{ x: 2, y: 4, width: 3, height: 4 }, { x: 0, y: 6, width: 10, height: 2 }]), { x: 0, y: 4, width: 10, height: 4 });
assert.equal(unionAnnotationRects([]), null);

console.log("6 preload annotation surface geometry assertions passed");
