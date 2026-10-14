import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationHoverRefreshController } = require("../app/.vite/build/browser-page-preload/annotation-hover-refresh-controller.js");

const listeners = new Map();
const documentLike = { addEventListener: (type, fn) => listeners.set(`document:${type}`, fn), removeEventListener: () => {} };
const windowLike = { addEventListener: (type, fn) => listeners.set(`window:${type}`, fn), removeEventListener: () => {} };
let pointer = { x: 10, y: 20 };
let hover = null;
let refreshes = 0;
let timerCallback = null;
let suppressed = false;
const controller = createAnnotationHoverRefreshController({
  enabled: () => true,
  getPointer: () => pointer,
  isSurfaceAtPointer: () => false,
  resolveHover: (value) => ({ point: value }),
  setHover: (value) => { hover = value; },
  clearSelectionHover: () => {},
  setScrollSuppressed: (value) => { suppressed = value; },
  refreshViewport: () => { refreshes += 1; },
  installFrames: (install) => { const cleanup = install(documentLike, windowLike); return () => cleanup(); },
  debounceMs: 25,
  setTimeout: (callback) => { timerCallback = callback; return 1; },
  clearTimeout: () => { timerCallback = null; },
});
const dispose = controller.install();
listeners.get("window:resize")();
assert.deepEqual(hover, { point: pointer });
listeners.get("document:scroll")();
assert.equal(refreshes, 2);
assert.equal(suppressed, true);
timerCallback();
assert.equal(refreshes, 3);
assert.equal(suppressed, false);
dispose();
controller.dispose();
console.log("6 preload annotation hover-refresh-controller assertions passed");
