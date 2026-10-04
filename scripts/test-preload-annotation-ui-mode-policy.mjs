import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { deriveAnnotationUiModePolicy } = require("../app/.vite/build/browser-page-preload/annotation-ui-mode-policy.js");

assert.deepEqual(deriveAnnotationUiModePolicy({ interactionMode: "comment" }), {
  isCommentMode: true,
  isSuspended: false,
  canUseSiteAnnotationApi: false,
  canUseTweaks: true,
});
assert.equal(deriveAnnotationUiModePolicy({ interactionMode: "comment", isAnnotationSuspended: true }).isSuspended, true);
assert.deepEqual(deriveAnnotationUiModePolicy({ interactionMode: "browse", isAnnotationSuspended: true, canUseSiteAnnotationApi: true, canUseTweaks: false }), {
  isCommentMode: false,
  isSuspended: false,
  canUseSiteAnnotationApi: true,
  canUseTweaks: false,
});
console.log("test-preload-annotation-ui-mode-policy: 3 assertions passed");
