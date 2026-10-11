import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { mergeAnnotationAnchorSelection } = require("../app/.vite/build/browser-page-preload/annotation-anchor-selection-merge.js");
const primary = { anchor: { kind: "element", id: "primary" } };
const current = { primary, additional: [] };

assert.deepEqual(mergeAnnotationAnchorSelection(current, { anchor: { kind: "element", id: "next" } }, true, { areEqual: () => false }), { primary, additional: [{ anchor: { kind: "element", id: "next" } }] });
assert.deepEqual(mergeAnnotationAnchorSelection(current, { anchor: { kind: "virtual" } }, false, { areEqual: () => false }), { primary: { anchor: { kind: "virtual" } }, additional: [] });
assert.equal(mergeAnnotationAnchorSelection({ primary, additional: [] }, primary, true, { areEqual: () => true }), null);

console.log("3 preload annotation anchor-selection assertions passed");
