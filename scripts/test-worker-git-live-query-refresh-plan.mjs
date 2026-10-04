import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { planGitLiveQueryRefresh } = require(
  "../app/.vite/build/worker/git-live-query-refresh-plan.js",
);

let assertions = 0;
const equal = (actual, expected) => {
  assertions += 1;
  assert.equal(actual, expected);
};

const states = [
  { generation: 2, dirty: false, errorRetryCount: 4, trigger: "old", traceLinks: [], refreshWaiters: [] },
  { generation: 7, dirty: false, errorRetryCount: 1, trigger: "old", traceLinks: [], refreshWaiters: [] },
];
let generation = 20;
const merged = [];
const waiters = planGitLiveQueryRefresh(states, "mutation", { traceparent: "trace-1" }, {
  nextGeneration: () => ++generation,
  mergeTrace: (state, trace) => {
    merged.push([state.generation, trace.traceparent]);
    state.traceLinks.push(trace);
  },
});

equal(waiters.length, 2);
equal(states[0].generation, 21);
equal(states[1].generation, 22);
equal(states.every((state) => state.dirty), true);
equal(states.every((state) => state.errorRetryCount === 0), true);
equal(states.every((state) => state.trigger === "mutation"), true);
equal(merged.length, 2);
equal(states[0].refreshWaiters.length, 1);
equal(states[1].refreshWaiters.length, 1);

console.log(`test-worker-git-live-query-refresh-plan: ${assertions} assertions passed`);
