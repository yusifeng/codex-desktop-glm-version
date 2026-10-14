import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { GitIgnorePolicy } = require("../app/.vite/build/worker/git-ignore-policy.js");

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

let assertions = 0;
const equal = (actual, expected) => {
  assert.equal(actual, expected);
  assertions += 1;
};
const deepEqual = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

{
  const firstRead = deferred();
  let reads = 0;
  const timers = [];
  const policy = new GitIgnorePolicy({
    readIgnoredDirectories: () => {
      reads += 1;
      return reads === 1 ? firstRead.promise : Promise.resolve(["current"]);
    },
    refresh: async () => {},
    onRequiresRecoveryChanged: () => {},
    setTimeoutFn: (callback, delay) => {
      timers.push({ callback, delay });
      return callback;
    },
    clearTimeoutFn: () => {},
  });

  const pendingRead = policy.read();
  equal(policy.read(), pendingRead);
  equal(reads, 1);
  policy.requestRefresh();
  equal(timers.length, 1);
  equal(timers[0].delay, 1000);
  firstRead.resolve(["stale"]);
  const staleSnapshot = await pendingRead;
  deepEqual(staleSnapshot, { generation: 0, directories: ["stale"] });
  equal(policy.isCurrent(staleSnapshot), false);

  const currentSnapshot = await policy.read();
  deepEqual(currentSnapshot, { generation: 1, directories: ["current"] });
  equal(reads, 2);
  equal(policy.didApply(staleSnapshot), false);
  equal(policy.didApply(currentSnapshot), true);
  equal(policy.didApply(currentSnapshot), false);
  deepEqual(await policy.read(), currentSnapshot);
  equal(reads, 2);
}

{
  const timers = [];
  const recoveryChanges = [];
  let refreshes = 0;
  const policy = new GitIgnorePolicy({
    readIgnoredDirectories: async () => ["ignored"],
    refresh: async () => {
      refreshes += 1;
      if (refreshes === 1) throw Error("refresh failed");
    },
    onRequiresRecoveryChanged: () => recoveryChanges.push(policy.requiresRecovery),
    initialRetryDelayMs: 25,
    recoveryRetryDelayMs: 250,
    setTimeoutFn: (callback, delay) => {
      const timer = { callback, delay };
      timers.push(timer);
      return timer;
    },
    clearTimeoutFn: () => {},
  });

  policy.requestRefresh();
  policy.requestRefresh();
  equal(timers.length, 1);
  equal(timers[0].delay, 25);
  timers.shift().callback();
  await flushPromises();
  equal(refreshes, 1);
  equal(policy.requiresRecovery, true);
  deepEqual(recoveryChanges, [true]);
  equal(timers.length, 1);
  equal(timers[0].delay, 250);

  timers.shift().callback();
  await flushPromises();
  equal(refreshes, 2);
  equal(policy.requiresRecovery, true);
  equal(timers.length, 1);
  equal(timers[0].delay, 250);
  const snapshot = await policy.read();
  equal(snapshot.generation, 2);
  equal(policy.didApply(snapshot), true);
  equal(policy.requiresRecovery, false);
  deepEqual(recoveryChanges, [true, false]);
}

{
  const read = deferred();
  const refresh = deferred();
  const timers = [];
  const clearedTimers = [];
  const policy = new GitIgnorePolicy({
    readIgnoredDirectories: () => read.promise,
    refresh: () => refresh.promise,
    onRequiresRecoveryChanged: () => {},
    setTimeoutFn: (callback, delay) => {
      const timer = { callback, delay };
      timers.push(timer);
      return timer;
    },
    clearTimeoutFn: (timer) => clearedTimers.push(timer),
  });

  const pendingRead = policy.read();
  policy.requestRefresh();
  const timer = timers.shift();
  timer.callback();
  let disposed = false;
  const disposePromise = policy.dispose().then(() => { disposed = true; });
  await flushPromises();
  equal(disposed, false);
  read.resolve([]);
  await flushPromises();
  equal(disposed, false);
  refresh.resolve();
  await disposePromise;
  equal(disposed, true);
  equal(policy.isCurrent({ generation: 1, directories: [] }), false);
  policy.requestRefresh();
  equal(timers.length, 0);
  await pendingRead;

  const scheduledPolicy = new GitIgnorePolicy({
    readIgnoredDirectories: async () => [],
    refresh: async () => {},
    onRequiresRecoveryChanged: () => {},
    setTimeoutFn: (callback) => callback,
    clearTimeoutFn: (timerHandle) => clearedTimers.push(timerHandle),
  });
  scheduledPolicy.requestRefresh();
  await scheduledPolicy.dispose();
  equal(clearedTimers.length, 1);
}

{
  const recoveryChanges = [];
  const policy = new GitIgnorePolicy({
    readIgnoredDirectories: async () => { throw Error("read failed"); },
    refresh: async () => {},
    onRequiresRecoveryChanged: () => recoveryChanges.push(policy.requiresRecovery),
  });
  await assert.rejects(policy.read(), /read failed/);
  assertions += 1;
  equal(policy.requiresRecovery, true);
  deepEqual(recoveryChanges, [true]);
  await policy.dispose();
}

console.log(`${assertions} worker git ignore policy lifecycle assertions passed`);
