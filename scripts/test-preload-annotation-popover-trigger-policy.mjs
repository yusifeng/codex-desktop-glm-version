import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { triggerAnnotationPopoverAtPoint } = require("../app/.vite/build/browser-page-preload/annotation-popover-trigger-policy.js");
const root = {};
assert.equal(triggerAnnotationPopoverAtPoint({ x: 1, y: 2 }, root, { hitTest: () => ({}), isOverlay: () => false, open: (value, attribute) => value === root && attribute === "layer" ? "opened" : null, attribute: "layer" }), "opened");
assert.equal(triggerAnnotationPopoverAtPoint({ x: 1, y: 2 }, root, { hitTest: () => null, isOverlay: () => false, open: () => "opened", attribute: "layer" }), undefined);
assert.equal(triggerAnnotationPopoverAtPoint({ x: 1, y: 2 }, root, { hitTest: () => ({}), isOverlay: () => true, open: () => "opened", attribute: "layer" }), undefined);
console.log("3 preload annotation popover-trigger assertions passed");
