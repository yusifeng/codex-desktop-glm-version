import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "github-cli-rate-limit-gate-"));
const output = path.join(tempDir, "gate.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/github-cli-rate-limit-gate.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { createGithubCliRateLimitGate } = createRequire(import.meta.url)(output);

let resolveGate;
const gate = createGithubCliRateLimitGate(() => new Promise((resolve) => { resolveGate = resolve; }));
await gate.waitForGate("host-a");
assert.equal(typeof resolveGate, "undefined");
gate.block("host-a", 1000);
const waiting = gate.waitForGate("host-a");
let settled = false;
waiting.then(() => { settled = true; });
await Promise.resolve();
assert.equal(settled, false);
resolveGate();
await waiting;
assert.equal(settled, true);

let resolveAbortGate;
const abortGate = createGithubCliRateLimitGate(() => new Promise((resolve) => { resolveAbortGate = resolve; }));
abortGate.block("host-b", 1000);
const controller = new AbortController();
const abortedWait = abortGate.waitForGate("host-b", controller.signal);
controller.abort();
await abortedWait;
assert.equal(controller.signal.aborted, true);
resolveAbortGate();

let firstResolve;
let secondResolve;
const replacementGate = createGithubCliRateLimitGate(() => new Promise((resolve) => {
  if (firstResolve == null) firstResolve = resolve;
  else secondResolve = resolve;
}));
replacementGate.block("host-c", 1000);
replacementGate.block("host-c", 1000);
firstResolve();
await Promise.resolve();
let replacementSettled = false;
const replacementWait = replacementGate.waitForGate("host-c");
replacementWait.then(() => { replacementSettled = true; });
await Promise.resolve();
assert.equal(replacementSettled, false);
secondResolve();
await replacementWait;
assert.equal(typeof secondResolve, "function");

console.log("test-worker-github-cli-rate-limit-gate: 6 assertions passed");
