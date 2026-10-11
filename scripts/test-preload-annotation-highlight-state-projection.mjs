import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationHighlightState } = require("../app/.vite/build/browser-page-preload/annotation-highlight-state-projection.js");

const viewport = { width: 800, height: 600 };
const calls = [];
const deps = {
  readLiveElementRect: () => ({ rect: { x: 1 }, borderRadius: "4px" }),
  readAnchorRect: (anchor) => ({ anchor, x: 2 }),
  styleElementHighlight: () => "element-highlight",
  styleRegionHighlight: () => "region-highlight",
  clipHighlightRect: (anchor, rect, element) => ({ anchor, rect, element }),
  projectAdditionalHighlights: (selections, _viewport, options) => {
    calls.push({ selections, options });
    return selections.map((selection) => ({ selection }));
  },
  resolveEditorAnchor: (anchor) => anchor.value,
  splitEditorAnchor: (anchor) => ({ primary: anchor.value, additional: anchor.additionalSelections }),
  isPageAnnotation: () => true,
};

const activeElement = { kind: "comment", annotation: { anchor: { kind: "element" }, viewportSize: viewport } };
const active = projectAnnotationHighlightState({
  hasActiveSelection: true,
  active: activeElement,
  activeElement: { id: "live" },
  activeAdditionalAnchors: [{ kind: "element" }],
  editor: null,
  activeHighlightRect: null,
  hoveredSnapshot: null,
  metadataSnapshot: null,
  viewport,
  viewportSize: viewport,
}, deps);
assert.equal(active.highlightClassName, "element-highlight");
assert.equal(active.isRemoveHover, true);
assert.equal(active.highlightBorderRadius, "4px");
assert.equal(active.additionalHighlights.length, 1);

const region = projectAnnotationHighlightState({
  hasActiveSelection: true,
  active: { kind: "comment", annotation: { anchor: { kind: "region" }, viewportSize: viewport } },
  activeElement: null,
  activeAdditionalAnchors: [],
  editor: null,
  activeHighlightRect: null,
  hoveredSnapshot: null,
  metadataSnapshot: null,
  viewport,
  viewportSize: viewport,
}, deps);
assert.equal(region.highlightClassName, "region-highlight");
assert.equal(region.isRemoveHover, false);

const editor = projectAnnotationHighlightState({
  hasActiveSelection: false,
  active: null,
  activeElement: null,
  activeAdditionalAnchors: [],
  editor: { target: { mode: "create" }, anchor: { type: "element", value: { kind: "element" }, element: { id: "editor" }, additionalSelections: [], viewportSize: viewport } },
  activeHighlightRect: null,
  hoveredSnapshot: null,
  metadataSnapshot: null,
  viewport,
  viewportSize: viewport,
}, deps);
assert.equal(editor.highlightClassName, "element-highlight");
assert.equal(editor.isRemoveHover, true);

const hovered = projectAnnotationHighlightState({
  hasActiveSelection: false,
  active: null,
  activeElement: null,
  activeAdditionalAnchors: [],
  editor: null,
  activeHighlightRect: null,
  hoveredSnapshot: { rect: { x: 9 }, borderRadius: "8px" },
  metadataSnapshot: null,
  viewport,
  viewportSize: viewport,
}, deps);
assert.equal(hovered.highlightClassName, "element-highlight");
assert.deepEqual(hovered.highlightRect, { x: 9 });

const metadata = projectAnnotationHighlightState({
  hasActiveSelection: false,
  active: null,
  activeElement: null,
  activeAdditionalAnchors: [],
  editor: { target: { mode: "design" }, anchor: { type: "virtual" } },
  activeHighlightRect: null,
  hoveredSnapshot: null,
  metadataSnapshot: { rect: { x: 4 }, borderRadius: "2px" },
  viewport,
  viewportSize: viewport,
}, deps);
assert.deepEqual(metadata.highlightRect, { x: 4 });

console.log("10 preload annotation highlight-state projection assertions passed");
