import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getAnnotationElementFramePath } = require("../app/.vite/build/browser-page-preload/annotation-element-frame-path.js");
const ownerWindow = {}, element = { ownerDocument: { defaultView: ownerWindow } }; assert.deepEqual(getAnnotationElementFramePath(element, { getOwnerWindow: (value) => value.ownerDocument.defaultView, resolveFramePath: (value) => [value] }), [ownerWindow]); console.log("1 preload annotation element frame path assertion passed");
