import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { observeAnnotationMutationsOutsideOverlay } = require("../app/.vite/build/browser-page-preload/annotation-overlay-observer.js");
class FakeNode {}
let callback; let observed; let options; let disconnectCount = 0;
class FakeMutationObserver { constructor(value) { callback = value; } observe(target, value) { observed = target; options = value; } disconnect() { disconnectCount += 1; } }
const documentElement = {}; const inside = new FakeNode(); const outside = new FakeNode();
const overlayRoot = { contains: (target) => target === inside }; let changes = 0;
const dispose = observeAnnotationMutationsOutsideOverlay({ documentElement }, overlayRoot, () => { changes += 1; }, { mutationObserverConstructor: FakeMutationObserver, mutationObserverOptions: { childList: true, subtree: true }, nodeConstructor: FakeNode });
assert.equal(observed, documentElement); assert.deepEqual(options, { childList: true, subtree: true });
callback([{ target: inside }, { target: inside }]); assert.equal(changes, 0);
callback([{ target: inside }, { target: outside }]); assert.equal(changes, 1);
callback([]); assert.equal(changes, 2); callback([{ target: {} }]); assert.equal(changes, 3);
dispose(); dispose(); assert.equal(disconnectCount, 1); callback([{ target: outside }]); assert.equal(changes, 3);
console.log("test-preload-annotation-overlay-observer: 9 assertions passed");
