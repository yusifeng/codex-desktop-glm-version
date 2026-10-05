import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { applyAnnotationPreloadPolicyState } = require("../app/.vite/build/browser-page-preload/annotation-preload-policy-state.js");

const initial = { marker: "preserved", interactionMode: "comment" };
assert.deepEqual(applyAnnotationPreloadPolicyState(initial, {
  enabled: true,
  siteAnnotationFeaturesEnabled: true,
  canUseTweaks: true,
  isAgentControllingBrowser: false,
  isAnnotationModeActive: true,
}), {
  marker: "preserved",
  interactionMode: "comment",
  canUseSiteAnnotationApi: true,
  canUseTweaks: true,
  isAgentControllingBrowser: false,
});

const disabled = applyAnnotationPreloadPolicyState(initial, {
  enabled: true,
  siteAnnotationFeaturesEnabled: false,
  canUseTweaks: 1,
  isAgentControllingBrowser: 1,
  isAnnotationModeActive: 1,
});
assert.equal(disabled.canUseSiteAnnotationApi, false);
assert.equal(disabled.canUseTweaks, false);
assert.equal(disabled.isAgentControllingBrowser, false);
assert.equal(disabled.interactionMode, "browse");

assert.deepEqual(applyAnnotationPreloadPolicyState(null, null), {
  canUseSiteAnnotationApi: false,
  canUseTweaks: false,
  isAgentControllingBrowser: false,
  interactionMode: "browse",
});

console.log("test-preload-annotation-preload-policy-state: 10 assertions passed");
