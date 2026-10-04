import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { applyAnnotationScrollContainerClips } = createRequire(import.meta.url)("../app/.vite/build/browser-page-preload/annotation-anchor-clip-policy.js");
const container = { id: "clip" };
const rect = { x: 0, y: 0, width: 100, height: 100 };
const deps = {
  resolveContainer: (selector) => selector === ".clip" ? container : null,
  isContainingBlock: (value) => value === container,
  getStyle: () => ({ overflowX: "hidden", overflowY: "visible" }),
  isClippingOverflow: (value) => value === "hidden" || value === "clip",
  getViewportRect: () => ({ x: 25, y: -10, width: 50, height: 50 }),
};
assert.deepEqual(applyAnnotationScrollContainerClips(rect, [{ selector: ".clip" }], deps), { x: 25, y: 0, width: 50, height: 100 });
assert.deepEqual(applyAnnotationScrollContainerClips(rect, [{ selector: ".missing" }], deps), rect);
assert.deepEqual(applyAnnotationScrollContainerClips(rect, [{ selector: ".clip" }], { ...deps, isContainingBlock: () => false }), rect);
assert.equal(applyAnnotationScrollContainerClips({ x: 0, y: 0, width: 10, height: 10 }, [{ selector: ".clip" }], { ...deps, getViewportRect: () => ({ x: 20, y: 20, width: 5, height: 5 }) }), null);
assert.deepEqual(applyAnnotationScrollContainerClips(null, [{ selector: ".clip" }], deps), null);
console.log("test-preload-annotation-anchor-clip-policy: 5 assertions passed");
