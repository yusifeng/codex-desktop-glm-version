import assert from "node:assert/strict";
import { getAnnotationScrollOffset } from "../app/.vite/build/browser-page-preload/annotation-scroll-offset.js";
assert.equal(getAnnotationScrollOffset({ kind: `text`, isFixed: false }, { scrollX: 42 }), 42);
assert.equal(getAnnotationScrollOffset({ kind: `text`, isFixed: true }, { scrollX: 42 }), 0);
assert.equal(getAnnotationScrollOffset({ kind: `element`, isFixed: false }, { scrollX: 42 }), 0);
console.log("test-preload-annotation-scroll-offset: 3 assertions passed");
