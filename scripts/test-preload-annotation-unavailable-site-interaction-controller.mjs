import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationUnavailableSiteInteractionController } = require(
  "../app/.vite/build/browser-page-preload/annotation-unavailable-site-interaction-controller.js",
);

const events = [];
let cancelled = true;
const controller = createAnnotationUnavailableSiteInteractionController({
  cancelInteraction: () => {
    events.push("cancel");
    return cancelled;
  },
  markViewportSelection: () => events.push("mark"),
  disablePointerMode: () => events.push("disable"),
});
assert.equal(controller.cancel(), true);
assert.deepEqual(events, ["cancel", "mark", "disable"]);
cancelled = false;
assert.equal(controller.cancel(), true);
assert.deepEqual(events.slice(-2), ["cancel", "disable"]);
controller.dispose();
assert.equal(controller.cancel(), false);
assert.deepEqual(events.slice(-1), ["disable"]);
console.log("8 preload annotation unavailable-site-interaction-controller assertions passed");
