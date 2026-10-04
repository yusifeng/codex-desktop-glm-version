import assert from "node:assert/strict";
import { createRequire } from "node:module";

const {
  createInitialAnnotationContextState,
  resolveAnnotationSyncState,
  isAnnotationCommentModeActive,
} = createRequire(import.meta.url)("../app/.vite/build/browser-page-preload/annotation-context-state.js");

const intlConfig = { locale: "en-US" };
const initial = createInitialAnnotationContextState(intlConfig);
assert.equal(initial.interactionMode, "browse");
assert.equal(initial.annotationEditorMode, "comment");
assert.equal(initial.canUseTweaks, false);
assert.equal(initial.canUseSiteAnnotationApi, false);
assert.equal(initial.intlConfig, intlConfig);

const synced = resolveAnnotationSyncState({
  interactionMode: "comment",
  isAgentControllingBrowser: true,
  canUseTweaks: false,
  canUseAnnotationMultiSelect: true,
  siteAnnotationFeaturesEnabled: true,
  areAnnotationMarkersVisible: false,
  isAnnotationSuspended: true,
  viewportScale: 1.5,
  comments: [{ id: "c1" }],
}, true);
assert.equal(synced.interactionMode, "comment");
assert.equal(synced.canUseSiteAnnotationApi, true);
assert.equal(synced.canUseTweaks, false);
assert.equal(synced.canUseAnnotationMultiSelect, true);
assert.equal(synced.areAnnotationMarkersVisible, false);
assert.equal(synced.viewportScale, 1.5);
assert.equal(isAnnotationCommentModeActive(synced), true);

const defaults = resolveAnnotationSyncState(null, false);
assert.equal(defaults.interactionMode, "browse");
assert.equal(defaults.annotationEditorMode, "comment");
assert.equal(defaults.canUseTweaks, true);
assert.equal(defaults.canUseSiteAnnotationApi, false);
assert.equal(defaults.areAnnotationMarkersVisible, true);
assert.equal(defaults.viewportScale, 1);
assert.equal(isAnnotationCommentModeActive({ interactionMode: "comment", canUseSiteAnnotationApi: false }), false);

console.log("preload annotation context state assertions passed (20 assertions)");
