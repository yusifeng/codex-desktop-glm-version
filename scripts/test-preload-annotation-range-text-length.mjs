import assert from "node:assert/strict";
import { getAnnotationRangeTextLength } from "../app/.vite/build/browser-page-preload/annotation-range-text-length.js";
const range = { selectNodeContents: () => {}, setEnd: () => {}, toString: () => `hello` };
const deps = { createRange: () => range };
assert.equal(getAnnotationRangeTextLength({}, {}, 2, deps), 5);
assert.equal(getAnnotationRangeTextLength({}, {}, -1, { createRange: () => ({ selectNodeContents: () => { throw new Error(`invalid`); } }) }), null);
console.log(`test-preload-annotation-range-text-length: 2 assertions passed`);
