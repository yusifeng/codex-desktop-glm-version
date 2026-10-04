import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createDelayedProgressWindow } = require("../app/.vite/build/main-app/startup/delayed-progress-window.js");

const timers = [];
const cancelled = [];
const schedule = (fn, ms) => (timers.push({ fn, ms }), timers.length);
const cancel = (id) => cancelled.push(id);
let shown = 0;
let disposed = 0;
const stop = createDelayedProgressWindow({ delayMs: 30, show: async () => { shown += 1; return () => { disposed += 1; }; }, onError: () => {}, setTimeout: schedule, clearTimeout: cancel });
assert.equal(timers[0].ms, 30);
await timers[0].fn();
assert.equal(shown, 1);
stop();
assert.equal(disposed, 1);
assert.deepEqual(cancelled, [1]);

let lateDisposed = 0;
const stopLate = createDelayedProgressWindow({ delayMs: 10, show: async () => () => { lateDisposed += 1; }, onError: () => {}, setTimeout: schedule, clearTimeout: cancel });
const pending = timers.at(-1).fn();
stopLate();
await pending;
assert.equal(lateDisposed, 1);
console.log("5 main delayed progress-window assertions passed");
