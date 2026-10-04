import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createAnnotationPreviewScheduler } = require('../app/.vite/build/browser-page-preload/annotation-preview-scheduler.js');

let rafCallback;
const resizeInstances = [];
const intersectionInstances = [];
class FakeResizeObserver { constructor(callback) { this.callback = callback; resizeInstances.push(this); } observe(target) { this.target = target; } unobserve() {} disconnect() { this.disconnected = true; } }
class FakeIntersectionObserver { constructor(callback) { this.callback = callback; intersectionInstances.push(this); } observe(target) { this.target = target; } unobserve() {} disconnect() { this.disconnected = true; } }
const windowLike = { ResizeObserver: FakeResizeObserver, IntersectionObserver: FakeIntersectionObserver, requestAnimationFrame(callback) { rafCallback = callback; return 1; }, cancelAnimationFrame() { rafCallback = null; } };
const element = { isConnected: true };
let invalidations = 0;
let frames = 0;
const scheduler = createAnnotationPreviewScheduler({ windowLike, isElement: value => value != null, onInvalidate: () => invalidations++, onFrame: () => frames++ });
scheduler.setCandidate(element, true);
assert.equal(scheduler.getCandidates().has(element), true);
intersectionInstances[0].callback([{ target: element, isIntersecting: true }]);
assert.equal(scheduler.getVisibleCandidates().has(element), true);
assert.equal(typeof rafCallback, 'function');
rafCallback();
assert.equal(frames, 1);
resizeInstances[0].callback();
assert.ok(invalidations >= 2);
scheduler.dispose();
assert.equal(resizeInstances[0].disconnected, true);
assert.equal(intersectionInstances[0].disconnected, true);
console.log('test-preload-annotation-preview-scheduler: 5 assertions passed');
