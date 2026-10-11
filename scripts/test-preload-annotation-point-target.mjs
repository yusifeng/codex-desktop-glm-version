import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveAnnotationPointTarget } = require("../app/.vite/build/browser-page-preload/annotation-point-target.js");
const owner = {}, element = { ownerDocument: { defaultView: owner } }; let point;
assert.equal(resolveAnnotationPointTarget(10, 20, {}, null, "annotation", true, { hitTest: () => element, getOwnerWindow: () => owner, getFrameOffset: () => ({ x: 3, y: 4 }), resolveTarget: (_e, value) => { point = value; return "target"; } }), "target"); assert.deepEqual(point, { x: 7, y: 16 }); console.log("2 preload annotation point target assertions passed");
