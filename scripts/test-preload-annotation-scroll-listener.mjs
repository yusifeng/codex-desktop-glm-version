import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { installAnnotationScrollListeners } = require("../app/.vite/build/browser-page-preload/annotation-scroll-listener.js");
const calls = [], element = {};
const frameWindow = { document: {} };
const cleanup = installAnnotationScrollListeners(frameWindow, [{ framePath: [], scrollContainers: [{ selector: ".scroll" }] }, { framePath: [], scrollContainers: [{ selector: ".scroll" }] }], () => {}, { getFrameWindow: () => frameWindow, resolveElement: () => element, addListener: (value, type) => calls.push(["add", value, type]), removeListener: (value, type) => calls.push(["remove", value, type]) });
assert.deepEqual(calls, [["add", element, "scroll"]]); cleanup(); assert.deepEqual(calls, [["add", element, "scroll"], ["remove", element, "scroll"]]);
console.log("2 preload annotation scroll listener assertions passed");
