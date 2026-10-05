import assert from "node:assert/strict";
import { projectAnnotationTooltipPosition } from "../app/.vite/build/browser-page-preload/annotation-tooltip-position.js";
assert.deepEqual(projectAnnotationTooltipPosition({ x: 100, y: 200, width: 20, height: 20 }, { viewport: { width: 800, height: 600 }, viewportScale: 1 }), { x: 100, y: 120, width: 240, height: 72 });
assert.equal(projectAnnotationTooltipPosition({ x: 100, y: 10, width: 20, height: 20 }, { viewport: { width: 800, height: 600 }, viewportScale: 1 }).y, 38);
assert.deepEqual(projectAnnotationTooltipPosition({ x: 790, y: 200, width: 10, height: 10 }, { viewport: { width: 800, height: 600 }, viewportScale: 1 }), { x: 544, y: 120, width: 240, height: 72 });
console.log("test-preload-annotation-tooltip-position: 3 assertions passed");
