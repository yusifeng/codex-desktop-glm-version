import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationHighlightRuntimeState, renderAnnotationRoot } = require("../app/.vite/build/browser-page-preload/annotation-highlight-render-owner.js");

let highlightInput;
const projection = projectAnnotationHighlightRuntimeState({
  textPreviewState: { anchor: { id: "text" }, selectionRects: [{ x: 1 }] },
  hasActiveSelection: true, active: { id: "active" }, activeElement: {}, activeAdditionalAnchors: [],
  editor: null, activeHighlightRect: { x: 2 }, hoveredSnapshot: null, metadataSnapshot: null,
  viewport: { width: 800, height: 600 },
}, {
  projectHighlightState: (input) => {
    highlightInput = input;
    return { highlightRect: { x: 3 }, isRemoveHover: true, highlightClassName: "active", highlightBorderRadius: 4, additionalHighlights: [1] };
  },
  readLiveElementRect: () => null, readAnchorRect: () => null,
  styleElementHighlight: () => null, styleRegionHighlight: () => null,
  clipHighlightRect: () => null, projectAdditionalHighlights: () => [],
  resolveEditorAnchor: () => null, splitEditorAnchor: () => null, isPageAnnotation: () => false,
});
assert.equal(highlightInput.viewportSize.width, 800);
assert.equal(projection.anchor.id, "text");
assert.deepEqual(projection.selectionRects, [{ x: 1 }]);
assert.deepEqual(projection.highlightRect, { x: 3 });
assert.equal(projection.isRemoveHover, true);
assert.equal(projection.highlightClassName, "active");
assert.equal(projection.highlightBorderRadius, 4);
assert.deepEqual(projection.additionalHighlights, [1]);

const node = (type, props) => ({ type, props });
const root = renderAnnotationRoot({
  intlConfig: { locale: "en" }, suspended: false, hasActiveSelection: false,
  interactionEnabled: true, nativeTextSelection: false, interactionStyle: { left: 1 }, content: "content",
  modifierActive: true, pointer: { x: 1 }, overlayStyle: { cursor: "none" }, stylesheet: ".root{}",
}, { jsx: node, jsxs: node, IntlProvider: "Intl", onIntlError() {}, InteractionLayer: "Layer" });
assert.equal(root.type, "Intl");
assert.equal(root.props.children.props["data-browser-comment-root"], true);
assert.equal(root.props.children.props["data-browser-comment-annotation-selection-modifier-active"], true);
assert.equal(root.props.children.props.children[1].type, "Layer");
console.log("12 preload annotation highlight-render-owner assertions passed");
