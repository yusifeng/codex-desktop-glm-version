import assert from "node:assert/strict";
import { isAnnotationUniqueSelectorMatch } from "../app/.vite/build/browser-page-preload/annotation-unique-selector-policy.js";

const target = {};
const deps = { getRootNode: () => ({ root: true }), isQueryableRoot: (root) => root.root === true, queryAll: (_root, selector) => selector === `.target` ? [target] : [] };
assert.equal(isAnnotationUniqueSelectorMatch(target, `.target`, deps), true);
assert.equal(isAnnotationUniqueSelectorMatch({}, `.target`, deps), false);
assert.equal(isAnnotationUniqueSelectorMatch(target, `.missing`, deps), false);
assert.equal(isAnnotationUniqueSelectorMatch(target, `.target`, { ...deps, isQueryableRoot: () => false }), false);
console.log(`test-preload-annotation-unique-selector-policy: 4 assertions passed`);
