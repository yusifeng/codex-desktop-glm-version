import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationFeatureLifecycle } = require("../app/.vite/build/browser-page-preload/annotation-feature-lifecycle.js");

let permissionReset = 0;
let permissionGranted = false;
let featureAvailable = false;
let observerDisposed = 0;
let requestsDisposed = 0;
let controlsDisposed = 0;
let modeDisposed = 0;
let observed;
let state = { canUseSiteAnnotationApi: true, canUseTweaks: false, isAgentControllingBrowser: false };
const lifecycle = createAnnotationFeatureLifecycle({
  permissionController: { reset: () => { permissionReset++; }, requestPermission: () => true },
  getState: () => state,
  setPermissionGranted: (value) => { permissionGranted = value; },
  setFeatureApiAvailable: (value) => { featureAvailable = value; },
  createControlsRegistry: () => ({ dispose: () => { controlsDisposed++; } }),
  createSiteAnnotationRequests: (options) => ({ options, dispose: () => { requestsDisposed++; } }),
  createFeatureObserver: (onFeatures) => ({ recordUse: (event) => { observed = event; }, dispose: () => { observerDisposed++; }, onFeatures }),
  createModeController: (...args) => { assert.equal(typeof args[2], `function`); return () => { modeDisposed++; }; },
  sendPageEvent: () => {},
  toggleAnnotationMode: () => true,
  isCommentModeActive: () => false,
});
lifecycle.initialize({ enabled: true, siteAnnotationPermissionGranted: true });
assert.equal(featureAvailable, true);
assert.equal(permissionGranted, true);
assert.ok(lifecycle.controlsRegistry);
assert.ok(lifecycle.siteAnnotationRequests);
assert.ok(lifecycle.featureObserver);
lifecycle.dispose();
assert.equal(permissionReset, 1);
assert.equal(permissionGranted, false);
assert.equal(featureAvailable, false);
assert.equal(observerDisposed, 1);
assert.equal(requestsDisposed, 1);
assert.equal(controlsDisposed, 1);
assert.equal(modeDisposed, 1);
lifecycle.initialize({ enabled: true, siteAnnotationPermissionGranted: false });
assert.equal(permissionReset, 1, `reinitialization starts from a clean generation`);
assert.ok(lifecycle.controlsRegistry);
lifecycle.initialize({ enabled: true, siteAnnotationPermissionGranted: true });
assert.equal(observerDisposed, 2, `refresh disposes the previous observer`);
assert.equal(requestsDisposed, 2, `refresh disposes the previous request queue`);
assert.equal(controlsDisposed, 2, `refresh disposes the previous controls registry`);
assert.equal(modeDisposed, 2, `refresh disposes the previous mode controller`);
lifecycle.initialize({ enabled: false, siteAnnotationPermissionGranted: true });
assert.equal(lifecycle.controlsRegistry, null);
console.log(`test-preload-annotation-feature-lifecycle: 15 assertions passed`);
