import assert from "node:assert/strict";
import { hasAnnotationComments, getAnnotationCommentCount } from "../app/.vite/build/browser-page-preload/annotation-comment-count.js";
assert.equal(hasAnnotationComments([]), false);
assert.equal(hasAnnotationComments([{ id: 1 }]), true);
assert.equal(getAnnotationCommentCount([1, 2, 3]), 3);
console.log("test-preload-annotation-comment-count: 3 assertions passed");
