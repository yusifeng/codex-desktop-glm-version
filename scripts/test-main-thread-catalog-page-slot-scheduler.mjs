import assert from "node:assert/strict";
import fs from "node:fs";
import { createThreadCatalogPageSlotSchedulerClass } from "../src/main/main-app/thread-catalog/page-slot-scheduler.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const flush = async () => {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
};

function createHarness(pageIntervalMs = 100) {
  let nowValue = 1_000;
  let nextTimer = 1;
  const cleared = [];
  const timers = new Map();
  const ThreadCatalogPageSlotScheduler = createThreadCatalogPageSlotSchedulerClass({
    now: () => nowValue,
    setTimer(callback, delay) {
      const timer = nextTimer++;
      timers.set(timer, { callback, delay });
      return timer;
    },
    clearTimer(timer) {
      cleared.push(timer);
      timers.delete(timer);
    },
    defaultPageIntervalMs: pageIntervalMs,
  });
  const scheduler = new ThreadCatalogPageSlotScheduler();
  return {
    cleared,
    scheduler,
    timers,
    advance(milliseconds) { nowValue += milliseconds; },
    fire(timer) {
      const pending = timers.get(timer);
      timers.delete(timer);
      pending.callback();
    },
  };
}

{
  const { advance, scheduler } = createHarness();
  equal(scheduler.getBackgroundPageDispatchDelay(), 0);
  scheduler.recordBackgroundPageDispatch();
  equal(scheduler.getBackgroundPageDispatchDelay(), 100);
  advance(40);
  equal(scheduler.getBackgroundPageDispatchDelay(), 60);
  advance(100);
  equal(scheduler.getBackgroundPageDispatchDelay(), 0);
  scheduler.cancelPendingWaits();
  equal(scheduler.getBackgroundPageDispatchDelay(), 0);
}

{
  const { scheduler } = createHarness();
  equal(await scheduler.waitForPageSlot("local", "immediate"), true);
  equal(await scheduler.waitForPageSlot("local", "immediate", () => true), false);
  scheduler.clearHost("local");
  equal(await scheduler.waitForPageSlot("local", "immediate"), true);
}

{
  const { cleared, scheduler, timers } = createHarness();
  equal(await scheduler.waitForPageSlot("local", "background"), true);
  const pending = scheduler.waitForPageSlot("local", "background");
  await flush();
  equal(timers.size, 1);
  equal([...timers.values()][0].delay, 100);
  scheduler.promoteHost("local");
  equal(await pending, true);
  equal(timers.size, 0);
  equal(cleared.length, 1);
}

{
  const { scheduler, timers } = createHarness();
  equal(await scheduler.waitForPageSlot("local", "background"), true);
  const pending = scheduler.waitForPageSlot("local", "background");
  await flush();
  equal(timers.size, 1);
  scheduler.clearHost("local");
  equal(await pending, false);
  equal(timers.size, 0);
  equal(await scheduler.waitForPageSlot("local", "background"), true);
}

{
  const harness = createHarness();
  equal(await harness.scheduler.waitForPageSlot("local", "background"), true);
  const pending = harness.scheduler.waitForPageSlot("local", "background");
  await flush();
  const timer = [...harness.timers.keys()][0];
  harness.advance(100);
  harness.fire(timer);
  equal(await pending, true);
  equal(harness.timers.size, 0);
}

{
  const { scheduler } = createHarness();
  let cancelled = false;
  equal(await scheduler.waitForPageSlot("local", "background"), true);
  const pending = scheduler.waitForPageSlot("local", "background", () => cancelled);
  cancelled = true;
  equal(await pending, false);
}

{
  const { scheduler, timers } = createHarness();
  equal(await scheduler.waitForPageSlot("local", "background"), true);
  const pending = scheduler.waitForPageSlot("local", "background");
  await flush();
  equal(timers.size, 1);
  scheduler.cancelPendingWaits();
  equal(await pending, false);
  equal(timers.size, 0);
  equal(await scheduler.waitForPageSlot("local", "background"), true);
}

{
  const { scheduler, timers } = createHarness();
  equal(await scheduler.waitForPageSlot("local", "background"), true);
  const pending = scheduler.waitForPageSlot("local", "background");
  await flush();
  equal(timers.size, 1);
  scheduler.dispose();
  equal(await pending, false);
  equal(await scheduler.waitForPageSlot("local", "immediate"), false);
  equal(await scheduler.waitForPageSlot("other", "background"), false);
  scheduler.dispose();
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const catalogService = fs.readFileSync(
  new URL("../src/main/main-app/thread-catalog/service.ts", import.meta.url),
  "utf8",
);
equal(main.includes("E5 = createThreadCatalogPageSlotSchedulerClass({"), true);
equal(catalogService.includes("new ThreadCatalogPageSlotScheduler()"), true);
equal(main.includes("E5 = class"), false);
equal(main.includes("Ztt = 1e3"), false);

console.log(`${assertions} main thread catalog page-slot scheduler assertions passed`);
