import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getAnnotationTargetLabel } = require("../app/.vite/build/browser-page-preload/annotation-target-label.js");
assert.equal(getAnnotationTargetLabel({ tagName: "BUTTON" }, { readAccessibleLabel: () => null }), "button", "tag fallback");
assert.equal(getAnnotationTargetLabel({ tagName: "DIV" }, { readAccessibleLabel: () => "Save" }), "div: Save", "accessible label");
assert.equal(getAnnotationTargetLabel({ tagName: "INPUT" }, { readAccessibleLabel: () => "" }), "input: ", "empty label preserved");
console.log("3 preload annotation target-label assertions passed");
