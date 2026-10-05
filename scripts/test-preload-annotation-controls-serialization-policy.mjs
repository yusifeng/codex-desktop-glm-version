import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { serializeAnnotationControlsPayload } = require("../app/.vite/build/browser-page-preload/annotation-controls-serialization-policy.js");
assert.equal(serializeAnnotationControlsPayload({ controls: [{ type: "text" }] }, 100).includes('"controls"'), true);
assert.throws(() => serializeAnnotationControlsPayload({ controls: [() => {}] }, 100), /only data/);
console.log("test-preload-annotation-controls-serialization-policy: 2 assertions passed");
