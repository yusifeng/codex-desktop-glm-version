import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { reconcileAnnotationSurfaceFeatures } = require("../app/.vite/build/browser-page-preload/annotation-surface-feature-state.js");

let result = reconcileAnnotationSurfaceFeatures({ features: [], containerCount: 1, metadataTargetCount: 0, metadataRequested: false });
assert.deepEqual(result.features, ["containers"]);
assert.equal(result.changed, true);
result = reconcileAnnotationSurfaceFeatures({ features: ["metadata"], containerCount: 0, metadataTargetCount: 2, metadataRequested: false });
assert.deepEqual(result.features, ["metadata-with-targets"]);
assert.equal(result.changed, true);
result = reconcileAnnotationSurfaceFeatures({ features: ["metadata-with-targets"], containerCount: 0, metadataTargetCount: 0, metadataRequested: true });
assert.deepEqual(result.features, ["metadata"]);
assert.equal(result.changed, true);
result = reconcileAnnotationSurfaceFeatures({ features: ["metadata"], containerCount: 0, metadataTargetCount: 0, metadataRequested: false });
assert.deepEqual(result.features, []);
assert.equal(result.changed, true);
result = reconcileAnnotationSurfaceFeatures({ features: ["containers", "metadata"], containerCount: 1, metadataTargetCount: 0, metadataRequested: true });
assert.deepEqual(result.features, ["containers", "metadata"]);
assert.equal(result.changed, false);

console.log("test-preload-annotation-surface-feature-state: 10 assertions passed");
