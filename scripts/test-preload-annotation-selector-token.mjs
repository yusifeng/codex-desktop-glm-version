import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { escapeAnnotationSelectorToken } = createRequire(import.meta.url)("../app/.vite/build/browser-page-preload/annotation-selector-token.js");

assert.equal(escapeAnnotationSelectorToken("plain"), "plain");
assert.equal(escapeAnnotationSelectorToken("a b"), "a\\ b");
assert.equal(escapeAnnotationSelectorToken("a#b"), "a\\#b");
assert.equal(escapeAnnotationSelectorToken(42), "42");
assert.equal(escapeAnnotationSelectorToken("x", (value) => `css(${value})`), "css(x)");
console.log("preload annotation selector token assertions passed (5 assertions)");
