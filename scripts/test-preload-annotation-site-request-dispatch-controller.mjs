import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationSiteRequestDispatchController } = require("../app/.vite/build/browser-page-preload/annotation-site-request-dispatch-controller.js");
globalThis.Range = class Range {};
const calls = [];
const controller = createAnnotationSiteRequestDispatchController({
  resolveTextAnchor: () => ({ anchor: { kind: `text` } }), openFromText: () => { calls.push(`text`); return true; },
  projectElementAnchor: (...args) => ({ args }), openFromElement: () => { calls.push(`element`); return true; },
});
const range = new Range();
assert.equal(controller.dispatch(range, { x: 1, y: 2 }, 0, null, { editorOpen: false }), true);
assert.equal(controller.dispatch({ node: true }, { x: 1, y: 2 }, 1, null, { editorOpen: false }), true);
assert.deepEqual(calls, [`text`, `element`]);
assert.equal(controller.dispatch({}, { x: 1, y: 2 }, 0, null, { editorOpen: true }), false);
controller.dispose();
assert.equal(controller.dispatch({}, { x: 1, y: 2 }, 0, null, { editorOpen: false }), false);
console.log("6 preload annotation site-request-dispatch-controller assertions passed");
