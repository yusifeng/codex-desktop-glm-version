import assert from "node:assert/strict";
import fs from "node:fs";
import { createPendingProjectDeletionSchedulerClass } from "../src/main/main-app/projects/pending-project-deletion-scheduler.ts";

let stored;
const globalState = {
  get: () => stored,
  update: (_key, updater) => { stored = updater(stored); },
};
const timers = [];
const cleared = [];
const warnings = [];
let clock = 1_000;
const Scheduler = createPendingProjectDeletionSchedulerClass({
  stateKey: "pending-deletions",
  createLogger: () => ({ warning: (...args) => warnings.push(args) }),
  retryDelayMs: 30_000,
  now: () => clock,
  setTimer: (callback, delay) => {
    const timer = { callback, delay, unrefCalled: false, unref() { this.unrefCalled = true; } };
    timers.push(timer);
    return timer;
  },
  clearTimer: (timer) => { if (timer != null) cleared.push(timer); },
});
const finishes = [];
let fail = false;
const scheduler = new Scheduler(globalState, async (...args) => {
  finishes.push(args);
  if (fail) throw Error("finish failed");
});

scheduler.set("account-1", "project-1", { deleteAfterMs: 2_000, token: "one" });
scheduler.set("account-1", "project-2", { deleteAfterMs: 500, token: "two" });
assert.deepEqual(Object.keys(scheduler.getAll("account-1")), ["project-1", "project-2"]);
assert.equal(scheduler.get("account-1", "project-1").token, "one");

scheduler.resume("account-1");
assert.equal(timers.length, 2);
assert.equal(timers[0].delay, 1_000);
assert.equal(timers[1].delay, 0);
assert.equal(timers.every((timer) => timer.unrefCalled), true);
assert.equal(scheduler.timers.size, 2);

await timers[0].callback();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.deepEqual(finishes[0], ["account-1", "project-1", { deleteAfterMs: 2_000, token: "one" }]);
assert.equal(scheduler.timers.has("project-1"), false);

fail = true;
timers[1].callback();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(warnings.length, 1);
assert.equal(timers.at(-1).delay, 30_000);
assert.equal(scheduler.timers.get("project-2"), timers.at(-1));

scheduler.set("account-1", "project-1", null);
assert.equal(scheduler.get("account-1", "project-1"), undefined);
scheduler.set("account-1", "project-2", null);
assert.equal(stored, undefined);

scheduler.stop();
assert.equal(scheduler.activeIdentity, null);
assert.equal(scheduler.timers.size, 0);
assert.equal(cleared.length >= 1, true);
const timerCount = timers.length;
scheduler.schedule("account-1", "project-3");
assert.equal(timers.length, timerCount);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /K6e = createPendingProjectDeletionSchedulerClass\(\{/);
assert.doesNotMatch(main, /K6e = class/);

console.log("pending project deletion scheduler assertions: 20");
