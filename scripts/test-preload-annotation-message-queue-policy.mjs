import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isQueuedEditorAnnotationMessage } = require("../app/.vite/build/browser-page-preload/annotation-message-queue-policy.js");
assert.equal(isQueuedEditorAnnotationMessage("browser-sidebar-runtime-select-comment"), true);
assert.equal(isQueuedEditorAnnotationMessage("browser-sidebar-runtime-close-editor"), false);
console.log("test-preload-annotation-message-queue-policy: 2 assertions passed");
