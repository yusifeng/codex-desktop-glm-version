import assert from "node:assert/strict";
import { isAnnotationShadowRoot } from "../app/.vite/build/browser-page-preload/annotation-shadow-root-policy.js";

const deps = { documentFragmentNodeType: 11, isElement: (value) => value?.kind === `element` };
const root = { nodeType: 11, host: { kind: `element` } };
root.host.shadowRoot = root;
assert.equal(isAnnotationShadowRoot(root, deps), true);
assert.equal(isAnnotationShadowRoot({ nodeType: 11, host: { kind: `element`, shadowRoot: {} } }, deps), false);
assert.equal(isAnnotationShadowRoot({ nodeType: 9, host: root.host }, deps), false);
assert.equal(isAnnotationShadowRoot(null, deps), false);
console.log(`test-preload-annotation-shadow-root-policy: 4 assertions passed`);
