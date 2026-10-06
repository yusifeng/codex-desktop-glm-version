import assert from "node:assert/strict";
import { isAnnotationMirrorMutation } from "../app/.vite/build/browser-page-preload/annotation-mirror-mutation-policy.js";
const deps = { isElement: (value) => value?.kind === `element`, hasMarker: (value) => value.marker === true };
assert.equal(isAnnotationMirrorMutation({ type: `childList`, addedNodes: [{ kind: `element`, marker: true }], removedNodes: [] }, deps), true);
assert.equal(isAnnotationMirrorMutation({ type: `attributes`, addedNodes: [{ kind: `element`, marker: true }] }, deps), false);
assert.equal(isAnnotationMirrorMutation({ type: `childList`, addedNodes: [{ kind: `element`, marker: false }], removedNodes: [] }, deps), false);
console.log(`test-preload-annotation-mirror-mutation-policy: 3 assertions passed`);
