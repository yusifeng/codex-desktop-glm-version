import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationRequestContext, isAnnotationRequestAllowed } = require(
  "../app/.vite/build/browser-page-preload/annotation-request-context.js",
);

const documentRef = { createRange() {
  return {
    collapsed: false,
    setStart(node, offset) { this.start = [node, offset]; },
    setEnd(node, offset) { this.end = [node, offset]; },
    toString() { return "selected"; },
  };
} };
const windowRef = { innerWidth: 100, innerHeight: 80 };
const globalLike = { isSecureContext: true };
const state = { canUseSiteAnnotationApi: true, hasActiveEditor: false, isAgentControllingBrowser: false, canUseTweaks: true };
assert.equal(isAnnotationRequestAllowed(state, globalLike), true);
assert.equal(isAnnotationRequestAllowed({ ...state, hasActiveEditor: true }, globalLike), false);
assert.equal(isAnnotationRequestAllowed(state, { isSecureContext: false }), false);

const root = { childNodes: [] };
const first = { ownerDocument: documentRef };
const second = { ownerDocument: documentRef };
root.childNodes = [first, second];
const context = createAnnotationRequestContext({
  documentRef,
  windowRef,
  globalLike,
  isRange: (value) => value?.kind === "range",
  isHTMLElement: (value) => value?.kind === "element",
  isExcludedElement: (value) => value?.excluded === true,
  getVisibleRect: (value) => value?.rect ?? null,
  resolveRangeAnchor: () => ({ viewportPoint: { x: 14, y: 22 } }),
  getRangeClientRects: (value) => value.rects ?? [],
  isRangeSelectable: () => true,
});
const serialized = context.resolveSerializedRange(root, {
  startPath: [0], endPath: [1], startOffset: 0, endOffset: 3, rangeText: "selected",
});
assert.ok(serialized);
assert.equal(context.resolveSerializedRange(root, {
  startPath: [9], endPath: [1], startOffset: 0, endOffset: 3, rangeText: "selected",
}), null);

const element = { kind: "element", ownerDocument: documentRef, isConnected: true, rect: { x: 10, y: 12, width: 20, height: 16 } };
assert.deepEqual(context.resolveTarget({ target: element, request: {} }, state), { x: 20, y: 20 });
assert.equal(context.resolveTarget({ target: { ...element, rect: { x: 120, y: 0, width: 4, height: 4 } }, request: {} }, state), null);
assert.equal(context.resolveTarget({ target: { ...element, excluded: true }, request: {} }, state), null);

const range = {
  kind: "range",
  commonAncestorContainer: element,
  startContainer: first,
  rects: [{ x: 2, y: 3, width: 4, height: 5 }],
  toString: () => "selected",
};
assert.deepEqual(context.resolveTarget({ target: range, request: {}, rangeText: "selected" }, state), { x: 14, y: 22 });
assert.equal(context.resolveTarget({ target: range, request: {}, rangeText: "different" }, state), null);
console.log("8 preload annotation request context assertions passed");
