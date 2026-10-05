import assert from "node:assert/strict";

import { isAnnotationElementVisibleByPolicy } from "../app/.vite/build/browser-page-preload/annotation-element-visibility-policy.js";

const root = { style: { display: `block`, visibility: `visible`, opacity: `1` } };
const child = { style: root.style, parent: root };
const deps = {
  getParent: (value) => value.parent ?? null,
  getComputedStyle: (value) => value.style,
};

assert.equal(isAnnotationElementVisibleByPolicy(child, deps), true);
assert.equal(
  isAnnotationElementVisibleByPolicy({ style: { display: `none` }, parent: root }, deps),
  false,
);
assert.equal(
  isAnnotationElementVisibleByPolicy(
    { style: root.style },
    { ...deps, checkVisibility: () => false },
  ),
  false,
);

console.log(`test-preload-annotation-element-visibility-policy: 3 assertions passed`);
