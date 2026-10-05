import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { canToggleAnnotationMode } = require("../app/.vite/build/browser-page-preload/annotation-mode-toggle-eligibility.js");
const allowed = { destroyed: false, canUseSiteAnnotationApi: true, isAgentControllingBrowser: false, userActivationActive: true };
assert.equal(canToggleAnnotationMode(allowed), true);
assert.equal(canToggleAnnotationMode({ ...allowed, destroyed: true }), false);
assert.equal(canToggleAnnotationMode({ ...allowed, userActivationActive: false }), false);
console.log("test-preload-annotation-mode-toggle-eligibility: 3 assertions passed");
