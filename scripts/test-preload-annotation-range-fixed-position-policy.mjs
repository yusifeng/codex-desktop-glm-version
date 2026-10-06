import assert from "node:assert/strict";
import { isAnnotationRangeFixedPosition } from "../app/.vite/build/browser-page-preload/annotation-range-fixed-position-policy.js";
const body = {}, parent = { position: `fixed`, parentElement: body };
const deps = { isElement: (value) => value?.kind === `element`, getShadowHost: () => parent, getParent: (value) => value.parentElement ?? null, getStylePosition: (value) => value.position ?? `static`, getBody: () => body };
assert.equal(isAnnotationRangeFixedPosition({ kind: `element`, position: `static`, parentElement: parent }, deps), true);
assert.equal(isAnnotationRangeFixedPosition({ kind: `text` }, deps), true);
assert.equal(isAnnotationRangeFixedPosition({ kind: `element`, position: `static`, parentElement: body }, deps), false);
console.log(`test-preload-annotation-range-fixed-position-policy: 3 assertions passed`);
