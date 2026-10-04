import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { refreshGitLiveQuery } = require("../app/.vite/build/worker/git-live-query-refresh.js");

const events = [];
const scheduled = [];
const state = {
  subscriptionId: "s1", query: { method: "status-summary" }, generation: 7,
  dirty: true, trace: null, traceLinks: [], errorRetryCount: 0,
  refreshWaiters: [],
};
const result = refreshGitLiveQuery(state, {
  runShared: async (_state, _signal, _trace, _links, tracked) => {
    tracked({ value: 1 });
    return { method: "status-summary", result: { type: "ok", value: 2 } };
  },
  isCurrent: (_state, generation) => generation === state.generation,
  publish: (_state, generation, value) => events.push({ generation, ...value }),
  emit: (event) => events.push(event), now: () => 10,
  scheduleRefresh: (_state, delay) => scheduled.push(delay),
  errorRetryDelayMs: 25, maxErrorRetries: 2,
});
assert.ok(result instanceof Promise);
assert.equal(state.dirty, false);
await result;
assert.equal(events[0].phase, "tracked");
assert.equal(events[1].phase, "complete");
assert.equal(state.inFlight, null);
assert.deepEqual(scheduled, []);
console.log("git live query refresh tests passed (6 assertions)");
