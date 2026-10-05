import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createAnnotationPreviewController } = require('../app/.vite/build/browser-page-preload/annotation-preview-controller.js');

const events = [];
const controller = createAnnotationPreviewController({
  mountPreview: (preview) => {
    events.push(`mount:${preview}`);
    return () => events.push(`dispose:${preview}`);
  },
});
controller.setPreview('controls');
controller.setPreview('metadata');
assert.deepEqual(events, ['mount:controls', 'dispose:controls', 'mount:metadata']);
controller.dispose();
assert.deepEqual(events, ['mount:controls', 'dispose:controls', 'mount:metadata', 'dispose:metadata']);
controller.setPreview(null);
controller.setPreview('late');
controller.dispose();
assert.equal(events.length, 4);
assert.equal(events.includes('mount:late'), false);
assert.equal(events.at(-1), 'dispose:metadata');
const disposable = createAnnotationPreviewController({ mountPreview: () => ({ dispose: () => events.push('object-dispose') }) });
disposable.setPreview('x');
disposable.setPreview(undefined);
assert.equal(events.at(-1), 'object-dispose');
console.log('test-preload-annotation-preview-controller: 6 assertions passed');
