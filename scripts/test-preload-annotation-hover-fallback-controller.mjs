import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationHoverFallbackController } = require("../app/.vite/build/browser-page-preload/annotation-hover-fallback-controller.js");
const calls = [];
const controller = createAnnotationHoverFallbackController({
  resolveElement: () => ({ node: true }), projectAnchor: (...args) => ({ args }),
  openAt: () => calls.push(`open`), resolveHover: () => ({ hover: true }), setHover: () => calls.push(`hover`),
});
assert.equal(controller.handle({ x: 1, y: 2 }, true, { editorOpen: false, interactionMode: `comment`, canUseSiteAnnotationApi: true, rootHost: {} }), true);
assert.equal(controller.handle({ x: 1, y: 2 }, false, { editorOpen: false, interactionMode: `comment`, canUseSiteAnnotationApi: true, rootHost: {} }), true);
assert.deepEqual(calls, [`open`, `hover`]);
assert.equal(controller.handle({ x: 1, y: 2 }, false, { editorOpen: true, interactionMode: `comment`, canUseSiteAnnotationApi: true, rootHost: {} }), false);
controller.dispose();
assert.equal(controller.handle({ x: 1, y: 2 }, false, { editorOpen: false, interactionMode: `comment`, canUseSiteAnnotationApi: true, rootHost: {} }), false);
console.log("6 preload annotation hover-fallback-controller assertions passed");
