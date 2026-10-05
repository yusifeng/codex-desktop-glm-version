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
assert.equal(disposal.dispose(), true);
assert.deepEqual(calls, ["features", "preview", ["capability", false]]);
assert.equal(disposal.disposed, false);
assert.equal(disposal.dispose(), true);
assert.deepEqual(calls, ["features", "preview", ["capability", false], "features", "preview", ["capability", false]]);
assert.equal(disposal.disposeTerminal(), true);
assert.equal(disposal.disposed, true);
assert.equal(disposal.disposeTerminal(), false);
assert.equal(disposal.dispose(), false);
assert.equal(calls.length, 9);
console.log("test-preload-annotation-preload-disposal: 10 assertions passed");
