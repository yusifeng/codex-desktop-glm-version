import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { hasRunningAnnotationAnimation } = require(
  "../app/.vite/build/browser-page-preload/annotation-motion.js",
);
const element = (state = "idle") => ({
  getAnimations: () => [{ playState: state }],
  ownerDocument: { defaultView: null },
});
const parent = new Map();
const dependencies = {
  getParent: (value) => parent.get(value) ?? null,
  getFrameElement: (value) => value?.frameElement ?? null,
  isElement: (value) => value != null && typeof value.getAnimations === "function",
};
const child = element();
const ancestor = element("running");
parent.set(child, ancestor);
assert.equal(hasRunningAnnotationAnimation(child, dependencies), true, "ancestor animation");
assert.equal(hasRunningAnnotationAnimation(element("running"), dependencies), true, "local animation");
assert.equal(hasRunningAnnotationAnimation(element(), dependencies), false, "idle element");
parent.clear();
const frame = element("running");
const framed = element();
framed.ownerDocument.defaultView = { frameElement: frame };
assert.equal(hasRunningAnnotationAnimation(framed, dependencies), true, "frame animation");
assert.equal(hasRunningAnnotationAnimation(null, dependencies), false, "missing element");
console.log("5 preload annotation motion assertions passed");
