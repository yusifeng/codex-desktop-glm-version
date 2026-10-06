import assert from "node:assert/strict";
import { readAnnotationDocumentSafely } from "../app/.vite/build/browser-page-preload/annotation-document-access-policy.js";
const documentLike = {};
assert.equal(readAnnotationDocumentSafely({ document: documentLike }), documentLike);
assert.equal(readAnnotationDocumentSafely({ get document() { throw new Error(`denied`); } }), null);
console.log(`test-preload-annotation-visible-text-document-access: 2 assertions passed`);
