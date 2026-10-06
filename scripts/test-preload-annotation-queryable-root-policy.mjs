import assert from "node:assert/strict";
import { isAnnotationQueryableRoot } from "../app/.vite/build/browser-page-preload/annotation-queryable-root-policy.js";
const deps = { documentNodeType: 9, fragmentNodeType: 11 };
assert.equal(isAnnotationQueryableRoot({ nodeType: 9 }, deps), true);
assert.equal(isAnnotationQueryableRoot({ nodeType: 11, querySelectorAll() {} }, deps), true);
assert.equal(isAnnotationQueryableRoot({ nodeType: 11 }, deps), false);
assert.equal(isAnnotationQueryableRoot({ nodeType: 1, querySelectorAll() {} }, deps), false);
console.log(`test-preload-annotation-queryable-root-policy: 4 assertions passed`);
