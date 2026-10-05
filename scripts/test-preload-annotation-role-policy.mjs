import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isSafeAnnotationRole } = require("../app/.vite/build/browser-page-preload/annotation-role-policy.js");

assert.equal(isSafeAnnotationRole("button", 16, "^[a-z]+$"), true);
assert.equal(isSafeAnnotationRole("button-role", 6, "^[a-z-]+$"), false);
assert.equal(isSafeAnnotationRole("button1", 16, "^[a-z]+$"), false);

console.log("test-preload-annotation-role-policy: 3 assertions passed");
