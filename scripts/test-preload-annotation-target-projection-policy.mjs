import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { projectAnnotationTarget } = require("../app/.vite/build/browser-page-preload/annotation-target-projection-policy.js");
const element = {};
const fallback = {};
const annotation = {};
const base = { isOverlay: () => false, isRoot: () => false, getContainerAncestor: () => null, resolveFallback: () => fallback, resolveAnnotation: () => annotation };
assert.equal(projectAnnotationTarget(element, {}, "design", true, base), fallback);
assert.equal(projectAnnotationTarget(element, {}, "annotation", true, base), annotation);
assert.equal(projectAnnotationTarget(element, {}, "annotation", true, { ...base, isOverlay: (value) => value === element }), null);
assert.equal(projectAnnotationTarget(element, {}, "annotation", true, { ...base, isRoot: () => true, getContainerAncestor: () => ({}) }), null);

console.log("4 preload annotation target-projection assertions passed");
