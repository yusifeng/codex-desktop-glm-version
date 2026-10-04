import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isClippingAnnotationOverflow, isScrollableAnnotationOverflow } = require("../app/.vite/build/browser-page-preload/annotation-overflow.js");
for (const value of ["auto", "scroll", "overlay"]) {
  assert.equal(isScrollableAnnotationOverflow(value), true, `${value} scrollable`);
  assert.equal(isClippingAnnotationOverflow(value), true, `${value} clipping`);
}
for (const value of ["clip", "hidden"]) {
  assert.equal(isScrollableAnnotationOverflow(value), false, `${value} not scrollable`);
  assert.equal(isClippingAnnotationOverflow(value), true, `${value} clipping`);
}
assert.equal(isClippingAnnotationOverflow("visible"), false, "visible overflow");
console.log("11 preload annotation overflow assertions passed");
