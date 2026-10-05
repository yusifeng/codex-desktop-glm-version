import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationPreloadDisposalState } = require("../app/.vite/build/browser-page-preload/annotation-preload-disposal-state.js");

const state = createAnnotationPreloadDisposalState();
assert.equal(state.disposed, false);
assert.equal(state.beginDispose(), true);
assert.equal(state.disposed, true);
assert.equal(state.beginDispose(), false);
assert.equal(state.disposed, true);
console.log("test-preload-annotation-preload-disposal-state: 5 assertions passed");
