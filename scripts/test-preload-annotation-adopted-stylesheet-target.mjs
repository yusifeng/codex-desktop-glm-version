import assert from "node:assert/strict";
import { canUseAnnotationAdoptedStyleSheets } from "../app/.vite/build/browser-page-preload/annotation-adopted-stylesheet-target.js";
assert.equal(canUseAnnotationAdoptedStyleSheets({ nodeType: 9, adoptedStyleSheets: [] }), true);
assert.equal(canUseAnnotationAdoptedStyleSheets({ nodeType: 11, host: {}, adoptedStyleSheets: [] }), true);
assert.equal(canUseAnnotationAdoptedStyleSheets({ nodeType: 1, adoptedStyleSheets: [] }), false);
console.log("test-preload-annotation-adopted-stylesheet-target: 3 assertions passed");
