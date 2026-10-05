import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { runBoundedWorkers } = require(
  "../app/.vite/build/worker/git-review-working-tree-worker-policy.js",
);

let assertions = 0;
const equal = (...args) => {
  assertions += 1;
  assert.equal(...args);
};
const rejects = async (...args) => {
  assertions += 1;
  await assert.rejects(...args);
};

const seen = [];
await runBoundedWorkers(["a", "b", "c"], async (value) => {
  seen.push(value);
}, 2, "worker failed");
equal(seen.join(""), "abc");

let active = 0;
let peak = 0;
await runBoundedWorkers([1, 2, 3, 4], async () => {
  active += 1;
  peak = Math.max(peak, active);
  await new Promise((resolve) => setTimeout(resolve, 1));
  active -= 1;
}, 2, "worker failed");
equal(peak, 2);

const cause = new Error("boom");
await rejects(
  runBoundedWorkers(["ok", "bad"], async (value) => {
    if (value === "bad") throw cause;
  }, 2, "stable worker failure"),
  (error) => error?.message === "stable worker failure" && error?.cause === cause,
);

console.log(`git review working-tree worker policy tests passed (${assertions} assertions)`);
