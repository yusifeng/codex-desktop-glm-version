import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isStableAnnotationFrameChain } = require("../app/.vite/build/browser-page-preload/annotation-frame-chain-policy.js");
const root = {}; const frameWindow = {}; const frame = { ownerDocument: { defaultView: frameWindow } };
assert.equal(isStableAnnotationFrameChain(frame, { rootWindow: root, isFrameElement: (value) => value != null, getFrameElement: () => ({ ownerDocument: { defaultView: root } }), getOwnerWindow: (value) => value.ownerDocument.defaultView, resolveAnnotationElement: () => undefined }), true);
assert.equal(isStableAnnotationFrameChain({ ownerDocument: { defaultView: {} } }, { rootWindow: root, isFrameElement: () => false, getFrameElement: () => null, getOwnerWindow: () => root, resolveAnnotationElement: () => undefined }), false);
console.log("test-preload-annotation-frame-chain-policy: 2 assertions passed");
