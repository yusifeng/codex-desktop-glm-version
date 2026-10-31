import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { MainThreadJankSampler } from "../src/main/main-app/startup/main-thread-jank-sampler.ts";

const powerMonitor = new EventEmitter();
let currentTimeMs = 0;
let intervalCallback = null;
let unrefCount = 0;
const cleared = [];
const interval = { unref: () => unrefCount++ };
const sampler = new MainThreadJankSampler({
  clearInterval: (value) => cleared.push(value),
  now: () => currentTimeMs,
  powerMonitor,
  setInterval(callback, delay) {
    assert.equal(delay, 100);
    intervalCallback = callback;
    return interval;
  },
});

sampler.start();
sampler.start();
assert.equal(unrefCount, 1);
assert.equal(powerMonitor.listenerCount("suspend"), 1);
assert.equal(powerMonitor.listenerCount("resume"), 1);
assert.equal(sampler.expectedTickAtMs, 100);

currentTimeMs = 999;
intervalCallback();
assert.equal(sampler.jankCountSinceLastSnapshot, 0);
currentTimeMs = 1999;
intervalCallback();
assert.equal(sampler.jankCountSinceLastSnapshot, 1);
currentTimeMs = 2999;
intervalCallback();
assert.equal(sampler.jankCountSinceLastSnapshot, 2);
assert.deepEqual(sampler.takeSnapshotFields(), {
  main_thread_jank_count_since_last_snapshot: 2,
});
assert.equal(sampler.jankCountSinceLastSnapshot, 0);

powerMonitor.emit("suspend");
currentTimeMs = 10_000;
intervalCallback();
assert.equal(sampler.jankCountSinceLastSnapshot, 0);
assert.equal(sampler.expectedTickAtMs, 10_100);
powerMonitor.emit("resume");
assert.equal(sampler.isSuspended, false);
assert.equal(sampler.expectedTickAtMs, 10_100);

for (let index = 0; index < 15; index++) {
  currentTimeMs += 1_000;
  intervalCallback();
}
assert.equal(sampler.jankCountSinceLastSnapshot, 10);

sampler.stop();
sampler.stop();
assert.deepEqual(cleared, [interval]);
assert.equal(powerMonitor.listenerCount("suspend"), 0);
assert.equal(powerMonitor.listenerCount("resume"), 0);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.match(main, /jankSampler: new MainThreadJankSampler\(\{/);
assert.doesNotMatch(main, /vQe = class/);

console.log("main thread jank sampler assertions: 22");
