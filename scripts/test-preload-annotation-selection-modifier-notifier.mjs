import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationSelectionModifierNotifier } = require(
  "../app/.vite/build/browser-page-preload/annotation-selection-modifier-notifier.js",
);

const events = [];
const notifier = createAnnotationSelectionModifierNotifier({ send: (pressed) => events.push(pressed) });
assert.equal(notifier.notify(true), true);
assert.equal(notifier.notify(true), true);
assert.equal(notifier.notify(false), true);
assert.deepEqual(events, [true, true, false]);
notifier.dispose();
assert.equal(notifier.notify(true), false);
assert.deepEqual(events, [true, true, false]);
console.log("6 preload annotation selection-modifier-notifier assertions passed");
