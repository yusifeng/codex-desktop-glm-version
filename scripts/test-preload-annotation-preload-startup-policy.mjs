import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  shouldDeferAnnotationMount,
  shouldSyncAnnotationPolicy,
} = require("../app/.vite/build/browser-page-preload/annotation-preload-startup-policy.js");

const topWindow = {};
assert.equal(shouldSyncAnnotationPolicy({ isSecureContext: true }, topWindow), false);
assert.equal(shouldSyncAnnotationPolicy({ isSecureContext: true }, { top: topWindow }), false);
assert.equal(shouldSyncAnnotationPolicy({ isSecureContext: true }, topWindow), false);
assert.equal(shouldSyncAnnotationPolicy({ isSecureContext: true }, Object.assign(topWindow, { top: topWindow })), true);
assert.equal(shouldSyncAnnotationPolicy({ isSecureContext: false }, topWindow), false);
assert.equal(shouldSyncAnnotationPolicy(null, topWindow), false);
assert.equal(shouldDeferAnnotationMount({ readyState: `loading` }), true);
assert.equal(shouldDeferAnnotationMount({ readyState: `complete` }), false);
assert.equal(shouldDeferAnnotationMount(null), false);

console.log("test-preload-annotation-preload-startup-policy: 9 assertions passed");
