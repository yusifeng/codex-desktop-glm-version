import assert from "node:assert/strict";
import { projectAnnotationFramePoint } from "../app/.vite/build/browser-page-preload/annotation-frame-point-projection.js";

assert.deepEqual(projectAnnotationFramePoint({ x: 10, y: 20 }, { x: 3, y: 4 }), { x: 13, y: 24 });
assert.deepEqual(projectAnnotationFramePoint({ x: 0, y: 0 }, { x: -2, y: 7 }), { x: -2, y: 7 });
console.log(`test-preload-annotation-frame-point-projection: 2 assertions passed`);
