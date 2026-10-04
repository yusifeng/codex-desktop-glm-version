import assert from "node:assert/strict";
import { isAnnotationAnchorOnCurrentPage, isAnnotationRectLargeEnough, isGoogleDocsAnnotationAnchor } from "../app/.vite/build/browser-page-preload/annotation-anchor-viewport-policy.js";

const parse = (value) => typeof value === "string" && value.includes("docs.google.com") ? { url: value } : null;
const same = (left, right) => left === right;
assert.equal(isGoogleDocsAnnotationAnchor({ pageUrl: "https://docs.google.com/document/d/x" }, parse), true);
assert.equal(isGoogleDocsAnnotationAnchor({ documentContext: { kind: "google-docs" } }, parse), true);
assert.equal(isGoogleDocsAnnotationAnchor({ pageUrl: "https://example.com" }, parse), false);
assert.equal(isAnnotationAnchorOnCurrentPage(null, "https://example.com", { isGoogleDocsAnchor: () => false, samePageUrl: same }), true);
assert.equal(isAnnotationAnchorOnCurrentPage({ pageUrl: "https://example.com" }, "https://example.com", { isGoogleDocsAnchor: () => false, samePageUrl: same }), true);
assert.equal(isAnnotationAnchorOnCurrentPage({ pageUrl: "https://other.example" }, "https://example.com", { isGoogleDocsAnchor: () => false, samePageUrl: same }), false);
assert.equal(isAnnotationRectLargeEnough({ width: 50, height: 40 }, 100, 80, .45, .3, (r, w, h, x, y) => r.width >= w * x && r.height >= h * y), true);
console.log(`annotation anchor viewport policy: ${7} assertions passed`);
