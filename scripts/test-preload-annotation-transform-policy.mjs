import assert from "node:assert/strict";
import { hasAnnotationAncestorTransform } from "../app/.vite/build/browser-page-preload/annotation-transform-policy.js";
const style = (transform = `none`, rotate = ``) => ({ transform, getPropertyValue: () => rotate });
const deps = { getStyle: (element) => element.style, getParent: (element) => element.parent ?? null, getShadowHost: () => null };
assert.equal(hasAnnotationAncestorTransform({ style: style(`matrix(1, 0, 0, 1, 0, 0)`), parent: { style: style(`rotate(1deg)`) } }, deps), true);
assert.equal(hasAnnotationAncestorTransform({ style: style(`matrix(1, 0, 0, 1, 0, 0)`) }, deps), false);
assert.equal(hasAnnotationAncestorTransform({ style: style(`matrix(1, 0.1, 0, 1, 0, 0)`) }, deps), true);
console.log(`test-preload-annotation-transform-policy: 3 assertions passed`);
