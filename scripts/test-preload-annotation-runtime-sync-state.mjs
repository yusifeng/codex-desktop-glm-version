import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationRuntimeSyncState } = require("../app/.vite/build/browser-page-preload/annotation-runtime-sync-state.js");

const comments = [{ id: "comment" }];
const intlConfig = { locale: "en" };
const state = projectAnnotationRuntimeSyncState({
  activeDesignChange: { id: "design" },
  comments,
  intlConfig,
  interactionMode: "comment",
  annotationEditorMode: undefined,
  isAgentControllingBrowser: false,
  canUseAnnotationMultiSelect: 1,
  canUseSiteAnnotationApi: true,
  canUseTweaks: undefined,
  isDesignModifierPressed: 1,
  isOriginalViewEnabled: 1,
  areAnnotationMarkersVisible: undefined,
  isAnnotationSuspended: 0,
  isTweaksEditorOpen: "yes",
  viewportScale: 0,
  zoomPercent: 125,
});
assert.deepEqual(state, {
  activeDesignChange: { id: "design" },
  comments,
  intlConfig,
  interactionMode: "comment",
  annotationEditorMode: "comment",
  isAgentControllingBrowser: false,
  canUseAnnotationMultiSelect: false,
  canUseSiteAnnotationApi: true,
  canUseTweaks: true,
  isDesignModifierPressed: false,
  isOriginalViewEnabled: false,
  areAnnotationMarkersVisible: true,
  isAnnotationSuspended: false,
  isTweaksEditorOpen: false,
  viewportScale: 0,
  zoomPercent: 125,
});

const defaults = projectAnnotationRuntimeSyncState({});
assert.equal(defaults.annotationEditorMode, "comment");
assert.equal(defaults.canUseTweaks, true);
assert.equal(defaults.areAnnotationMarkersVisible, true);
assert.equal(defaults.viewportScale, 1);

console.log("18 preload annotation runtime-sync-state assertions passed");
