import assert from "node:assert/strict";
import { shouldSuppressAnnotationRegionOverlay } from "../app/.vite/build/browser-page-preload/annotation-overlay-policies.js";

const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const region = (id) => ({ kind: "region", id });
const deps = { getEditorSelections: () => ({ primary: { anchor: region("a") }, additional: [] }), anchorsEqual: equal };
assert.equal(shouldSuppressAnnotationRegionOverlay({ id: "active" }, null, { id: "active" }, deps), true);
assert.equal(shouldSuppressAnnotationRegionOverlay({ id: "other", anchor: region("z") }, null, { id: "active" }, deps), false);
assert.equal(shouldSuppressAnnotationRegionOverlay({ anchor: region("a") }, { anchor: { type: "element" }, target: { mode: "create" } }, null, deps), true);
assert.equal(shouldSuppressAnnotationRegionOverlay({ anchor: { kind: "text" } }, { anchor: { type: "text" }, target: { mode: "create" } }, null, deps), false);
assert.equal(shouldSuppressAnnotationRegionOverlay({ anchor: region("z"), additionalAnchors: [region("a")] }, { anchor: { type: "element" }, target: { mode: "create" } }, null, deps), true);
assert.equal(shouldSuppressAnnotationRegionOverlay({ anchor: region("a") }, { anchor: { type: "element" }, target: { mode: "edit" } }, null, deps), false);
assert.equal(shouldSuppressAnnotationRegionOverlay({ anchor: region("a") }, { anchor: { type: "element" }, target: { mode: "create" } }, null, { ...deps, getEditorSelections: () => ({ primary: { anchor: region("z") }, additional: [] }) }), false);
console.log("test-preload-annotation-overlay-policies: 7 assertions passed");
