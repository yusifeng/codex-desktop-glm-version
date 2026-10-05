import assert from "node:assert/strict";
import { matchesAnnotationFrameUrl } from "../app/.vite/build/browser-page-preload/annotation-frame-url-policy.js";
assert.equal(matchesAnnotationFrameUrl(null, { location: { href: `x` } }), true);
assert.equal(matchesAnnotationFrameUrl(`x`, { location: { href: `x` } }), true);
assert.equal(matchesAnnotationFrameUrl(`x`, { location: { href: `y` } }), false);
console.log("test-preload-annotation-frame-url-policy: 3 assertions passed");
