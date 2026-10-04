import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { snapshotAnnotationDesign } = require("../app/.vite/build/browser-page-preload/annotation-design-snapshot.js");
const value = {
  id: "design-1", anchor: { kind: "element" }, annotationControls: [], annotationControlChanges: [],
  declarations: [], draftAttribute: "draft-1", markerViewportPoint: { x: 1, y: 2 }, provenance: [],
  selector: ".button", targetLabel: "button", elementTagName: "button", text: null,
  themeVariant: "dark", viewportSize: { width: 10, height: 20 }, extra: "ignored",
};
assert.deepEqual(snapshotAnnotationDesign(value), {
  id: "design-1", anchor: { kind: "element" }, annotationControls: [], annotationControlChanges: [],
  declarations: [], draftAttribute: "draft-1", markerViewportPoint: { x: 1, y: 2 }, provenance: [],
  selector: ".button", targetLabel: "button", elementTagName: "button", text: null,
  themeVariant: "dark", viewportSize: { width: 10, height: 20 },
}, "projects the stable snapshot fields");
assert.deepEqual(snapshotAnnotationDesign(value), snapshotAnnotationDesign(value), "pure projection");
console.log("2 preload annotation design-snapshot assertions passed");
