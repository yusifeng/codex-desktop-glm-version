import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { readAnnotationViewportState } = require("../app/.vite/build/browser-page-preload/annotation-viewport-state.js");
assert.deepEqual(readAnnotationViewportState({ innerWidth: 800, innerHeight: 600, scrollY: 20, visualViewport: null }), { width: 800, height: 600, scrollY: 20 }, "base state");
assert.deepEqual(readAnnotationViewportState({ innerWidth: 800, innerHeight: 600, scrollY: 20, visualViewport: { offsetLeft: 1, offsetTop: 2, scale: 1.5 } }), { width: 800, height: 600, scrollY: 20, visualViewport: { offsetLeft: 1, offsetTop: 2, scale: 1.5 } }, "offset state");
assert.deepEqual(readAnnotationViewportState({ innerWidth: 800, innerHeight: 600, scrollY: 20, visualViewport: { offsetLeft: 0, offsetTop: 0, scale: 1 } }), { width: 800, height: 600, scrollY: 20 }, "default visual viewport");
console.log("3 preload annotation viewport-state assertions passed");
