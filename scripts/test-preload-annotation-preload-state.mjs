import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationPreloadState } = require("../app/.vite/build/browser-page-preload/annotation-preload-state.js");

const state = createAnnotationPreloadState({ destroyed: 1, permissionGranted: true });
assert.deepEqual(state.snapshot(), {
  siteAnnotationApiAvailable: false,
  destroyed: false,
  hasActiveEditor: false,
  permissionGranted: true,
});
state.setSiteAnnotationApiAvailable(1);
state.setActiveEditor("yes");
state.setDestroyed();
state.setPermissionGranted(0);
assert.equal(state.siteAnnotationApiAvailable, false);
assert.equal(state.hasActiveEditor, false);
assert.equal(state.destroyed, true);
assert.equal(state.permissionGranted, false);
const snapshot = state.snapshot();
snapshot.destroyed = false;
assert.equal(state.destroyed, true);
state.setDestroyed(false);
assert.equal(state.destroyed, false);
assert.deepEqual(createAnnotationPreloadState().snapshot(), {
  siteAnnotationApiAvailable: false,
  destroyed: false,
  hasActiveEditor: false,
  permissionGranted: false,
});
console.log("test-preload-annotation-preload-state: 12 assertions passed");
