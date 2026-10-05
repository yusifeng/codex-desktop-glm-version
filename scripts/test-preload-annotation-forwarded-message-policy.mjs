import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isForwardedAnnotationMessage } = require("../app/.vite/build/browser-page-preload/annotation-forwarded-message-policy.js");
assert.equal(isForwardedAnnotationMessage("browser-sidebar-runtime-select-comment"), true);
assert.equal(isForwardedAnnotationMessage("browser-sidebar-runtime-sync"), false);
console.log("test-preload-annotation-forwarded-message-policy: 2 assertions passed");
