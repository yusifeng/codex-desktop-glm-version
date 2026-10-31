import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { createDownloadsViewPublisherClass } from "../src/main/main-app/downloads/downloads-view-publisher.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const flush = async () => {
  for (let index = 0; index < 20; index += 1) await Promise.resolve();
};
const deferred = () => {
  let resolve;
  const promise = new Promise((onResolve) => { resolve = onResolve; });
  return { promise, resolve };
};

function createRuntime() {
  let nextTimer = 1;
  const timers = new Map();
  const clearedTimers = [];
  const warnings = [];
  const scopeCalls = [];
  const DownloadsViewPublisher = createDownloadsViewPublisherClass({
    createLogger: (name) => ({ warning(message, details) { warnings.push([name, message, details]); } }),
    createUsingScope: () => ({
      e: undefined,
      u(value) { scopeCalls.push(["use", value]); return value; },
      d() { scopeCalls.push(["dispose"]); },
    }),
    setTimer(callback, delay) {
      const id = nextTimer++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimer(id) {
      clearedTimers.push(id);
      timers.delete(id);
    },
    detachedUpdateTimeoutMs: 30_000,
  });
  return { DownloadsViewPublisher, clearedTimers, scopeCalls, timers, warnings };
}

function createDetachedView({ failState = false } = {}) {
  const calls = [];
  let broken;
  let disposals = 0;
  return {
    calls,
    view: {
      async stateChanged(snapshot) {
        calls.push(["state", snapshot]);
        if (failState) throw Error("state failed");
      },
      async lifecycleChanged(event) { calls.push(["lifecycle", event]); },
      onRpcBroken(listener) { broken = listener; },
      [Symbol.dispose]() { disposals += 1; },
    },
    breakRpc: () => broken(),
    get disposals() { return disposals; },
  };
}

{
  const runtime = createRuntime();
  const publisher = new runtime.DownloadsViewPublisher(new Map(), async () => ({ items: [1] }));
  const origin = new EventEmitter();
  const detached = createDetachedView();
  const unsubscribe = publisher.registerDetachedView(origin, detached.view);
  equal(origin.listenerCount("destroyed"), 1);
  equal(origin.listenerCount("render-process-gone"), 1);
  await flush();
  equal(detached.calls, [["state", { items: [1] }]]);
  equal(runtime.timers.size, 0);
  equal(runtime.clearedTimers.length, 1);
  publisher.broadcastDownloadLifecycleEvent({ type: "created" });
  await flush();
  equal(detached.calls.at(-1), ["lifecycle", { type: "created" }]);
  origin.emit("render-process-gone");
  equal(detached.disposals, 1);
  equal(origin.listenerCount("destroyed"), 0);
  unsubscribe();
  detached.breakRpc();
  equal(detached.disposals, 1);
}

{
  const runtime = createRuntime();
  const snapshot = deferred();
  const publisher = new runtime.DownloadsViewPublisher(new Map(), () => snapshot.promise);
  const origin = new EventEmitter();
  const detached = createDetachedView();
  publisher.registerDetachedView(origin, detached.view);
  await flush();
  equal(runtime.timers.size, 1);
  const timer = [...runtime.timers.values()][0];
  equal(timer.delay, 30_000);
  timer.callback();
  equal(detached.disposals, 1);
  snapshot.resolve({ items: [] });
  await flush();
}

{
  const runtime = createRuntime();
  const events = [];
  const appView = {
    services: Promise.resolve({
      downloads: {
        async lifecycleChanged(event) { events.push(["lifecycle", event]); },
        async stateChanged(snapshot) { events.push(["state", snapshot]); },
      },
    }),
  };
  const publisher = new runtime.DownloadsViewPublisher(new Map([[1, appView]]), async () => ({ revision: 1 }));
  publisher.broadcastDownloadLifecycleEvent({ type: "one" });
  publisher.broadcastDownloadLifecycleEvent({ type: "two" });
  await flush();
  equal(events.slice(0, 2), [
    ["lifecycle", { type: "one" }],
    ["lifecycle", { type: "two" }],
  ]);
  equal(runtime.scopeCalls.length, 4);
  publisher.broadcastDownloadsState();
  await flush();
  equal(events.at(-1), ["state", { revision: 1 }]);
  equal(publisher.downloadsStateBroadcastRunning, false);
}

{
  const runtime = createRuntime();
  const snapshots = [deferred(), deferred()];
  let reads = 0;
  const states = [];
  const publisher = new runtime.DownloadsViewPublisher(
    new Map([[1, { services: Promise.resolve({ downloads: {
      lifecycleChanged() {},
      async stateChanged(snapshot) { states.push(snapshot); },
    } }) }]]),
    () => snapshots[reads++].promise,
  );
  publisher.broadcastDownloadsState();
  publisher.broadcastDownloadsState();
  equal(reads, 1);
  snapshots[0].resolve({ revision: 1 });
  await flush();
  equal(reads, 2);
  snapshots[1].resolve({ revision: 2 });
  await flush();
  equal(states, [{ revision: 1 }, { revision: 2 }]);
  equal(publisher.downloadsStateBroadcastRunning, false);
}

{
  const runtime = createRuntime();
  const expectedError = Error("snapshot failed");
  const publisher = new runtime.DownloadsViewPublisher(new Map(), async () => { throw expectedError; });
  publisher.broadcastDownloadsState();
  await flush();
  equal(runtime.warnings[0][1], "Failed to read native download history");
  equal(runtime.warnings[0][2].sensitive.error, expectedError);
}

{
  const runtime = createRuntime();
  const publisher = new runtime.DownloadsViewPublisher(new Map(), async () => ({ items: [] }));
  const first = createDetachedView();
  const second = createDetachedView();
  publisher.registerDetachedView(new EventEmitter(), first.view);
  publisher.registerDetachedView(new EventEmitter(), second.view);
  await flush();
  publisher.dispose();
  equal(first.disposals, 1);
  equal(second.disposals, 1);
  equal(publisher.detachedDownloadsViews.size, 0);
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("Jnt = createDownloadsViewPublisherClass({"), true);
equal(main.includes("new Jnt(this.appViewsByWebContentsId"), true);
equal(main.includes("Jnt = class"), false);
equal(main.includes("registerDetachedView"), true);

console.log(`${assertions} main downloads view publisher assertions passed`);
