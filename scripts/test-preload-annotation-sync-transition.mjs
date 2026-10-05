import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getAnnotationSyncTransition } = require("../app/.vite/build/browser-page-preload/annotation-sync-transition.js");

assert.deepEqual(getAnnotationSyncTransition({
  interactionMode: "comment",
  canUseSiteAnnotationApi: true,
  canUseAnnotationMultiSelect: true,
}), {
  disposeFeatures: false,
  clearSiteAnnotationRequests: false,
  clearPreview: false,
  exitCommentMode: false,
  clearSelection: false,
  clearMarkers: false,
});

const disabled = getAnnotationSyncTransition({
  canUseSiteAnnotationApi: false,
  siteAnnotationFeaturesEnabled: false,
  isAgentControllingBrowser: true,
  interactionMode: "comment",
});
assert.equal(disabled.disposeFeatures, true);
assert.equal(disabled.clearSiteAnnotationRequests, true);
assert.equal(disabled.clearPreview, true);
assert.equal(disabled.clearSelection, true);

const suspended = getAnnotationSyncTransition({
  interactionMode: "comment",
  isAnnotationSuspended: true,
  areAnnotationMarkersVisible: false,
  canUseAnnotationMultiSelect: true,
});
assert.equal(suspended.exitCommentMode, true);
assert.equal(suspended.clearMarkers, true);
assert.equal(suspended.clearSelection, false);

const browse = getAnnotationSyncTransition({ interactionMode: "browse" });
assert.equal(browse.exitCommentMode, true);
assert.equal(browse.clearSelection, true);
assert.equal(browse.clearMarkers, false);

const empty = getAnnotationSyncTransition(null);
assert.equal(empty.disposeFeatures, false);
assert.equal(empty.exitCommentMode, true);

console.log("test-preload-annotation-sync-transition: 19 assertions passed");
