import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { appendAnnotationVisibleText } = require("../app/.vite/build/browser-page-preload/annotation-visible-text-policy.js");
assert.deepEqual(appendAnnotationVisibleText("", "hello", 20), { text: "hello", complete: false });
assert.deepEqual(appendAnnotationVisibleText("hello", "world", 10), { text: "hello world", complete: true });
console.log("test-preload-annotation-visible-text-policy: 2 assertions passed");
