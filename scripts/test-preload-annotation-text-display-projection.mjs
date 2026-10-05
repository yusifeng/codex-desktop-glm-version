import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationTextDisplay } = require("../app/.vite/build/browser-page-preload/annotation-text-display-projection.js");
const annotation = { id: "a1", anchor: { kind: "text", value: "old" } };
assert.deepEqual(projectAnnotationTextDisplay(annotation), { ...annotation, selectionSourceIndexes: [0] });
assert.deepEqual(projectAnnotationTextDisplay(annotation, { kind: "text", value: "new" }).anchor, { kind: "text", value: "new" });
console.log("test-preload-annotation-text-display-projection: 2 assertions passed");
