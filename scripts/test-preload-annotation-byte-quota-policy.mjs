import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isWithinAnnotationUtf8ByteQuota } = require("../app/.vite/build/browser-page-preload/annotation-byte-quota-policy.js");

assert.equal(isWithinAnnotationUtf8ByteQuota("abc", 3), true);
assert.equal(isWithinAnnotationUtf8ByteQuota("按钮", 6), true);
assert.equal(isWithinAnnotationUtf8ByteQuota("按钮", 5), false);

console.log("test-preload-annotation-byte-quota-policy: 3 assertions passed");
