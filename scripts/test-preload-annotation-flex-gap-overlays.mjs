import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { collectAnnotationFlexGapOverlays } = require("../app/.vite/build/browser-page-preload/annotation-flex-gap-overlays.js");

class Element {}
const styles = new WeakMap();
const rects = new WeakMap();
const ownerWindow = { getComputedStyle: (element) => styles.get(element) };
const deps = {
  getOwnerWindow: () => ownerWindow,
  isElement: (value) => value instanceof Element,
  getVisibleRect: (element) => rects.get(element) ?? null,
};
const childA = new Element();
const childB = new Element();
const absolute = new Element();
const target = new Element();
target.children = [childA, childB, absolute];
styles.set(target, { display: "flex" });
styles.set(childA, { position: "static", borderRadius: "" });
styles.set(childB, { position: "relative", borderRadius: "4px" });
styles.set(absolute, { position: "absolute", borderRadius: "2px" });
rects.set(childA, { x: 1.4, y: 2.6, width: 10.2, height: 11.8 });
rects.set(childB, { x: 20.4, y: 30.6, width: 40.2, height: 50.8 });
const annotation = { id: "a1" };
const cache = new Map([[annotation.id, target]]);

assert.deepEqual(collectAnnotationFlexGapOverlays("padding", null, annotation, cache, deps), []);
assert.deepEqual(collectAnnotationFlexGapOverlays("gap", null, annotation, cache, deps), [
  { borderRadius: "0px", key: "0-1-3-10-12", rect: rects.get(childA) },
  { borderRadius: "4px", key: "1-20-31-40-51", rect: rects.get(childB) },
]);
assert.deepEqual(collectAnnotationFlexGapOverlays("row-gap", { anchor: { type: "element", element: target } }, null, new Map(), deps).length, 2);
styles.set(target, { display: "grid" });
assert.deepEqual(collectAnnotationFlexGapOverlays("gap", null, annotation, cache, deps), []);
styles.set(target, { display: "inline-flex" });
target.children = [childA];
assert.deepEqual(collectAnnotationFlexGapOverlays("column-gap", null, annotation, cache, deps), []);
console.log("annotation flex gap overlays: 7 assertions passed");
