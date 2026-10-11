import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationPointerModeSyncController } = require(
  "../app/.vite/build/browser-page-preload/annotation-pointer-mode-sync-controller.js",
);

const events = [];
const controller = createAnnotationPointerModeSyncController({
  setEnabled: (enabled) => events.push(["enabled", enabled]),
  invalidate: () => events.push(["invalidate"]),
});
assert.equal(controller.sync({ canUseSiteAnnotationApi: true, interactionMode: "comment", zoomPercent: 100 }, 100, false), true);
assert.deepEqual(events, [["enabled", true]]);
assert.equal(controller.sync({ canUseSiteAnnotationApi: true, interactionMode: "comment", isAnnotationSuspended: true, zoomPercent: 125 }, 100, false), true);
assert.deepEqual(events.slice(-2), [["enabled", false], ["invalidate"]]);
assert.equal(controller.sync({ canUseSiteAnnotationApi: true, interactionMode: "comment", zoomPercent: 125 }, 125, true), true);
assert.deepEqual(events.slice(-1), [["enabled", false]]);
controller.dispose();
assert.equal(controller.sync({ canUseSiteAnnotationApi: true, interactionMode: "comment", zoomPercent: 150 }, 125, false), false);
assert.deepEqual(events.slice(-1), [["enabled", false]]);
console.log("8 preload annotation pointer-mode-sync-controller assertions passed");
