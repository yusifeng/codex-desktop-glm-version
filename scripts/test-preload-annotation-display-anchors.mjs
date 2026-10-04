import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { resolveAnnotationDisplayAnchors } = require('../app/.vite/build/browser-page-preload/annotation-display-anchors.js');
const cache = new Map();
const element = { id: 'element' };
const result = resolveAnnotationDisplayAnchors({ id: 'a', anchor: { kind: 'element', pageUrl: 'https://example.test', selector: '#a' }, additionalAnchors: [{ kind: 'region', pageUrl: 'https://example.test' }], markerViewportPoint: { x: 2, y: 3 } }, cache, false, null, {
  getViewportSize: () => ({ width: 100, height: 80 }), resolveElement: (anchor) => anchor.kind === 'element' ? element : null,
  isCurrentPage: (url) => url === 'https://example.test', refreshElementAnchor: (node, anchor, viewport, marker) => ({ ...anchor, node, viewport, marker }),
});
assert.equal(result.anchor.node, element); assert.deepEqual(result.selectionSourceIndexes, [0, 1]); assert.equal(cache.get('a'), element);
const text = resolveAnnotationDisplayAnchors({ id: 't', anchor: { kind: 'text' } }, new Map(), false, { kind: 'text', value: 'x' }, { getViewportSize: () => null, resolveElement: () => null, isCurrentPage: () => true, refreshElementAnchor: () => null });
assert.equal(text.anchor.value, 'x');
const missing = resolveAnnotationDisplayAnchors({ id: 'm', anchor: { kind: 'element', pageUrl: 'https://example.test', selector: '#missing' } }, new Map(), false, null, { getViewportSize: () => null, resolveElement: () => null, isCurrentPage: () => true, refreshElementAnchor: () => null });
assert.equal(missing, null);
console.log('test-preload-annotation-display-anchors: 5 assertions passed');
