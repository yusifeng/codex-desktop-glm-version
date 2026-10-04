import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationEditorAnchorState, normalizeAnnotationEditorPlacement } = require("../app/.vite/build/browser-page-preload/annotation-editor-view-state.js");

let reads = 0;
const element = { id: "target" };
const state = createAnnotationEditorAnchorState(element, { x: 12, y: 20 }, {
  readViewportSize: () => ({ width: 800, height: 600 }),
  readElementRect: (value) => value === element ? { x: 1, y: 2, width: 40, height: 30 } : null,
  buildAnchor: (value, rect, point, fixed, width) => ({ kind: "element", value, rect, point, fixed, width }),
  isFixed: () => true,
  readThemeVariant: () => "dark",
});
assert.equal(state.anchor.fixed, true);
assert.equal(state.anchor.width, 800);
assert.deepEqual(state.viewportPoint, { x: 12, y: 20 });
assert.equal(state.themeVariant, "dark");

const kept = normalizeAnnotationEditorPlacement({ ...state, anchor: { kind: "element", pageUrl: "same" } }, element, {
  isCurrentPage: (url) => url === "same",
  isTextAnchorResolved: () => true,
  clipAnchor: () => ({ x: 0, y: 0 }),
});
assert.equal(kept.placement, undefined);

const hidden = normalizeAnnotationEditorPlacement({ ...state, anchor: { kind: "element", pageUrl: "other" } }, element, {
  isCurrentPage: () => false,
  isTextAnchorResolved: () => true,
  clipAnchor: () => { reads += 1; return { x: 0, y: 0 }; },
});
assert.equal(hidden.placement, "top-left");
assert.equal(reads, 0);

console.log("preload annotation editor view-state tests passed (7 assertions)");
