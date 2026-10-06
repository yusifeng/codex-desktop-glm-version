import assert from "node:assert/strict";
import { getAnnotationControlDefaultValue } from "../app/.vite/build/browser-page-preload/annotation-control-default-value.js";
assert.equal(getAnnotationControlDefaultValue({ defaultValue: `x`, type: `toggle` }), `x`);
assert.equal(getAnnotationControlDefaultValue({ type: `color` }), `#ffffff`);
assert.equal(getAnnotationControlDefaultValue({ type: `select`, options: [{ value: `a` }] }), `a`);
assert.equal(getAnnotationControlDefaultValue({ type: `range`, min: -2 }), -2);
assert.equal(getAnnotationControlDefaultValue({ type: `toggle` }), false);
console.log(`test-preload-annotation-control-default-value: 5 assertions passed`);
