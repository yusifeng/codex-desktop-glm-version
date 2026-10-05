import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationSelectionDisplayKey } = require("../app/.vite/build/browser-page-preload/annotation-selection-display-key.js");
const selection = { anchor: { kind: "element", framePath: ["a", "b"], selector: "#save", rect: { x: 2, y: 3 } } };
assert.equal(createAnnotationSelectionDisplayKey(selection, 0), "element:a>b:#save:2:3:0");
assert.equal(createAnnotationSelectionDisplayKey({ anchor: { kind: "region", framePath: [], elementPath: "0/1", rect: { x: 0, y: 0 } } }, 2), "region::0/1:0:0:2");
console.log("test-preload-annotation-selection-display-key: 2 assertions passed");
