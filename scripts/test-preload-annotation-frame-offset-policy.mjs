import assert from "node:assert/strict";

import { getAnnotationFrameOffset } from "../app/.vite/build/browser-page-preload/annotation-frame-offset-policy.js";

const topWindow = {};
const parentWindow = {};
const frame = { ownerDocument: { defaultView: parentWindow }, rect: { left: 10, top: 20 } };
const deps = {
  currentWindow: topWindow,
  getFrameElement: (windowLike) => windowLike.frameElement,
  isFrameElement: (value) => value != null && value.rect != null,
  getParentWindow: (element) => element.ownerDocument.defaultView,
  getRect: (element) => element.rect,
  getParentOffset: (windowLike) => (windowLike === parentWindow ? { x: 3, y: 4 } : { x: 0, y: 0 }),
};

assert.deepEqual(getAnnotationFrameOffset(topWindow, deps), { x: 0, y: 0 });
assert.deepEqual(getAnnotationFrameOffset({ frameElement: frame }, deps), { x: 13, y: 24 });
assert.deepEqual(getAnnotationFrameOffset({ frameElement: {} }, deps), { x: 0, y: 0 });

console.log(`test-preload-annotation-frame-offset-policy: 3 assertions passed`);
