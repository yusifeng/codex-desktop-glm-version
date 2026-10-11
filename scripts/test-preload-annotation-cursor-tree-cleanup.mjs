import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { cleanupAnnotationCursorStylesAcrossFrames } = require("../app/.vite/build/browser-page-preload/annotation-cursor-tree-cleanup.js");
const docs = []; cleanupAnnotationCursorStylesAcrossFrames({}, { collectWindows: () => [1, 2, 3], getDocument: (windowLike) => windowLike === 2 ? null : { id: windowLike }, cleanupDocument: (documentLike) => docs.push(documentLike.id) }); assert.deepEqual(docs, [1, 3]); console.log("2 preload annotation cursor tree cleanup assertions passed");
