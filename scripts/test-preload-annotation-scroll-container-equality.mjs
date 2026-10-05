import assert from "node:assert/strict";
import { areAnnotationScrollContainersEqual } from "../app/.vite/build/browser-page-preload/annotation-scroll-container-equality.js";
assert.equal(areAnnotationScrollContainersEqual(undefined, []), true);
assert.equal(areAnnotationScrollContainersEqual([{ selector: `a`, scrollLeft: 1, scrollTop: 2 }], [{ selector: `a`, scrollLeft: 1, scrollTop: 2 }]), true);
assert.equal(areAnnotationScrollContainersEqual([{ selector: `a`, scrollLeft: 1, scrollTop: 2 }], [{ selector: `a`, scrollLeft: 1, scrollTop: 3 }]), false);
console.log("test-preload-annotation-scroll-container-equality: 3 assertions passed");
