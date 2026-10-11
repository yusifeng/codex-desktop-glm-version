import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { setAnnotationPopoverOpen, closeAnnotationPopover } = require("../app/.vite/build/browser-page-preload/annotation-popover-policy.js");
let open = false, calls = []; const element = { connected: true }; const deps = { isConnected: () => true, hasMethod: (_e, name) => name === "showPopover" || name === "hidePopover", isOpen: () => open, show: () => { calls.push("show"); open = true; }, hide: () => { calls.push("hide"); open = false; } };
assert.equal(setAnnotationPopoverOpen(element, false, deps), true); closeAnnotationPopover(element, deps); assert.deepEqual(calls, ["show", "hide"]);
console.log("2 preload annotation popover assertions passed");
