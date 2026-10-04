import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parseAnnotationAttributeTokens } = require("../app/.vite/build/browser-page-preload/annotation-attribute-tokens.js");
assert.deepEqual(parseAnnotationAttributeTokens(null), [], "missing attribute");
assert.deepEqual(parseAnnotationAttributeTokens(""), [], "empty attribute");
assert.deepEqual(parseAnnotationAttributeTokens(" alpha  beta\n gamma "), ["alpha", "beta", "gamma"], "whitespace tokens");
console.log("3 preload annotation attribute-token assertions passed");
