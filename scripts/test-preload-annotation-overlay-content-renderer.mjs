import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { renderAnnotationOverlayContent } = require("../app/.vite/build/browser-page-preload/annotation-overlay-content-renderer.js");

const calls = [];
const node = (type, props, key) => ({ type, props, key });
const marker = { id: "comment-1" };
const tree = renderAnnotationOverlayContent({
  interactionEnabled: true,
  regionRecords: [{ anchor: { id: "region" }, key: "region-key" }],
  viewport: { width: 800, height: 600 }, zoomFactor: 2,
  additionalHighlights: [{ isPageAnnotation: false }], highlightBorderRadius: 4,
  highlightClassName: "active", removeHighlight: false, highlightRect: { x: 1 },
  draftHoverSnapshot: null, removeHover: false, linkedSelectionIndex: null,
  hasActiveSelection: false, pointer: { x: 10, y: 20 }, editor: null, nativeTextSelection: false,
  cursorMode: "comment", hotspotSize: { width: 10, height: 12 }, hotspot: { x: 1, y: 2 }, viewportScale: 1,
  textSelectionRects: [{ x: 1, y: 2, width: 3, height: 4 }], flexItemOverlays: [],
  metadataSnapshot: null, runtimeViewportScale: 1, markersEnabled: true, metadataSelection: null,
  draftMarkerPoint: null, draftCommentNumber: null, markersVisible: true,
  markerRecords: [{ anchor: {}, comment: marker, commentNumber: 1, key: "marker-key", savedSelectionIndex: 0 }],
  markerPoints: [{ x: 7, y: 8 }], sendToHost: (message) => calls.push(message.type),
  openPreview: (...args) => calls.push(["preview", ...args]), closePreview: (id) => calls.push(["close", id]),
  openEditor: (...args) => calls.push(["edit", ...args]),
}, {
  jsx: node, jsxs: node, Fragment: "Fragment", InteractionBlocker: "Blocker", HighlightLayer: "Highlight",
  SelectionCursor: "Cursor", MetadataOverlay: "Metadata", Marker: "Marker", SavedMarker: "SavedMarker",
  readAnchorRect: () => ({ x: 1, y: 1, width: 5, height: 5 }), clipAnchorRect: (_anchor, rect) => rect,
  regionClassName: () => "region", rectStyle: (rect) => rect,
});
assert.equal(tree.type, "Fragment");
assert.equal(tree.props.children.length, 8);
assert.equal(tree.props.children[0].type, "Blocker");
assert.equal(tree.props.children[1][0].props.className, "region");
assert.equal(tree.props.children[2].type, "Highlight");
assert.equal(tree.props.children[3].type, "Cursor");
assert.equal(tree.props.children[4][0].props.className, "text-selection-highlight");
const savedMarker = tree.props.children[7].props.children[2][0];
assert.equal(savedMarker.type, "SavedMarker");
savedMarker.props.onMouseEnter();
assert.equal(calls[0][0], "preview");
savedMarker.props.onMouseLeave();
assert.deepEqual(calls[1], ["close", "comment-1"]);
savedMarker.props.onClick({ isTrusted: true, preventDefault() {}, stopPropagation() {} });
assert.equal(calls[2][0], "edit");
assert.deepEqual(savedMarker.props.markerPoint, { x: 7, y: 8 });
console.log("12 preload annotation overlay-content-renderer assertions passed");
