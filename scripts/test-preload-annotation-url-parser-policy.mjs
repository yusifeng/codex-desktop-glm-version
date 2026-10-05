import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parseAnnotationUrl } = require("../app/.vite/build/browser-page-preload/annotation-url-parser-policy.js");
assert.equal(parseAnnotationUrl("https://example.test/a").hostname, "example.test");
assert.equal(parseAnnotationUrl("not a url"), null);
assert.equal(parseAnnotationUrl(null), null);
console.log("test-preload-annotation-url-parser-policy: 3 assertions passed");
