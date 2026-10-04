import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { collectAnnotationDraftAttributes } = require('../app/.vite/build/browser-page-preload/annotation-draft-runtime.js');

const doc = {};
const target = { ownerDocument: doc, isConnected: true };
const annotations = [
  { id: 'one', draftAttribute: 'draft-one', anchor: { pageUrl: 'https://example.test/a', framePath: '0', kind: 'element', selector: '#a' } },
  { id: 'two', draftAttribute: 'draft-two', anchor: { pageUrl: 'https://example.test/a', framePath: '0', kind: 'element', selector: '#a' } },
  { id: 'other-frame', draftAttribute: 'draft-frame', anchor: { pageUrl: 'https://example.test/a', framePath: '1', kind: 'element', selector: '#b' } },
  { id: 'text', draftAttribute: 'draft-text', anchor: { pageUrl: 'https://example.test/a', framePath: '0', kind: 'text', selector: '#c' } },
];
const resolved = new Map([['one', target], ['two', target]]);
const result = collectAnnotationDraftAttributes(annotations, new Map(), {
  currentPageUrl: 'https://example.test/a', documentRef: doc,
  resolveFrameDocument: () => doc,
  isSamePageUrl: (left, right) => left === right,
  resolveTarget: (_doc, annotation) => resolved.get(annotation.id),
  isConnected: (value) => value?.isConnected === true,
  getOwnerDocument: (value) => value?.ownerDocument,
});
assert.equal(result.size, 1);
assert.deepEqual([...result.get(target)], ['draft-one', 'draft-two']);
assert.equal(resolved.size, 2);
const cached = new Map([['one', target]]);
const cachedResult = collectAnnotationDraftAttributes([annotations[0]], cached, {
  currentPageUrl: 'https://example.test/a', documentRef: doc,
  resolveFrameDocument: () => doc,
  isSamePageUrl: (left, right) => left === right,
  resolveTarget: () => { throw new Error('cache should be reused'); },
  isConnected: (value) => value?.isConnected === true,
  getOwnerDocument: (value) => value?.ownerDocument,
});
assert.equal(cachedResult.get(target).has('draft-one'), true);
console.log('test-preload-annotation-draft-runtime: 4 assertions passed');
