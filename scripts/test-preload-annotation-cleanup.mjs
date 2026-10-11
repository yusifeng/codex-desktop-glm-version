import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { runAnnotationCleanup } = require("../app/.vite/build/browser-page-preload/annotation-cleanup.js");
let calls = 0; runAnnotationCleanup(() => { calls += 1; }); runAnnotationCleanup(() => { throw new Error("ignored"); }); runAnnotationCleanup(null); assert.equal(calls, 1);
console.log("2 preload annotation cleanup assertions passed");
