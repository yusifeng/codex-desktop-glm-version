import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createAnnotationRuntimeMount } = require('../app/.vite/build/browser-page-preload/annotation-runtime-mount.js');

let resolveLoad;
let prepared = 0;
let mounted = 0;
let disposed = 0;
let receivedPreview;
const runtime = { setSiteAnnotationPreview(value) { receivedPreview = value; }, dispose() { disposed++; } };
const controller = createAnnotationRuntimeMount({
  loadCommentRuntime: () => new Promise(resolve => { resolveLoad = resolve; }),
  prepareMount: () => prepared++,
  bridge: { marker: true },
});
controller.setPreview({ id: 'queued' });
controller.mount();
controller.mount();
assert.equal(typeof resolveLoad, 'function');
resolveLoad({ mountBrowserCommentRuntime(bridge) { mounted++; assert.equal(bridge.marker, true); return runtime; } });
await Promise.resolve();
assert.equal(prepared, 1);
assert.equal(mounted, 1);
assert.deepEqual(receivedPreview, { id: 'queued' });
controller.setPreview(null);
assert.equal(receivedPreview, null);
controller.dispose();
assert.equal(disposed, 1);
let attempts = 0;
let retryMount;
const retryController = createAnnotationRuntimeMount({
  loadCommentRuntime: () => {
    attempts++;
    if (attempts === 1) return Promise.reject(new Error('transient load failure'));
    return Promise.resolve({ mountBrowserCommentRuntime() {
      retryMount = { setSiteAnnotationPreview() {}, dispose() {} };
      return retryMount;
    } });
  },
  prepareMount() {},
  bridge: {},
});
retryController.mount();
await Promise.resolve();
await Promise.resolve();
retryController.mount();
await Promise.resolve();
await Promise.resolve();
assert.equal(attempts, 2);
assert.ok(retryMount);
console.log('test-preload-annotation-runtime-mount: 9 assertions passed');
