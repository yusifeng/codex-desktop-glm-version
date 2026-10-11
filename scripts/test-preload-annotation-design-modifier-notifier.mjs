import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationDesignModifierNotifier } = require(
  "../app/.vite/build/browser-page-preload/annotation-design-modifier-notifier.js",
);

const events = [];
const notifier = createAnnotationDesignModifierNotifier({ send: (pressed) => events.push(pressed) });
assert.equal(notifier.update(false), false);
assert.equal(notifier.update(true), true);
assert.equal(notifier.update(true), false);
assert.equal(notifier.update(false), true);
assert.deepEqual(events, [true, false]);
notifier.dispose();
assert.equal(notifier.update(true), false);
assert.equal(notifier.update(false), false);
assert.deepEqual(events, [true, false]);
console.log("8 preload annotation design-modifier-notifier assertions passed");
