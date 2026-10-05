import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationResponseEnvelope } = require("../app/.vite/build/browser-page-preload/annotation-response-envelope-policy.js");
assert.deepEqual(createAnnotationResponseEnvelope({ type: "result", registrationId: "r1", customRendering: true }), { type: "result", registrationId: "r1", customRendering: true, requestId: undefined, hit: undefined });
console.log("test-preload-annotation-response-envelope-policy: 1 assertion passed");
