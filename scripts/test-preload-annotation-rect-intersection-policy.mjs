import assert from "node:assert/strict";
import { intersectsAnnotationRect } from "../app/.vite/build/browser-page-preload/annotation-rect-intersection-policy.js";
assert.equal(intersectsAnnotationRect({ left: 0, top: 0, right: 5, bottom: 5 }, { x: 5, y: 5, width: 1, height: 1 }), true);
assert.equal(intersectsAnnotationRect({ left: 0, top: 0, right: 2, bottom: 2 }, { x: 3, y: 3, width: 1, height: 1 }), false);
console.log(`test-preload-annotation-rect-intersection-policy: 2 assertions passed`);
