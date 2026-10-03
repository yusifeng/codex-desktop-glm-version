import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { GitWatcherPerformanceAggregator } = require(
  "../app/.vite/build/worker/git-watcher-performance.js",
);

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

let now = 100;
const emitted = [];
const timers = [];
const cleared = [];
const aggregator = new GitWatcherPerformanceAggregator({
  emit: (event) => emitted.push(event),
  now: () => now,
  setTimeout: (callback, delayMs) => {
    const timer = {
      callback,
      delayMs,
      unrefCount: 0,
      unref() {
        this.unrefCount++;
      },
    };
    timers.push(timer);
    return timer;
  },
  clearTimeout: (timer) => cleared.push(timer),
  snapshotDurationMs: 10000,
  maxRawEventCount: 5,
});

const base = {
  changeType: "working-tree",
  changedPathCount: 3,
  filteredPathCount: 1,
  fullInvalidation: false,
  hostKind: "local",
  invalidated: true,
  rawEventCount: 2,
  repoIndexSizeBucket: "lt_1mb",
  refreshFanoutCount: 4,
  requiresRecovery: false,
};

aggregator.record(base);
equal(timers.length, 1);
equal(timers[0].delayMs, 10000);
equal(timers[0].unrefCount, 1);
equal(aggregator.snapshots.size, 1);
aggregator.record({
  ...base,
  changedPathCount: 7,
  filteredPathCount: 2,
  fullInvalidation: true,
  invalidated: false,
  rawEventCount: 2,
  refreshFanoutCount: 1,
  requiresRecovery: true,
});
equal(timers.length, 1);
equal(emitted.length, 0);

now = 350;
timers[0].callback();
equal(emitted.length, 1);
deepEqual(emitted[0], {
  type: "git-performance-watcher-snapshot",
  changeType: "working-tree",
  changedPathCount: 10,
  coalescedBatchCount: 2,
  filteredPathCount: 3,
  fullInvalidationCount: 1,
  hostKind: "local",
  invalidationCount: 1,
  rawEventCount: 4,
  repoIndexSizeBucket: "lt_1mb",
  refreshFanoutCount: 5,
  requiresRecoveryCount: 1,
  snapshotDurationMs: 250,
});
deepEqual(cleared, [timers[0]]);
equal(aggregator.snapshots.size, 0);
timers[0].callback();
equal(emitted.length, 1);

aggregator.record({ ...base, rawEventCount: 5 });
equal(emitted.length, 2);
equal(emitted[1].rawEventCount, 5);
equal(aggregator.snapshots.size, 0);
equal(cleared.at(-1), timers[1]);

aggregator.record({ ...base, changeType: "head" });
aggregator.record({ ...base, hostKind: "remote" });
equal(aggregator.snapshots.size, 2);
equal(timers.length, 4);
aggregator.flush("missing:key");
equal(emitted.length, 2);

console.log(`${count} worker git watcher performance assertions passed`);
