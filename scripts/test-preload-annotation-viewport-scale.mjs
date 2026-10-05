import assert from "node:assert/strict";
import { getAnnotationInverseViewportScale } from "../app/.vite/build/browser-page-preload/annotation-viewport-scale.js";
assert.equal(getAnnotationInverseViewportScale(undefined), 1);
assert.equal(getAnnotationInverseViewportScale(0), 1);
assert.equal(getAnnotationInverseViewportScale(2), 0.5);
console.log("test-preload-annotation-viewport-scale: 3 assertions passed");
