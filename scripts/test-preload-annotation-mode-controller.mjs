import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationModeController } = require("../app/.vite/build/browser-page-preload/annotation-mode-controller.js");

const calls = [];
let disposeCount = 0;
let notify;
const dispose = createAnnotationModeController({
  isAvailable: () => true,
  isActive: () => false,
  recordUse: (event) => calls.push(["record", event]),
  toggle: () => true,
  registerControls: (active) => {
    calls.push(["register", active()]);
    return () => { disposeCount += 1; };
  },
  installMainWorldListener: (handler) => { notify = handler; return true; },
  removeMainWorldListener: () => calls.push(["remove-main-world"]),
});
assert.equal(typeof dispose, "function");
notify("first");
assert.deepEqual(calls, [["register", true], ["record", "first"]]);
dispose();
notify("late");
assert.deepEqual(calls, [["register", true], ["record", "first"], ["remove-main-world"]]);
assert.equal(disposeCount, 1);
dispose();
assert.deepEqual(calls, [["register", true], ["record", "first"], ["remove-main-world"]]);
assert.equal(disposeCount, 1);

const unavailable = createAnnotationModeController({
  isAvailable: () => false,
  isActive: () => false,
  recordUse: () => { throw new Error("should not record"); },
  toggle: () => false,
  registerControls: () => null,
  installMainWorldListener: () => { throw new Error("should not install"); },
  removeMainWorldListener: () => { throw new Error("should not remove"); },
});
assert.equal(unavailable, null);
console.log("5 annotation mode controller assertions passed");
