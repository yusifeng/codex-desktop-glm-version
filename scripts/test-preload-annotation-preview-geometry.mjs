import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { buildAnnotationRoundedRectPath, resolveAnnotationCornerRadii } = require('../app/.vite/build/browser-page-preload/annotation-preview-geometry.js');

const target = { rect: { x: 10, y: 20, width: 100, height: 50 }, style: {
  borderTopLeftRadius: '10px', borderTopRightRadius: '20px', borderBottomRightRadius: '50%', borderBottomLeftRadius: '4px 8px',
} };
assert.deepEqual(resolveAnnotationCornerRadii(target), [{ x: 10, y: 10 }, { x: 20, y: 20 }, { x: 50, y: 25 }, { x: 4, y: 8 }]);
assert.equal(buildAnnotationRoundedRectPath(target), 'M20 20 H90 A20 20 0 0 1 110 40 V45 A50 25 0 0 1 60 70 H14 A4 8 0 0 1 10 62 V30 A10 10 0 0 1 20 20 Z');
assert.deepEqual(resolveAnnotationCornerRadii({ ...target, rect: { ...target.rect, width: 10 }, style: { ...target.style, borderTopLeftRadius: '20px', borderTopRightRadius: '20px' } })[0], { x: 5, y: 5 });
console.log('test-preload-annotation-preview-geometry: 3 assertions passed');
