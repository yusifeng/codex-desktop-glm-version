import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { escapeAnnotationSelectorTokenForPage } = require("../app/.vite/build/browser-page-preload/annotation-selector-token-policy.js");
assert.equal(escapeAnnotationSelectorTokenForPage("a b", { getCssEscape: () => (value) => `css:${value}`, escape: (value, cssEscape) => cssEscape(String(value)) }), "css:a b");
assert.equal(escapeAnnotationSelectorTokenForPage("a b", { getCssEscape: () => undefined, escape: (value, cssEscape) => cssEscape == null ? String(value).replace(/ /g, "\\ ") : cssEscape(String(value)) }), "a\\ b");

console.log("2 preload annotation selector-token assertions passed");
