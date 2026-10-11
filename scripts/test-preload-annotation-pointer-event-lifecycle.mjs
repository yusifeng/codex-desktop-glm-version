import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { installAnnotationPointerEventLifecycle } = require("../app/.vite/build/browser-page-preload/annotation-pointer-event-lifecycle.js");

const added = [];
const removed = [];
const documentLike = {
  addEventListener: (...args) => added.push(args),
  removeEventListener: (...args) => removed.push(args),
};
const windowLike = {
  addEventListener: (...args) => added.push(args),
  removeEventListener: (...args) => removed.push(args),
};
const handlers = Object.fromEntries([
  "pointerDown", "pointerMove", "pointerUp", "pointerCancel", "mouseMove", "mouseOut",
  "keyDown", "keyUp", "click", "contextMenu", "wheel", "blur", "auxiliary",
].map((name) => [name, () => {}]));
const dispose = installAnnotationPointerEventLifecycle({ documentLike, windowLike, auxiliaryEvents: ["dragstart", "dragend"], handlers });
assert.equal(added.length, 14);
assert.deepEqual(added.slice(0, 4).map(([type]) => type), ["pointerdown", "pointermove", "pointerup", "dragstart"]);
assert.equal(added.at(-1)[0], "blur");
dispose();
assert.equal(removed.length, 14);
assert.deepEqual(removed.slice(0, 4).map(([type]) => type), ["pointerdown", "pointermove", "pointerup", "dragstart"]);
console.log("15 preload annotation pointer-event-lifecycle assertions passed");
