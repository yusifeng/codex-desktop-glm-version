import assert from "node:assert/strict";
import { isAnnotationClippingBoundary } from "../app/.vite/build/browser-page-preload/annotation-clipping-boundary-policy.js";

const deps = { getStyle: (element) => element, isClippingOverflow: (value) => [`hidden`, `clip`, `auto`, `scroll`, `overlay`].includes(value) };
assert.equal(isAnnotationClippingBoundary({ overflow: `visible`, overflowX: `hidden`, overflowY: `visible` }, deps), true);
assert.equal(isAnnotationClippingBoundary({ overflow: `visible`, overflowX: `visible`, overflowY: `visible` }, deps), false);
assert.equal(isAnnotationClippingBoundary({ overflow: `auto` }, deps), true);
console.log(`test-preload-annotation-clipping-boundary-policy: 3 assertions passed`);
