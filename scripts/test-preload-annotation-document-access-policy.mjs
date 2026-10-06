import assert from "node:assert/strict";
import { readAnnotationDocumentSafely } from "../app/.vite/build/browser-page-preload/annotation-document-access-policy.js";
const documentLike = {};
assert.equal(readAnnotationDocumentSafely({ document: documentLike }), documentLike);
assert.equal(readAnnotationDocumentSafely({}), undefined);
assert.equal(readAnnotationDocumentSafely({ get document() { throw new Error(`cross-origin`); } }), null);
console.log(`test-preload-annotation-document-access-policy: 3 assertions passed`);
