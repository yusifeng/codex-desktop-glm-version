import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createAnnotationPreviewVisibilityPredicate } = require('../app/.vite/build/browser-page-preload/annotation-preview-visibility.js');

const doc = { fullscreenElement: null, querySelectorAll: () => [], activeElement: null };
const parent = { ownerDocument: doc, parentNode: null, getBoundingClientRect: () => ({ left: 0, right: 10, top: 0, bottom: 10 }) };
const inside = { ownerDocument: doc, parentNode: parent, getBoundingClientRect: () => ({ left: 0, right: 10, top: 0, bottom: 10 }) };
const outside = { ownerDocument: doc, parentNode: null, getBoundingClientRect: () => ({ left: 0, right: 10, top: 0, bottom: 10 }) };
const modal = { ownerDocument: doc, parentNode: null, matches: (selector) => selector === ':modal', getBoundingClientRect: () => ({ left: 0, right: 10, top: 0, bottom: 10 }) };
doc.querySelectorAll = () => [modal];
doc.activeElement = modal;
const predicate = createAnnotationPreviewVisibilityPredicate([doc], {
  getParent: (value) => value.parentNode,
  isElement: (value) => value != null,
  getOwnerWindow: () => null,
  getFrameElement: () => null,
});
assert.equal(predicate(inside), false);
inside.parentNode = modal;
assert.equal(predicate(inside), true);
assert.equal(predicate(outside), false);
console.log('test-preload-annotation-preview-visibility: 3 assertions passed');
