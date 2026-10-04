import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {
  hasAnnotationMetadataTooltipSnapshot,
  projectAnnotationMetadataTooltipRows,
} = require('../app/.vite/build/browser-page-preload/annotation-metadata-tooltip.js');

assert.deepEqual(projectAnnotationMetadataTooltipRows(null), []);
const rows = projectAnnotationMetadataTooltipRows({ tagName: 'button', size: '120×40', color: '#123', font: 'Inter' });
assert.deepEqual(rows.map((row) => row.kind), ['tag', 'size', 'color', 'font']);
assert.deepEqual(rows.map((row) => row.value), ['button', '120×40', '#123', 'Inter']);
assert.equal(hasAnnotationMetadataTooltipSnapshot(undefined), false);
assert.equal(hasAnnotationMetadataTooltipSnapshot({}), true);
console.log('test-preload-annotation-metadata-tooltip: 5 assertions passed');
