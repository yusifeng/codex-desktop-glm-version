import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationPointerInteractionController } = require("../app/.vite/build/browser-page-preload/annotation-pointer-interaction-controller.js");

let handlers;
let lifecycleCleanups = 0;
let frameDisposals = 0;
const ref = () => ({ current: null });
const dependencies = new Proxy({
  De: false, k: "comment", e: {}, t: { sendMessageToHost() {} }, x: null,
  Oe: false, A: false, Ne: false, Ue: false,
  w: ref(), E: ref(), D: ref(), O: ref(), ce: ref(), le: ref(),
  be: ref(), xe: ref(), Se: ref(), Ce: ref(), me: { current: 0 },
  document: { hasFocus: () => false },
  window: { innerWidth: 800, innerHeight: 600, requestAnimationFrame: (fn) => fn() },
  dc: (install) => install({}, {}),
  installAnnotationPointerEventLifecycle: (options) => {
    handlers = options.handlers;
    return () => { lifecycleCleanups += 1; };
  },
  Te: { isDragging: false, cancel: () => false, handlePointerCancel: () => true, disposeFrame: () => { frameDisposals += 1; } },
  Jc() {}, bl: () => false, ac: () => false,
  Lc: (_windowLike, point) => point,
  isAnnotationPointInViewport: () => true,
}, { get: (target, property) => property in target ? target[property] : () => null });

const cleanup = createAnnotationPointerInteractionController(dependencies);
assert.equal(typeof cleanup, "function");
assert.equal(typeof handlers.pointerDown, "function");
assert.equal(typeof handlers.pointerMove, "function");
assert.equal(typeof handlers.pointerUp, "function");
assert.equal(typeof handlers.click, "function");
assert.equal(typeof handlers.contextMenu, "function");
assert.equal(typeof handlers.wheel, "function");
dependencies.ce.current = { stale: true };
dependencies.le.current = { stale: true };
handlers.contextMenu({ isTrusted: false });
assert.equal(dependencies.ce.current, null);
assert.equal(dependencies.le.current, null);
handlers.pointerCancel({ pointerId: 1 });
assert.equal(dependencies.xe.current, true);
cleanup();
assert.equal(frameDisposals, 1);
assert.equal(lifecycleCleanups, 1);
console.log("13 preload annotation pointer-interaction-controller assertions passed");
