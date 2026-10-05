import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveAnnotationContainmentFrameAncestor } = require("../app/.vite/build/browser-page-preload/annotation-containment-frame-policy.js");
const frame = {}; const view = {}; const candidate = {};
assert.equal(resolveAnnotationContainmentFrameAncestor(candidate, { getOwnerWindow: () => view, getFrameElement: () => frame, isElement: (value) => value === frame }), frame);
assert.equal(resolveAnnotationContainmentFrameAncestor(candidate, { getOwnerWindow: () => view, getFrameElement: () => null, isElement: () => false }), null);
console.log("test-preload-annotation-containment-frame-policy: 2 assertions passed");
