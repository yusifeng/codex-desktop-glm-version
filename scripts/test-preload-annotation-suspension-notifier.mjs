import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationSuspensionNotifier } = require("../app/.vite/build/browser-page-preload/annotation-suspension-notifier.js");

const events = [];
const notifier = createAnnotationSuspensionNotifier({ send: (value) => events.push(value) });
notifier.update("browse", true);
notifier.update("comment", true);
notifier.update("comment", true);
notifier.update("comment", false);
assert.deepEqual(events, [true, false]);
notifier.reset();
notifier.update("comment", false);
assert.deepEqual(events, [true, false, false]);
notifier.dispose();
notifier.update("comment", true);
assert.deepEqual(events, [true, false, false]);
console.log("8 preload annotation suspension-notifier assertions passed");
