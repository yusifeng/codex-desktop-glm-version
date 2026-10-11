import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { openAnnotationPopoverTarget } = require("../app/.vite/build/browser-page-preload/annotation-popover-target.js");
let received = null; const target = {}; const root = { shadowRoot: { querySelector: (selector) => { received = selector; return target; } } };
assert.equal(openAnnotationPopoverTarget(root, "data-popover", { getShadowRoot: (value) => value.shadowRoot, query: (shadowRoot, selector) => shadowRoot.querySelector(selector), setOpen: (element, hideFirst) => element === target && hideFirst }), true); assert.equal(received, "[data-popover]"); assert.equal(openAnnotationPopoverTarget({}, "data-popover", { getShadowRoot: () => null, query: () => target, setOpen: () => true }), false); console.log("3 preload annotation popover target assertions passed");
