import assert from "node:assert/strict";
import { resolveAnnotationFrameDocument } from "../app/.vite/build/browser-page-preload/annotation-frame-document-resolver.js";
const documentLike = {};
assert.equal(resolveAnnotationFrameDocument([`frame`], { resolveWindow: () => ({ document: documentLike }) }), documentLike);
assert.equal(resolveAnnotationFrameDocument([], { resolveWindow: () => null }), null);
console.log(`test-preload-annotation-frame-document-resolver: 2 assertions passed`);
