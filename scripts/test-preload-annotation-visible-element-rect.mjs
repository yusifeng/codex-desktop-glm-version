import assert from "node:assert/strict";
import { getAnnotationVisibleElementRect } from "../app/.vite/build/browser-page-preload/annotation-visible-element-rect.js";
const deps = { isConnected: () => true, isVisible: () => true, getRect: () => ({ left: 2, top: 3, width: 4, height: 5 }), getFrameOffset: () => ({ x: 10, y: 20 }) };
assert.deepEqual(getAnnotationVisibleElementRect({}, deps), { x: 12, y: 23, width: 4, height: 5 });
assert.equal(getAnnotationVisibleElementRect({}, { ...deps, isVisible: () => false }), null);
assert.equal(getAnnotationVisibleElementRect({}, { ...deps, getRect: () => ({ left: 0, top: 0, width: 0, height: 2 }) }), null);
console.log(`test-preload-annotation-visible-element-rect: 3 assertions passed`);
