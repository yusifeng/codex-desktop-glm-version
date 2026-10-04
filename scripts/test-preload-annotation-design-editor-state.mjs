import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationDesignEditorState } = require("../app/.vite/build/browser-page-preload/annotation-design-editor-state.js");
const deps = {
  readElementSnapshot: () => ({ styles: [{ property: "color", value: "red" }] }),
  readElementText: () => ({ previousValue: "old", value: "new" }),
  mergeStyles: (styles, declarations) => [...styles, ...declarations],
  projectProvenance: (styles) => styles.map(({ property }) => ({ property })),
  readControlValue: ({ currentValue }) => currentValue,
  readTargetLabel: (element) => element.label,
  randomId: () => "design-fixed",
};
const element = { tagName: "BUTTON", label: "Save" };
const state = createAnnotationDesignEditorState(element, {
  anchor: { kind: "element", selector: ".save" }, viewportPoint: { x: 1, y: 2 }, viewportSize: { width: 10, height: 20 }, themeVariant: "dark",
}, { controls: [{ callback: "set", currentValue: "red" }] }, null, deps);
assert.equal(state.id, "design-fixed");
assert.equal(state.targetLabel, "Save");
assert.equal(state.elementTagName, "button");
assert.deepEqual(state.text, { previousValue: "old", value: "new" });
assert.deepEqual(state.provenance, [{ property: "color" }]);
const virtual = createAnnotationDesignEditorState(null, { anchor: { kind: "virtual", elementName: "Canvas" }, viewportPoint: null, viewportSize: null }, null, null, deps);
assert.equal(virtual.targetLabel, "Canvas");
console.log("6 preload annotation design-editor-state assertions passed");
