import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isGoogleDocsAnnotationAnchor } = require("../app/.vite/build/browser-page-preload/annotation-document-kind-policy.js");
const parse = (value) => typeof value === "string" && value.startsWith("https://") ? {} : null;
assert.equal(isGoogleDocsAnnotationAnchor({ documentContext: { kind: "google-docs" } }, () => null), true);
assert.equal(isGoogleDocsAnnotationAnchor({ pageUrl: "https://example.test" }, parse), true);
assert.equal(isGoogleDocsAnnotationAnchor({ pageUrl: "not-url" }, parse), false);
console.log("test-preload-annotation-document-kind-policy: 3 assertions passed");
