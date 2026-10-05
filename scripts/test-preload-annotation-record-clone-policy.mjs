import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { cloneAnnotationRecord } = require("../app/.vite/build/browser-page-preload/annotation-record-clone-policy.js");
assert.deepEqual({ ...cloneAnnotationRecord({ id: "r1" }, 2) }, { id: "r1" });
assert.equal(cloneAnnotationRecord({ a: 1, b: 2 }, 1), null);
assert.equal(cloneAnnotationRecord({ constructor: 1 }, 2), null);
console.log("test-preload-annotation-record-clone-policy: 3 assertions passed");
