import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationTargetLabel } = require("../app/.vite/build/browser-page-preload/annotation-target-label-policy.js");
const element = { tagName: "BUTTON" };
assert.equal(projectAnnotationTargetLabel(element, () => "Save"), "button: Save");
assert.equal(projectAnnotationTargetLabel(element, () => null), "button");
console.log("test-preload-annotation-target-label-policy: 2 assertions passed");
