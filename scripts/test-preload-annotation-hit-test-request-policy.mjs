import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isValidAnnotationHitTestRequest } = require("../app/.vite/build/browser-page-preload/annotation-hit-test-request-policy.js");
assert.equal(isValidAnnotationHitTestRequest({ type: "hit-test", requestId: "r1", x: 1, y: 2 }, 10), true);
assert.equal(isValidAnnotationHitTestRequest({ type: "hit-test", requestId: "", x: 1, y: 2 }, 10), false);
assert.equal(isValidAnnotationHitTestRequest({ type: "hit-test", requestId: "r1", x: Infinity, y: 2 }, 10), false);
console.log("test-preload-annotation-hit-test-request-policy: 3 assertions passed");
