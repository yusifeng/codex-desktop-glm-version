import assert from "node:assert/strict";
import { areAnnotationAnchorsEqual } from "../app/.vite/build/browser-page-preload/annotation-anchor-equality.js";
const base = { kind: `element`, pageUrl: `https://a`, title: `t`, elementPath: `p`, frameUrl: null, framePath: [], isFixed: false, point: { xPercent: 1, y: 2 }, rect: { x: 1, y: 2, width: 3, height: 4 }, role: null, name: null, selector: `#a`, nearbyText: null, runtimeElementId: `e`, scrollContainers: [] };
assert.equal(areAnnotationAnchorsEqual(base, { ...base }), true);
assert.equal(areAnnotationAnchorsEqual(base, { ...base, runtimeElementId: `other` }), false);
assert.equal(areAnnotationAnchorsEqual({ ...base, kind: `region` }, { ...base, kind: `region`, runtimeElementId: `other` }), true);
console.log("test-preload-annotation-anchor-equality: 3 assertions passed");
