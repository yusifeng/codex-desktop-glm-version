import assert from "node:assert/strict";
import { isTopLevelAnnotationRoot } from "../app/.vite/build/browser-page-preload/annotation-anchor-root-policy.js";
assert.equal(isTopLevelAnnotationRoot({ kind: `element`, framePath: [], elementPath: `html` }), true);
assert.equal(isTopLevelAnnotationRoot({ kind: `element`, framePath: [], elementPath: `div` }), false);
assert.equal(isTopLevelAnnotationRoot({ kind: `text`, framePath: [], elementPath: `body` }), false);
console.log("test-preload-annotation-anchor-root-policy: 3 assertions passed");
