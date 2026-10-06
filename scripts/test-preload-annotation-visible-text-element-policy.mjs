import assert from "node:assert/strict";
import { isAnnotationVisibleTextElement } from "../app/.vite/build/browser-page-preload/annotation-visible-text-element-policy.js";
const deps = { hasExcludedAncestor: (element) => element.excluded === true, getStyle: (element) => element.style ?? {} };
assert.equal(isAnnotationVisibleTextElement({ style: { display: `block`, visibility: `visible`, opacity: `1` } }, deps), true);
assert.equal(isAnnotationVisibleTextElement({ excluded: true, style: { display: `block` } }, deps), false);
assert.equal(isAnnotationVisibleTextElement({ style: { display: `none` } }, deps), false);
console.log(`test-preload-annotation-visible-text-element-policy: 3 assertions passed`);
