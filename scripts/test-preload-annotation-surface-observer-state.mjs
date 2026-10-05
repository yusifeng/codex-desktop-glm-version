import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationSurfaceObserverState } = require("../app/.vite/build/browser-page-preload/annotation-surface-observer-state.js");

const state = createAnnotationSurfaceObserverState();
assert.equal(state.disposed, false);
assert.equal(state.metadataRequested, false);
assert.equal(state.requestMetadata(), true);
assert.equal(state.requestMetadata(), false);
assert.equal(state.metadataRequested, true);
assert.equal(state.dispose(), true);
assert.equal(state.dispose(), false);
assert.equal(state.requestMetadata(), false);
assert.equal(state.disposed, true);
console.log("test-preload-annotation-surface-observer-state: 9 assertions passed");
