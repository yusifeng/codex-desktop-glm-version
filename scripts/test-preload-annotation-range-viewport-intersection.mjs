import assert from "node:assert/strict";
import { isAnnotationRangeIntersectingRect } from "../app/.vite/build/browser-page-preload/annotation-range-viewport-intersection.js";
const range = { selectNodeContents: () => {}, getClientRects: () => [{ left: 5, top: 5, right: 10, bottom: 10 }] };
const deps = { createRange: () => range, getClientRects: (value) => value.getClientRects(), intersects: (candidate, rect) => candidate.right >= rect.x && candidate.left <= rect.x + rect.width && candidate.bottom >= rect.y && candidate.top <= rect.y + rect.height };
assert.equal(isAnnotationRangeIntersectingRect({}, {}, { x: 0, y: 0, width: 6, height: 6 }, deps), true);
assert.equal(isAnnotationRangeIntersectingRect({}, {}, { x: 20, y: 20, width: 2, height: 2 }, deps), false);
console.log(`test-preload-annotation-range-viewport-intersection: 2 assertions passed`);
