import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getAnnotationOwnerWindow } = require("../app/.vite/build/browser-page-preload/annotation-owner-window.js");
const fallback = {}, owner = {}, element = { ownerDocument: { defaultView: owner } }, missing = { ownerDocument: {} };
assert.equal(getAnnotationOwnerWindow(element, fallback), owner); assert.equal(getAnnotationOwnerWindow(missing, fallback), fallback); console.log("2 preload annotation owner window assertions passed");
