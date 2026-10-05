import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationRuntimeMountState } = require("../app/.vite/build/browser-page-preload/annotation-runtime-mount-state.js");

const state = createAnnotationRuntimeMountState();
assert.equal(state.beginMount(), true);
assert.equal(state.beginMount(), false);
state.setPendingPreview({ id: "preview" });
const runtime = { id: "runtime" };
assert.equal(state.completeMount(runtime), true);
assert.equal(state.mountedRuntime, runtime);
assert.equal(state.pendingPreview, null);
assert.equal(state.retryAfterFailure(), false);
assert.equal(state.dispose(), runtime);
assert.equal(state.dispose(), null);
assert.equal(state.completeMount({}), false);
assert.equal(state.beginMount(), false);
console.log("test-preload-annotation-runtime-mount-state: 10 assertions passed");
