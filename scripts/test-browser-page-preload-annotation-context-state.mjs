import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  createInitialAnnotationContextState,
  isAnnotationCommentModeActive,
  resolveAnnotationSyncState,
} = require("../app/.vite/build/browser-page-preload/annotation-context-state.js");

const intlConfig = { locale: "en" };
assert.deepEqual(createInitialAnnotationContextState(intlConfig), {
  interactionMode: "browse",
  annotationEditorMode: "comment",
  isAgentControllingBrowser: false,
  canUseTweaks: false,
  canUseAnnotationMultiSelect: false,
  canUseSiteAnnotationApi: false,
  isDesignModifierPressed: false,
  isTweaksEditorOpen: false,
  comments: [],
  intlConfig,
  viewportScale: 1,
  zoomPercent: 100,
});

const message = {
  interactionMode: "comment",
  isAgentControllingBrowser: false,
  comments: ["comment"],
  intlConfig,
  zoomPercent: 125,
};
const defaults = resolveAnnotationSyncState(message, true);
assert.equal(defaults.annotationEditorMode, "comment");
assert.equal(defaults.canUseTweaks, true);
assert.equal(defaults.canUseAnnotationMultiSelect, false);
assert.equal(defaults.canUseSiteAnnotationApi, true);
assert.equal(defaults.isDesignModifierPressed, false);
assert.equal(defaults.areAnnotationMarkersVisible, true);
assert.equal(defaults.isAnnotationSuspended, false);
assert.equal(defaults.isTweaksEditorOpen, false);
assert.equal(defaults.viewportScale, 1);
assert.equal(defaults.comments, message.comments);

const explicit = resolveAnnotationSyncState({
  ...message,
  annotationEditorMode: "advanced",
  canUseTweaks: false,
  canUseAnnotationMultiSelect: true,
  siteAnnotationFeaturesEnabled: false,
  isDesignModifierPressed: true,
  areAnnotationMarkersVisible: false,
  isAnnotationSuspended: true,
  isTweaksEditorOpen: true,
  viewportScale: 2,
}, true);
assert.equal(explicit.annotationEditorMode, "advanced");
assert.equal(explicit.canUseTweaks, false);
assert.equal(explicit.canUseAnnotationMultiSelect, true);
assert.equal(explicit.canUseSiteAnnotationApi, false);
assert.equal(explicit.isDesignModifierPressed, true);
assert.equal(explicit.areAnnotationMarkersVisible, false);
assert.equal(explicit.isAnnotationSuspended, true);
assert.equal(explicit.isTweaksEditorOpen, true);
assert.equal(explicit.viewportScale, 2);
assert.equal(resolveAnnotationSyncState(message, false).canUseSiteAnnotationApi, false);

assert.equal(isAnnotationCommentModeActive(defaults), true);
assert.equal(isAnnotationCommentModeActive({ ...defaults, interactionMode: "browse" }), false);
assert.equal(isAnnotationCommentModeActive({ ...defaults, canUseSiteAnnotationApi: false }), false);

console.log("24 annotation context state assertions passed");
