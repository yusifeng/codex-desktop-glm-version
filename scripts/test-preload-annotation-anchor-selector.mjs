import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getAnnotationAnchorSelector } = require("../app/.vite/build/browser-page-preload/annotation-anchor-selector.js");
const element = {}; let options; assert.equal(getAnnotationAnchorSelector(element, { resolveSelector: (_value, received) => { options = received; return "#anchor"; } }), "#anchor"); assert.deepEqual(options, { requireUnique: true }); console.log("2 preload annotation anchor selector assertions passed");
