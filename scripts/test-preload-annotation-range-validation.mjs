import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isAnnotationRangeSelectable } = require("../app/.vite/build/browser-page-preload/annotation-range-validation.js");

const text = (value, parent) => ({ nodeType: 3, textContent: value, parentElement: parent, assignedSlot: null });
const root = { nodeType: 1 };
const first = text("first", root);
const second = text("second", root);
const range = { commonAncestorContainer: root, startContainer: first, startOffset: 0, endContainer: second, endOffset: 3, intersectsNode: (node) => node === first || node === second };
const deps = {
  createTextWalker: () => { let index = 0; return { nextNode: () => [first, second][index++] ?? null }; },
  isTextNode: (node) => node?.nodeType === 3,
  getTextContent: (node) => node.textContent,
  getAssignedSlot: (node) => node.assignedSlot,
  getParentElement: (node) => node.parentElement,
  intersectsNode: (value, node) => value.intersectsNode(node),
  isVisibleElement: () => true,
};
assert.equal(isAnnotationRangeSelectable(range, deps), true);
assert.equal(isAnnotationRangeSelectable(range, { ...deps, isVisibleElement: (element) => element !== root }), false);
assert.equal(isAnnotationRangeSelectable({ ...range, commonAncestorContainer: first }, deps), true);
console.log("3 preload annotation range validation assertions passed");
