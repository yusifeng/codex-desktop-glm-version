import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveAnnotationFrameWindow } = require("../app/.vite/build/browser-page-preload/annotation-frame-window-resolver.js");
const rootWindow = { id: "root" };
const rootDocument = { id: "root-document" };
const childWindow = { id: "child", document: { id: "child-document" } };
const frame = { id: "frame" };

assert.equal(resolveAnnotationFrameWindow([], {
  getRootWindow: () => rootWindow,
  getRootDocument: () => rootDocument,
  resolveFrameElement: () => frame,
  getFrameWindow: () => childWindow,
  getDocument: (value) => value.document,
}), rootWindow);
assert.equal(resolveAnnotationFrameWindow(["frame"], {
  getRootWindow: () => rootWindow,
  getRootDocument: () => rootDocument,
  resolveFrameElement: (documentLike, selector) => { assert.equal(documentLike, rootDocument); assert.equal(selector, "frame"); return frame; },
  getFrameWindow: () => childWindow,
  getDocument: (value) => value.document,
}), childWindow);
assert.equal(resolveAnnotationFrameWindow(["missing"], {
  getRootWindow: () => rootWindow,
  getRootDocument: () => rootDocument,
  resolveFrameElement: () => null,
  getFrameWindow: () => childWindow,
  getDocument: (value) => value.document,
}), null);

console.log("3 preload annotation frame-window assertions passed");
