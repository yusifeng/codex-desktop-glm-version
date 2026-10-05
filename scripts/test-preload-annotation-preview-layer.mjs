import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationPreviewLayer } = require("../app/.vite/build/browser-page-preload/annotation-preview-layer.js");

class FakeElement {
  constructor(documentLike, name) {
    this.ownerDocument = documentLike;
    this.name = name;
    this.style = {};
    this.attributes = new Map();
    this.children = [];
    this.hidden = false;
    this.removed = false;
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  remove() { this.removed = true; }
}

const documentLike = {
  documentElement: { clientWidth: 640, clientHeight: 480 },
  defaultView: { innerWidth: 800, innerHeight: 600 },
  createElement(name) { return new FakeElement(documentLike, name); },
  createElementNS(_namespace, name) { return new FakeElement(documentLike, name); },
};
const layer = new FakeElement(documentLike, "layer");
const target = (id, x = 10) => ({
  element: { id },
  rect: { x, y: 20, width: 100, height: 40 },
  clipRect: { x: 0, y: 0, width: 200, height: 100 },
  style: { borderTopLeftRadius: "4px" },
});
const calls = [];
const runtime = createAnnotationPreviewLayer({ layer, color: "red" }, {
  cssText: "preview-css",
  buildRoundedRectPath(value) { calls.push(["path", value.element.id]); return `path-${value.element.id}`; },
  resolveCornerRadii() { return [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }, { x: 7, y: 8 }]; },
});
assert.equal(layer.style.color, "red");
assert.equal(layer.children[0].textContent, "preview-css");

const first = target("first");
runtime.update([first]);
assert.equal(layer.hidden, false);
assert.equal(calls.length, 1);
const clip = layer.children.find((child) => child.name === "div" && child.className === "annotation-feature-clip");
assert.ok(clip, "creates a clip layer for each target");
assert.equal(clip.style.left, "0px");
assert.equal(clip.children[0].style.borderTopLeftRadius, "1px 2px");
const mask = layer.children[1];
assert.equal(mask.children[0].attributes.get("width"), "800");
assert.equal(mask.children.length, 2, "mask includes one clipped path");

runtime.update([]);
assert.equal(layer.children[2].hidden, true);
assert.equal(clip.removed, true, "stale target layer is removed");
runtime.dispose();
assert.deepEqual(layer.children, []);
runtime.update([target("late")]);
assert.deepEqual(layer.children, [], "late update after dispose must not recreate preview nodes");
runtime.dispose();
assert.deepEqual(layer.children, [], "dispose is idempotent after teardown");
console.log("test-preload-annotation-preview-layer: 10 assertions passed");
