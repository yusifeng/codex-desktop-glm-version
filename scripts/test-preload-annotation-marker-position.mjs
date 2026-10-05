import assert from "node:assert/strict";
import { spreadAnnotationMarkerPoints } from "../app/.vite/build/browser-page-preload/annotation-marker-position.js";

const single = [{ x: 10, y: 20, id: `one` }];
assert.deepEqual(spreadAnnotationMarkerPoints(single, 300), single);
assert.deepEqual(spreadAnnotationMarkerPoints([{ x: 100, y: 40 }, { x: 100, y: 40 }], 300).map(({ x, y }) => ({ x, y })), [{ x: 93.75, y: 40 }, { x: 106.25, y: 40 }]);
assert.deepEqual(spreadAnnotationMarkerPoints([{ x: 2, y: 40 }, { x: 2, y: 40 }, { x: 2, y: 40 }], 300).map(({ x }) => x), [28.5, 41, 53.5]);
console.log("test-preload-annotation-marker-position: 3 assertions passed");
