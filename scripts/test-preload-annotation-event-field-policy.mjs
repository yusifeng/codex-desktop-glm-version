import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { readAnnotationEventFieldValue } = require("../app/.vite/build/browser-page-preload/annotation-event-field-policy.js");
const detail = Object.create({ inherited: "bad" });
Object.defineProperty(detail, "value", { value: 7, enumerable: false });
assert.equal(readAnnotationEventFieldValue(detail, "value"), 7);
assert.equal(readAnnotationEventFieldValue(detail, "inherited"), undefined);
console.log("test-preload-annotation-event-field-policy: 2 assertions passed");
