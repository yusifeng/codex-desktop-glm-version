import assert from "node:assert/strict";
import { intersectAnnotationRects } from "../app/.vite/build/browser-page-preload/annotation-rect-clip-intersection.js";
assert.deepEqual(intersectAnnotationRects({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 5, top: 4, right: 12, bottom: 8 }), { x: 5, y: 4, width: 5, height: 4 });
assert.equal(intersectAnnotationRects({ left: 0, top: 0, right: 1, bottom: 1 }, { left: 1, top: 0, right: 2, bottom: 1 }), null);
console.log(`test-preload-annotation-rect-clip-intersection: 2 assertions passed`);
