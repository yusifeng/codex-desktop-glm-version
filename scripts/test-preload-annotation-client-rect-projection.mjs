import assert from "node:assert/strict";
import { projectAnnotationClientRects } from "../app/.vite/build/browser-page-preload/annotation-client-rect-projection.js";
assert.deepEqual(projectAnnotationClientRects({ getClientRects: () => [{ left: 1, top: 2, width: 3, height: 4 }, { left: 0, top: 0, width: 0, height: 2 }] }, { getClientRects: (value) => value.getClientRects() }), [{ x: 1, y: 2, width: 3, height: 4 }]);
assert.deepEqual(projectAnnotationClientRects({ getClientRects: () => Array.from({ length: 2 }, () => ({ left: 0, top: 0, width: 1, height: 1 })) }, { getClientRects: (value) => value.getClientRects(), maxRects: 1 }), []);
console.log(`test-preload-annotation-client-rect-projection: 2 assertions passed`);
