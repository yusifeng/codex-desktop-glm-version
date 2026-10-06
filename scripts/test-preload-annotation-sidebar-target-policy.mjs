import assert from "node:assert/strict";
import { isAnnotationSidebarTarget } from "../app/.vite/build/browser-page-preload/annotation-sidebar-target-policy.js";
const child = {}, shadowChild = {}, root = { contains: (value) => value === child, shadowRoot: { contains: (value) => value === shadowChild } };
assert.equal(isAnnotationSidebarTarget(child, { getRoot: () => root }), true);
assert.equal(isAnnotationSidebarTarget(shadowChild, { getRoot: () => root }), true);
assert.equal(isAnnotationSidebarTarget({}, { getRoot: () => null }), false);
console.log(`test-preload-annotation-sidebar-target-policy: 3 assertions passed`);
