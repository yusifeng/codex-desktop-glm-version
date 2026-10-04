import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { GitLiveQueryRunCoordinator } = require("../app/.vite/build/worker/git-live-query-run-coordinator.js");

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const calls = [];
const deps = {
  createDeferred: deferred,
  trace: async (_options, operation) => operation(),
  run: async (_query, _root, _host, _signal, emit) => {
    calls.push("run");
    emit({ phase: "tracked", value: 1 });
    return { value: 2 };
  },
};
const coordinator = new GitLiveQueryRunCoordinator(deps);
const state = {
  host: { id: "local" }, commonDir: "/repo/.git", root: "/repo",
  query: { method: "status-summary", params: {} }, trigger: "subscription",
  errorRetryCount: 0,
};
const first = [];
const second = [];
const a = coordinator.run(state, new AbortController().signal, null, [], (value) => first.push(value));
const b = coordinator.run(state, new AbortController().signal, null, [], (value) => second.push(value));
assert.deepEqual(await a, { value: 2 });
assert.deepEqual(await b, { value: 2 });
assert.equal(calls.length, 1);
assert.equal(first[0].value, 1);
assert.equal(second[0].value, 1);
assert.equal(coordinator.sharedRuns.size, 0);
console.log("git live query run coordinator tests passed (6 assertions)");
