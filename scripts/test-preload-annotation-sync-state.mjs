import assert from "node:assert/strict";
import { applyAnnotationSyncState } from "../app/.vite/build/browser-page-preload/annotation-sync-state.js";

let disposed = 0;
let clearedRequests = 0;
let clearedPreview = 0;
const base = { mode: `comment`, value: 1 };
const active = (state) => state.mode === `comment`;
const resolve = (message, available) => ({ mode: message.mode ?? `browse`, available, value: message.value });

let result = applyAnnotationSyncState({
  state: base, message: { mode: `browse` }, siteAnnotationApiAvailable: true,
  modeControllerMounted: true, resolveSyncState: resolve, isCommentModeActive: active,
  disposeFeatures: () => { disposed++; },
  clearSiteAnnotationRequests: () => { clearedRequests++; }, clearPreview: () => { clearedPreview++; },
});
assert.deepEqual(result.state, { mode: `browse`, available: true, value: undefined });
assert.equal(result.modeChanged, true);
assert.equal(result.active, false);

result = applyAnnotationSyncState({
  state: base, message: { canUseSiteAnnotationApi: false, mode: `comment` }, siteAnnotationApiAvailable: false,
  modeControllerMounted: true, resolveSyncState: resolve, isCommentModeActive: active,
  disposeFeatures: () => { disposed++; }, clearSiteAnnotationRequests: () => { clearedRequests++; },
  clearPreview: () => { clearedPreview++; },
});
assert.equal(disposed, 1);
assert.equal(result.modeChanged, false);

applyAnnotationSyncState({
  state: base, message: { isAgentControllingBrowser: true }, siteAnnotationApiAvailable: true,
  modeControllerMounted: false, resolveSyncState: resolve, isCommentModeActive: active,
  disposeFeatures: () => {}, clearSiteAnnotationRequests: () => { clearedRequests++; },
  clearPreview: () => { clearedPreview++; },
});
assert.equal(clearedRequests, 1);
assert.equal(clearedPreview, 1);

console.log(`test-preload-annotation-sync-state: 7 assertions passed`);
