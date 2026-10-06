import assert from "node:assert/strict";
import { isAnnotationShadowHostRoot, getAnnotationShadowHost } from "../app/.vite/build/browser-page-preload/annotation-shadow-host-policy.js";
const host = { kind: `element` };
const root = { nodeType: 11, host };
const deps = { fragmentNodeType: 11, isElement: (value) => value?.kind === `element` };
assert.equal(isAnnotationShadowHostRoot(root, deps), true);
assert.equal(isAnnotationShadowHostRoot({ nodeType: 11, host: {} }, deps), false);
assert.equal(getAnnotationShadowHost(root, { isShadowRoot: (value) => value === root }), host);
console.log(`test-preload-annotation-shadow-host-policy: 3 assertions passed`);
