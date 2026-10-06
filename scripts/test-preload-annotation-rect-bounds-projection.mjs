import assert from "node:assert/strict";
import { projectAnnotationRectBounds } from "../app/.vite/build/browser-page-preload/annotation-rect-bounds-projection.js";
assert.deepEqual(projectAnnotationRectBounds([{ x: 1, y: 2, width: 3, height: 4 }, { x: -1, y: 4, width: 2, height: 1 }]), { x: -1, y: 2, width: 5, height: 4 });
console.log(`test-preload-annotation-rect-bounds-projection: 1 assertion passed`);
