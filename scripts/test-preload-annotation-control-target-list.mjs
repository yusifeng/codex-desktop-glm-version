import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseAnnotationControlTargetList } = require('../app/.vite/build/browser-page-preload/annotation-control-target-list.js');
class FakeElement { constructor(ownerDocument) { this.ownerDocument = ownerDocument; } }
const documentRef = {};
const first = new FakeElement(documentRef);
const duplicate = parseAnnotationControlTargetList([first, first], documentRef, FakeElement, () => false, 4);
assert.equal(duplicate.size, 1);
assert.equal(parseAnnotationControlTargetList([], documentRef, FakeElement, () => false, 4).size, 0);
assert.equal(parseAnnotationControlTargetList([new FakeElement({})], documentRef, FakeElement, () => false, 4), undefined);
assert.equal(parseAnnotationControlTargetList([first], documentRef, FakeElement, () => true, 4), undefined);
assert.equal(parseAnnotationControlTargetList([first, first, first, first, first], documentRef, FakeElement, () => false, 4), undefined);
assert.equal(parseAnnotationControlTargetList({ 0: first }, documentRef, FakeElement, () => false, 4), undefined);
console.log('test-preload-annotation-control-target-list: 6 assertions passed');
