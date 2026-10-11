#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { WorkerInvocationSampler } = require("../app/.vite/build/main-app/worker/invocation-sampler.js");
const calls = [];
const counter = {
  record(value, atMs) {
    calls.push({ type: `record`, value, atMs });
  },
  getSnapshot(atMs) {
    calls.push({ type: `snapshot`, atMs });
    return { count: calls.filter((call) => call.type === `record`).length };
  },
};
const sampler = new WorkerInvocationSampler(() => counter, 30_000);
assert.deepEqual(sampler.getSnapshot(100), { totalInvocations: 0, invocationsLast30s: 0 });
sampler.recordInvocation(120);
sampler.recordInvocation(140);
assert.deepEqual(sampler.getSnapshot(160), { totalInvocations: 2, invocationsLast30s: 2 });
assert.deepEqual(calls, [
  { type: `snapshot`, atMs: 100 },
  { type: `record`, value: 1, atMs: 120 },
  { type: `record`, value: 1, atMs: 140 },
  { type: `snapshot`, atMs: 160 },
]);
console.log(`4 main worker invocation sampler assertions passed`);
