import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isStableAnnotationFrame } = require("../app/.vite/build/browser-page-preload/annotation-frame-stability.js");
const rootWindow = {};
const frame = (ownerWindow, resolved = undefined) => ({ ownerDocument: { defaultView: ownerWindow }, resolved, isFrame: true });
const dependencies = () => ({
  rootWindow,
  resolveAnnotationElement: (value) => value?.resolved,
  isFrameElement: (value) => value?.isFrame === true,
  getFrameElement: (value) => value?.frameElement ?? null,
  getOwnerWindow: (value) => value.ownerDocument.defaultView,
});
const top = { ownerDocument: { defaultView: rootWindow }, resolved: null };
top.resolved = top;
assert.equal(isStableAnnotationFrame(top, dependencies()), true, "top-level candidate");
const innerWindow = { frameElement: frame(rootWindow) };
const nested = { ownerDocument: { defaultView: innerWindow }, resolved: null };
nested.resolved = nested;
assert.equal(isStableAnnotationFrame(nested, dependencies()), true, "stable frame chain");
assert.equal(isStableAnnotationFrame({ ...nested, resolved: {} }, dependencies()), false, "resolved mismatch");
innerWindow.frameElement.isFrame = false;
assert.equal(isStableAnnotationFrame(nested, dependencies()), false, "non-frame owner");
assert.equal(isStableAnnotationFrame(null, dependencies()), false, "missing candidate");
console.log("5 preload annotation frame stability assertions passed");
