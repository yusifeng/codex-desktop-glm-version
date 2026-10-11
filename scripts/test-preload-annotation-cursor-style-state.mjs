import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { applyAnnotationCursorStyle, restoreAnnotationCursorStyle } = require("../app/.vite/build/browser-page-preload/annotation-cursor-style-state.js");
const state = new WeakMap();
const documentLike = {};
const style = { value: "pointer", priority: "", getPropertyValue: () => style.value, getPropertyPriority: () => style.priority, setProperty: (_name, value, priority) => { style.value = value; style.priority = priority; } };
const element = { ownerDocument: documentLike, style };
applyAnnotationCursorStyle(element, state, (doc) => restoreAnnotationCursorStyle(doc, state));
assert.equal(style.value, "none");
restoreAnnotationCursorStyle(documentLike, state);
assert.equal(style.value, "pointer");
assert.equal(style.priority, "");
applyAnnotationCursorStyle(element, state, (doc) => restoreAnnotationCursorStyle(doc, state));
style.value = "crosshair";
restoreAnnotationCursorStyle(documentLike, state);
assert.equal(style.value, "crosshair");

console.log("3 preload annotation cursor-style assertions passed");
