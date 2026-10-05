import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { shouldResetAnnotationFeatureGraph } = require("../app/.vite/build/browser-page-preload/annotation-feature-lifecycle-state.js");

const empty = { controlsRegistry: null, siteAnnotationRequests: null, featureObserver: null, modeControllerDispose: null };
assert.equal(shouldResetAnnotationFeatureGraph(empty), false);
assert.equal(shouldResetAnnotationFeatureGraph({ ...empty, controlsRegistry: {} }), true);
assert.equal(shouldResetAnnotationFeatureGraph({ ...empty, siteAnnotationRequests: {} }), true);
assert.equal(shouldResetAnnotationFeatureGraph({ ...empty, featureObserver: {} }), true);
assert.equal(shouldResetAnnotationFeatureGraph({ ...empty, modeControllerDispose: () => {} }), true);
assert.equal(shouldResetAnnotationFeatureGraph({ ...empty, controlsRegistry: undefined }), false, "nullish semantics ignore absent handles only");
console.log("test-preload-annotation-feature-lifecycle-state: 6 assertions passed");
