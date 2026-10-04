import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isAnnotationContainedBy } = require("../app/.vite/build/browser-page-preload/annotation-containment.js");
const rootWindow = { getComputedStyle: (element) => element.style ?? {} };
const node = (style = {}) => ({ ownerDocument: { defaultView: rootWindow }, style });
const parent = new Map();
const dependencies = {
  getOwnerWindow: (element) => element.ownerDocument.defaultView,
  getComputedStyle: (_window, element) => element.style ?? {},
  getParent: (element) => parent.get(element) ?? null,
  getFrameElement: () => null,
  isElement: (value) => value != null,
};
const target = node();
const ancestor = node();
const child = node();
parent.set(child, ancestor);
parent.set(ancestor, target);
assert.equal(isAnnotationContainedBy(child, target, dependencies), true, "matching ancestor");
assert.equal(isAnnotationContainedBy(child, node(), dependencies), false, "unrelated target");
child.style = { position: "fixed" };
assert.equal(isAnnotationContainedBy(child, target, dependencies), false, "position boundary");
child.style = {};
ancestor.style = { contain: "size" };
assert.equal(isAnnotationContainedBy(child, node(), dependencies), false, "contain boundary");
assert.equal(isAnnotationContainedBy(null, target, dependencies), false, "missing element");
console.log("5 preload annotation containment assertions passed");
