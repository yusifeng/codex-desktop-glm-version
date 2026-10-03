import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { GitLiveQueryRegistry } = require(
  "../app/.vite/build/worker/git-live-query-registry.js",
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
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
};
const flush = async () => {
  await new Promise((resolve) => setImmediate(resolve));
};

function fixture(overrides = {}) {
  const events = [];
  const runs = [];
  const traces = [];
  const timers = [];
  const clearedTimers = [];
  const recoveries = [];
  const dependencies = {
    emit: (event) => events.push(event),
    run: async (...args) => {
      runs.push(args);
      args[4]({ method: args[0].method, result: { type: "success" } });
      return { method: args[0].method, result: { type: "success" } };
    },
    prepareRecovery: (...args) => recoveries.push(args),
    getActiveTrace: () => undefined,
    trace: async (options, operation) => {
      traces.push(options);
      return operation();
    },
    createDeferred: deferred,
    now: () => 123,
    setTimeout: (callback, delayMs) => {
      const timer = { callback, delayMs };
      timers.push(timer);
      return timer;
    },
    clearTimeout: (timer) => clearedTimers.push(timer),
    localRefreshDelayMs: 100,
    errorRetryDelayMs: 1000,
    maxErrorRetries: 3,
    ...overrides,
  };
  return {
    clearedTimers,
    dependencies,
    events,
    recoveries,
    registry: new GitLiveQueryRegistry(dependencies),
    runs,
    timers,
    traces,
  };
}

const host = { id: "host", isLocal: false };
const subscription = (subscriptionId, query = { method: "status-summary", params: {} }, extra = {}) => ({
  commonDir: "/common",
  host,
  query,
  requiresRecovery: false,
  root: "/repo",
  subscriptionId,
  ...extra,
});

let state = fixture();
state.registry.subscribe(subscription("one"));
await flush();
equal(state.runs.length, 1);
deepEqual(state.events.map(({ type, phase }) => [type, phase]), [
  ["git-live-query-updated", "tracked"],
  ["git-live-query-updated", "complete"],
]);
equal(state.events[0].emittedAtMs, 123);
equal(state.runs[0][5], "subscription");
state.registry.subscribe(subscription("one"));
await flush();
equal(state.runs.length, 1);

state = fixture();
const branchQuery = {
  method: "review-summary",
  params: { source: "branch", baseBranch: " refs/heads/topic " },
};
state.registry.subscribe(subscription("branch-one", branchQuery));
state.registry.subscribe(subscription("branch-two", branchQuery));
await flush();
equal(
  state.registry.hasLocalBranchDependency({
    hostId: "host",
    commonDir: "/common",
    root: "/repo",
    branch: "topic",
  }),
  true,
);
state.registry.unsubscribe("branch-one");
equal(state.registry.hasLocalBranchDependency({ hostId: "host", commonDir: "/common", root: "/repo", branch: "topic" }), true);
state.registry.unsubscribe("branch-two");
equal(state.registry.hasLocalBranchDependency({ hostId: "host", commonDir: "/common", root: "/repo", branch: "topic" }), false);

state = fixture();
state.registry.subscribe(subscription("local", undefined, { host: { id: "host", isLocal: true } }));
await flush();
let fanout = -1;
const invalidation = state.registry.handleRepoChanged(
  { hostId: "host", commonDir: "/common", root: "/repo", changeType: "head" },
  (value) => {
    fanout = value;
  },
);
equal(fanout, 1);
equal(state.timers.at(-1).delayMs, 100);
equal(state.runs.length, 1);
state.timers.at(-1).callback();
await invalidation;
equal(state.runs.length, 2);
equal(state.runs[1][5], "invalidation");

state = fixture();
state.registry.subscribe(subscription("ignored", { method: "current-branch", params: {} }));
await flush();
fanout = -1;
await state.registry.handleRepoChanged(
  { hostId: "host", commonDir: "/common", root: "/repo", changeType: "index" },
  (value) => {
    fanout = value;
  },
);
equal(fanout, 0);
equal(state.runs.length, 1);

const sharedRun = deferred();
let tracked;
state = fixture({
  run: (...args) => {
    state.runs.push(args);
    tracked = args[4];
    return sharedRun.promise;
  },
});
state.registry.subscribe(subscription("shared-one"));
state.registry.subscribe(subscription("shared-two"));
await flush();
equal(state.runs.length, 1);
tracked({ method: "status-summary", result: { type: "success" } });
equal(state.events.filter(({ phase }) => phase === "tracked").length, 2);
sharedRun.resolve({ method: "status-summary", result: { type: "success" } });
await flush();
equal(state.events.filter(({ phase }) => phase === "complete").length, 2);

const abortRun = deferred();
let sharedSignal;
state = fixture({
  run: (...args) => {
    state.runs.push(args);
    sharedSignal = args[3];
    return abortRun.promise;
  },
});
state.registry.subscribe(subscription("abort-one"));
state.registry.subscribe(subscription("abort-two"));
await flush();
state.registry.unsubscribe("abort-one");
equal(sharedSignal.aborted, false);
state.registry.unsubscribe("abort-two");
equal(sharedSignal.aborted, true);
abortRun.reject(new Error("aborted"));
await flush();
equal(state.registry.sharedRuns.size, 0);

const firstRun = deferred();
const secondRun = deferred();
state = fixture({
  run: (...args) => {
    state.runs.push(args);
    return state.runs.length === 1 ? firstRun.promise : secondRun.promise;
  },
});
state.registry.subscribe(subscription("stale"));
await flush();
const refresh = state.registry.refreshRepository("host", "/repo");
firstRun.resolve({ method: "status-summary", result: { type: "success" } });
await flush();
equal(state.runs.length, 2);
equal(state.events.length, 0);
secondRun.resolve({ method: "status-summary", result: { type: "success" } });
await refresh;
equal(state.events.filter(({ phase }) => phase === "complete").length, 1);

state = fixture({
  run: async (...args) => {
    state.runs.push(args);
    return { method: "status-summary", result: { type: "error" } };
  },
});
state.registry.subscribe(subscription("retry"));
await flush();
for (let index = 0; index < 3; index++) {
  equal(state.timers[index].delayMs, 1000);
  state.timers[index].callback();
  await flush();
}
equal(state.runs.length, 4);
equal(state.timers.length, 3);
deepEqual(state.runs.map((args) => args[9]), [0, 1, 2, 3]);

state = fixture({
  run: async (...args) => {
    state.runs.push(args);
    throw new Error("run failed");
  },
});
state.registry.subscribe(subscription("failed"));
await flush();
equal(state.events.length, 1);
equal(state.events[0].type, "git-live-query-failed");
equal(state.timers.length, 0);

state = fixture();
state.registry.subscribe(subscription("recover-one", undefined, { requiresRecovery: true }));
state.registry.subscribe(subscription("recover-two", undefined, { requiresRecovery: true }));
await flush();
await state.registry.recover({ hostId: "host", subscriptionIds: ["recover-one", "recover-two"] });
equal(state.recoveries.length, 1);
deepEqual(state.recoveries[0], ["/repo", host]);
equal(state.runs.length, 2);

state = fixture();
state.registry.subscribe(subscription("recovery-change"));
await flush();
state.registry.setRequiresRecovery("host", "/repo", true);
await flush();
equal(state.events.at(-1).requiresRecovery, true);
equal(state.runs.at(-1)[5], "recovery");

const queuedFirst = deferred();
const queuedSecond = deferred();
state = fixture({
  run: (...args) => {
    state.runs.push(args);
    return state.runs.length === 1 ? queuedFirst.promise : queuedSecond.promise;
  },
});
state.registry.subscribe(subscription("queue-one", { method: "status-summary", params: { key: 1 } }));
state.registry.subscribe(subscription("queue-two", { method: "review-summary", params: { key: 2 } }));
await flush();
equal(state.runs.length, 1);
queuedFirst.resolve({ method: "status-summary", result: { type: "success" } });
await flush();
equal(state.runs.length, 2);
equal(state.traces.some(({ name }) => name === "git.repository_queue_wait"), true);
queuedSecond.resolve({ method: "review-summary", result: { type: "success" } });
await flush();

console.log(`${count} worker git live-query registry assertions passed`);
