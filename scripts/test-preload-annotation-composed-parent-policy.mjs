import assert from "node:assert/strict";
import { getAnnotationComposedParent } from "../app/.vite/build/browser-page-preload/annotation-composed-parent-policy.js";
const slot = {}, parent = {}, host = {}, shadow = { host };
const deps = { getAssignedSlot: (value) => value.slot ?? null, getParentElement: (value) => value.parent ?? null, getRootNode: (value) => value.root ?? null, isShadowRoot: (value) => value === shadow };
assert.equal(getAnnotationComposedParent({ slot, parent }, deps), slot);
assert.equal(getAnnotationComposedParent({ parent }, deps), parent);
assert.equal(getAnnotationComposedParent({ root: shadow }, deps), host);
assert.equal(getAnnotationComposedParent({}, deps), null);
console.log(`test-preload-annotation-composed-parent-policy: 4 assertions passed`);
