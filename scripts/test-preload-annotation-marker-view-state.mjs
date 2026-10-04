import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationMarkerViewState, projectAnnotationDraftViewState, projectAnnotationCommentViewState } = require("../app/.vite/build/browser-page-preload/annotation-marker-view-state.js");

const element = { connected: true };
const calls = [];
const deps = {
  readViewportSize: () => ({ width: 800, height: 600 }),
  readViewportRect: (anchor) => ({ anchor, from: "anchor" }),
  resolveTextAnchor: () => null,
  resolveMarkerPoint: (anchor, zoomFactor) => ({ x: zoomFactor, y: anchor.x ?? 2 }),
  isElementConnected: (value) => value?.connected === true,
  readElementRect: (value) => ({ value, from: "element" }),
  refreshElementAnchor: (value, anchor) => { calls.push([value, anchor]); return { ...anchor, refreshed: true }; },
  readThemeVariant: () => "dark",
  resolveLiveElement: () => element,
  readCardViewportRect: (rect, options) => ({ rect, options }),
  readCommentTheme: (comment) => comment.themeVariant,
};
const marker = projectAnnotationMarkerViewState({ anchor: { kind: "element", x: 9 }, markerViewportPoint: { x: 1, y: 2 } }, 2, deps);
assert.equal(marker.anchor.refreshed, true);
assert.deepEqual(marker.viewportSize, { width: 800, height: 600 });
assert.equal(calls.length, 1);
const region = projectAnnotationMarkerViewState({ anchor: { kind: "region", x: 4 }, additionalAnchors: [{ kind: "region" }] }, 1, deps);
assert.equal(region.additionalAnchors.length, 1);
const draft = projectAnnotationDraftViewState({ anchor: { type: "element", value: { kind: "element", x: 1 }, element, additionalSelections: [], themeVariant: "light" }, target: { mode: "design" } }, 2, 3, deps);
assert.equal(draft.themeVariant, "light");
assert.equal(draft.cardViewportRect.options.viewportScale, 3);
const comment = projectAnnotationCommentViewState({ target: { mode: "edit", commentId: "c1" }, anchor: { type: "element", value: { kind: "element", x: 5 }, additionalSelections: [] } }, [{ id: "c1", themeVariant: "blue" }], "c1", 1, deps);
assert.equal(comment.themeVariant, "blue");
assert.equal(projectAnnotationCommentViewState({ target: { commentId: "missing" }, anchor: { type: "text", value: {} } }, [], undefined, 1, deps), null);
console.log("preload annotation marker view-state tests passed (11 assertions)");
