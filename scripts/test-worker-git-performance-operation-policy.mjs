import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const policy = require("../app/.vite/build/worker/git-performance-operation-policy.js");

assert.equal(policy.resolveGitPerformanceOperation("review-diff"), "review-diff");
assert.equal(policy.resolveGitPerformanceOperation("status-summary"), "status-summary");
assert.equal(policy.resolveGitPerformanceOperation("current-branch"), null);
assert.deepEqual(
  policy.mapLiveQueryPerformanceResult({ method: "review-summary", result: { type: "success" } }),
  { operation: "review-summary", result: { type: "success" } },
);
assert.deepEqual(
  policy.mapLiveQueryPerformanceResult({ method: "current-branch", result: "main" }),
  undefined,
);
assert.deepEqual(
  policy.mapLiveQueryPerformanceResult({ method: "unknown", result: 1 }),
  undefined,
);

console.log("git-performance-operation-policy: 6 assertions passed");
