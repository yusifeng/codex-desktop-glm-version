import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { runGitLiveQuery } = require("../app/.vite/build/worker/git-live-query-run.js");
let count = 0;
const equal = (...args) => { count++; assert.equal(...args); };
const deepEqual = (...args) => { count++; assert.deepEqual(...args); };
const deferred = () => { let resolve, reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };
const state = (id, method = `status-summary`) => ({
  subscriptionId: id, query: { method }, trigger: `subscription`, root: `/repo`,
  commonDir: `/common`, host: { id: `host` }, errorRetryCount: 0,
});
const repositoryRuns = new Map();
const sharedRuns = new Map();
const runResult = deferred();
const traces = [];
const dependencies = {
  createDeferred: deferred,
  trace: async (options, operation) => { traces.push(options); return operation(); },
  run: async (...args) => { args[4]({ phase: `tracked` }); return runResult.promise; },
};
const first = state(`one`);
const firstAbort = new AbortController();
const tracked = [];
const promise = runGitLiveQuery(first, firstAbort.signal, { traceparent: `a` }, [], (value) => tracked.push(value), dependencies, repositoryRuns, sharedRuns);
await new Promise((resolve) => setImmediate(resolve));
equal(repositoryRuns.size, 1);
equal(tracked.length, 1);
const second = state(`two`);
const secondAbort = new AbortController();
const secondPromise = runGitLiveQuery(second, secondAbort.signal, { traceparent: `b` }, [{ traceparent: `c` }], () => {}, dependencies, repositoryRuns, sharedRuns);
equal(sharedRuns.size, 1);
secondAbort.abort(`cancelled`);
runResult.resolve({ ok: true });
deepEqual(await promise, { ok: true });
deepEqual(await secondPromise, { ok: true });
equal(sharedRuns.size, 0);
equal(repositoryRuns.size, 0);
equal(traces.length, 1);
console.log(`git-live-query-run: ${count} assertions passed`);
