import assert from "node:assert/strict";
import { projectAnnotationRenderState } from "../app/.vite/build/browser-page-preload/annotation-render-state-projection.js";

const cache = new Map();
const overlays = [{ key: "overlay" }];
const hotspots = { add: { x: 1, y: 2 }, comment: { x: 3, y: 4 } };
const calls = [];
const deps = {
  collectFlexGapOverlays: (...args) => {
    calls.push(args);
    return overlays;
  },
};
const base = {
  hasActiveSelection: false,
  flexGapProperty: "gap",
  editor: { target: { mode: "create" }, anchor: { type: "element" } },
  activeAnnotation: null,
  elementCache: cache,
  showMetadata: true,
  hoverSnapshot: { id: "hover" },
  highlightRect: null,
  selectedComment: null,
  modifierActive: false,
  selectedPoint: null,
  hasLinkedDraftSelection: false,
  nativeTextSelection: false,
  hotspots,
};

const projected = projectAnnotationRenderState(base, deps);
assert.deepEqual(projected.flexItemOverlays, overlays);
assert.deepEqual(projected.draftHoverSnapshot, base.hoverSnapshot);
assert.equal(projected.metadataSnapshot, null);
assert.equal(projected.mode, "comment");
assert.deepEqual(projected.hotspot, hotspots.comment);
assert.equal(calls.length, 1);

const removeHover = projectAnnotationRenderState(
  { ...base, modifierActive: true, selectedPoint: { x: 1 }, hasLinkedDraftSelection: true },
  deps,
);
assert.equal(removeHover.isRemoveHover, true);
assert.equal(removeHover.mode, "add");
assert.deepEqual(removeHover.hotspot, hotspots.add);

const textMode = projectAnnotationRenderState({ ...base, nativeTextSelection: true }, deps);
assert.equal(textMode.mode, "text");
assert.deepEqual(textMode.hotspot, hotspots.comment);

const metadata = projectAnnotationRenderState(
  { ...base, editor: null, highlightRect: null, selectedComment: null },
  deps,
);
assert.deepEqual(metadata.metadataSnapshot, base.hoverSnapshot);

const blocked = projectAnnotationRenderState({ ...base, hasActiveSelection: true }, deps);
assert.deepEqual(blocked.flexItemOverlays, []);
assert.equal(blocked.draftHoverSnapshot, null);
assert.equal(blocked.metadataSnapshot, null);

console.log("12 preload annotation render-state projection assertions passed");
