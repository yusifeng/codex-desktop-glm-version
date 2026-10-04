import assert from "node:assert/strict";
import { areAnnotationUrlsEquivalent, getCurrentAnnotationPageUrl, parseAnnotationUrl } from "../app/.vite/build/browser-page-preload/annotation-url.js";

assert.equal(areAnnotationUrlsEquivalent("https://example.test/a?x=1#old", "https://example.test/a?x=1#new"), true);
assert.equal(areAnnotationUrlsEquivalent("https://example.test/a?x=1", "https://example.test/a?x=2"), false);
assert.equal(areAnnotationUrlsEquivalent("https://example.test/a", "http://example.test/a"), false);
assert.equal(areAnnotationUrlsEquivalent("file:///tmp/a.html#one", "file:///tmp/a.html#two"), true);
assert.equal(areAnnotationUrlsEquivalent("opaque-value", "opaque-value"), true);
assert.equal(areAnnotationUrlsEquivalent("opaque-value", "other-value"), false);
assert.equal(parseAnnotationUrl("not a url"), null);
assert.equal(getCurrentAnnotationPageUrl({ location: { href: "https://example.test/current" } }), "https://example.test/current");
console.log("preload annotation URL assertions: 8 passed");
