#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(new URL("../src/main/main-app/worker/invocation-sampler.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", transpiled.code)(loaded, loaded.exports);
const { RollingWindowCounter, WorkerInvocationSampler } = loaded.exports;
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

const rolling = new RollingWindowCounter(100);
rolling.record(2, 0);
rolling.record(3, 50);
rolling.record(4, 100);
assert.deepEqual(rolling.getSnapshot(100), { count: 3, sum: 9 });
assert.deepEqual(rolling.getSnapshot(101), { count: 2, sum: 7 });
assert.deepEqual(rolling.getSnapshot(150), { count: 2, sum: 7 });
assert.deepEqual(rolling.getSnapshot(151), { count: 1, sum: 4 });

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.equal(main.includes("new RollingWindowCounter(windowMs)"), true);
assert.equal(main.includes("var jt = class"), false);

console.log(`10 main worker invocation sampler assertions passed`);
