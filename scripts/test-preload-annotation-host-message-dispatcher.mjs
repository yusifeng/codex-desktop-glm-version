import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { dispatchAnnotationHostMessage } = require('../app/.vite/build/browser-page-preload/annotation-host-message-dispatcher.js');

const calls = [];
const permissionController = { handleResult: (...args) => calls.push(['permission', ...args]) };
const runtimeMount = { setPreview: value => calls.push(['preview', value]) };
const preloadBridge = {
  bufferSync: value => calls.push(['sync', value]),
  bufferTextSelection: () => calls.push(['selection']),
  bufferEditorMessage: value => calls.push(['editor', value]),
};
const requests = { clear: () => calls.push(['clear']) };
const base = {
  state: { canUseSiteAnnotationApi: true, isAgentControllingBrowser: false },
  permissionController,
  runtimeMount,
  preloadBridge,
  siteAnnotationRequests: requests,
  setActiveEditor: value => calls.push(['active', value]),
  applySync: value => calls.push(['apply-sync', value]),
};

assert.equal(dispatchAnnotationHostMessage({ ...base, action: 'permission-result', message: { requestId: 'r1', allowed: true } }), true);
assert.deepEqual(calls.pop(), ['permission', 'r1', true]);
assert.equal(dispatchAnnotationHostMessage({ ...base, action: 'preview', message: { preview: { id: 1 } } }), true);
assert.deepEqual(calls.pop(), ['preview', { id: 1 }]);
assert.equal(dispatchAnnotationHostMessage({ ...base, action: 'sync', message: { value: 2 } }), true);
assert.deepEqual(calls.splice(-2), [['apply-sync', { value: 2 }], ['sync', { value: 2, canUseSiteAnnotationApi: true }]]);
assert.equal(dispatchAnnotationHostMessage({ ...base, action: 'queue-editor-message', message: { text: 'x' } }), true);
assert.deepEqual(calls.splice(-2), [['clear'], ['editor', { text: 'x' }]]);
assert.equal(dispatchAnnotationHostMessage({ ...base, action: 'close-editor', message: { type: 'close' } }), true);
assert.deepEqual(calls.splice(-3), [['active', false], ['clear'], ['editor', { type: 'close' }]]);
assert.equal(dispatchAnnotationHostMessage({ ...base, action: 'unknown', message: {} }), false);
assert.equal(dispatchAnnotationHostMessage({ ...base, action: 'preview', message: { preview: { id: 2 } }, state: { canUseSiteAnnotationApi: false, isAgentControllingBrowser: false } }), true);
assert.deepEqual(calls.pop(), ['preview', null]);
console.log('test-preload-annotation-host-message-dispatcher: 7 assertions passed');
