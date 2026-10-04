import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildAnnotationAnchorPayload,
  createAnnotationAnchorSelection,
  createAnnotationAnchorState,
  mergeAnnotationAnchorState,
  replaceAnnotationSelection,
  resolveAnnotationAnchorValue,
  resolveAnnotationLiveElement,
  resolveAnnotationSelection,
  splitAnnotationAnchorState,
} = require("../app/.vite/build/browser-page-preload/annotation-anchor-state.js");

const elementAnchor = { kind: "element", selector: "#save", framePath: [] };
const regionAnchor = { kind: "region", rect: { x: 1, y: 2, width: 3, height: 4 } };
const liveElement = { isConnected: true, ownerDocument: "doc" };
const dependencies = {
  resolveThemeVariant: () => "dark",
  readViewportSize: () => ({ width: 800, height: 600 }),
  resolveLiveElement: (anchor, id) => ({ anchor, id: id ?? null }),
};

const elementState = createAnnotationAnchorState(
  { anchor: elementAnchor, additionalAnchors: [regionAnchor], markerViewportPoint: { x: 8, y: 9 } },
  liveElement,
  dependencies,
);
assert.equal(elementState.type, "element");
assert.equal(elementState.additionalSelections[0].anchor, regionAnchor);
assert.deepEqual(elementState.viewportSize, { width: 800, height: 600 });

const virtualState = createAnnotationAnchorState(
  { anchor: { kind: "virtual", targetId: "v1" }, viewportSize: { width: 1, height: 2 } },
  null,
  dependencies,
);
assert.equal(virtualState.type, "virtual");
assert.deepEqual(virtualState.viewportSize, { width: 1, height: 2 });

const payload = buildAnnotationAnchorPayload(
  { target: { mode: "design" }, anchorState: { ...elementState, anchor: elementAnchor, additionalAnchors: [regionAnchor], viewportPoint: { x: 4, y: 5 } } },
  { resolveLiveElement: (anchor) => (anchor === elementAnchor ? liveElement : null) },
);
assert.equal(payload.anchor.type, "element");
assert.equal(payload.anchor.element, liveElement);

const split = splitAnnotationAnchorState(elementState);
assert.equal(split.primary.anchor, elementAnchor);
const merged = mergeAnnotationAnchorState(elementState, split, { themeVariant: "light" });
assert.equal(merged.themeVariant, "light");
assert.equal(merged.element, liveElement);

assert.equal(resolveAnnotationAnchorValue(elementState, { refreshElement: (_element, anchor) => ({ ...anchor, refreshed: true }) }).refreshed, true);
assert.equal(resolveAnnotationSelection(split.primary, { refreshElement: (_element, anchor) => ({ ...anchor, refreshed: true }) }).refreshed, true);

const fresh = { isConnected: true, ownerDocument: "doc" };
assert.equal(resolveAnnotationLiveElement(
  { ...elementState, value: elementAnchor, element: fresh },
  { isConnected: (value) => value.isConnected, ownerDocumentMatches: (value) => value.ownerDocument === "doc", resolveElement: () => null },
), fresh);

const replaced = replaceAnnotationSelection({ anchor: elementAnchor, additionalAnchors: [regionAnchor], markerViewportPoint: { x: 1, y: 1 } }, { kind: "text", text: "updated" }, 0);
assert.equal(replaced.anchor.kind, "text");
assert.deepEqual(replaced.additionalAnchors, [regionAnchor]);
assert.equal(replaced.markerViewportPoint, undefined);

console.log("test-preload-annotation-anchor-state: 10 assertions passed");
