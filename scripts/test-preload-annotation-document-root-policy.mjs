import assert from "node:assert/strict";
import { isAnnotationDocumentRoot } from "../app/.vite/build/browser-page-preload/annotation-document-root-policy.js";
const html = {}; const body = {}; const documentLike = { documentElement: html, body };
assert.equal(isAnnotationDocumentRoot(html, documentLike), true);
assert.equal(isAnnotationDocumentRoot(body, documentLike), true);
assert.equal(isAnnotationDocumentRoot({}, documentLike), false);
console.log("test-preload-annotation-document-root-policy: 3 assertions passed");
