import assert from "node:assert/strict";
import { projectAnnotationAnchorPoint } from "../app/.vite/build/browser-page-preload/annotation-anchor-point-projection.js";
const anchor = { point: { xPercent: 50, y: 50 }, rect: { x: 0, y: 0, width: 100, height: 100 } };
assert.deepEqual(projectAnnotationAnchorPoint(anchor, { x: 10, y: 20, width: 200, height: 100 }, { width: 100, height: 100 }), { x: 110, y: 70 });
assert.deepEqual(projectAnnotationAnchorPoint({ ...anchor, rect: { ...anchor.rect, width: 0 } }, { x: 0, y: 0, width: 20, height: 20 }, { width: 100, height: 100 }), { x: 10, y: 10 });
assert.equal(projectAnnotationAnchorPoint(anchor, { x: 0, y: 0, width: 10, height: 10 }, { width: 100, height: 100 }, 200).x, 10);
console.log("test-preload-annotation-anchor-point-projection: 3 assertions passed");
