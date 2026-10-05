import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationPreloadDisposal } = require("../app/.vite/build/browser-page-preload/annotation-preload-disposal.js");

const calls = [];
const disposal = createAnnotationPreloadDisposal({
  disposeFeatures: () => calls.push("features"),
  clearPreview: () => calls.push("preview"),
  setFeatureApiAvailable: (value) => calls.push(["capability", value]),
});
assert.equal(disposal.disposed, false);
disposal.dispose();
assert.deepEqual(calls, ["features", "preview", ["capability", false]]);
assert.equal(disposal.disposed, true);
disposal.dispose();
assert.deepEqual(calls, ["features", "preview", ["capability", false], "features", "preview", ["capability", false]]);
assert.equal(disposal.disposed, true);
console.log("test-preload-annotation-preload-disposal: 6 assertions passed");
