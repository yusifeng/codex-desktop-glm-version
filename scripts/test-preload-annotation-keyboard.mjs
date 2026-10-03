import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { interceptAnnotationSpaceKey } = require("../app/.vite/build/browser-page-preload/annotation-keyboard.js");
const makeEvent = (overrides = {}) => ({ isTrusted: true, code: "Space", type: "keydown", composedPath: () => [], prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...overrides });
assert.equal(interceptAnnotationSpaceKey(makeEvent(), true, false, () => false), true);
assert.equal(interceptAnnotationSpaceKey(makeEvent({ type: "keyup" }), true, false, () => false), false);
assert.equal(interceptAnnotationSpaceKey(makeEvent({ isTrusted: false }), true, false, () => false), undefined);
assert.equal(interceptAnnotationSpaceKey(makeEvent({ isComposing: true }), false, false, () => false), undefined);
const input = { isContentEditable: false, closest: () => ({}) };
assert.equal(interceptAnnotationSpaceKey(makeEvent({ composedPath: () => [input] }), false, true, (value) => value === input), undefined);
console.log("5 preload annotation keyboard assertions passed");
