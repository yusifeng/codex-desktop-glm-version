import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { applyGitReviewAttribution, projectGitReviewSummaryResult } = require("../app/.vite/build/worker/git-request-context-policy.js");

const expected = { method: "review-summary", result: { type: "expected", source: "local" } };
assert.deepEqual(projectGitReviewSummaryResult(expected, { failedCommandCount: 0 }), expected);
assert.deepEqual(projectGitReviewSummaryResult(expected, null), expected);
assert.deepEqual(projectGitReviewSummaryResult(expected, { failedCommandCount: 2 }), {
  method: "review-summary",
  result: { type: "error", source: "local", failureReason: "review_comparison" },
});
const other = { method: "review-diff", result: { type: "expected" } };
assert.equal(projectGitReviewSummaryResult(other, { failedCommandCount: 2 }), other);

assert.deepEqual(applyGitReviewAttribution(expected.result, { failedCommandCount: 2 }), {
  type: "error",
  source: "local",
  failureReason: "review_comparison",
});
assert.equal(applyGitReviewAttribution(expected.result, { failedCommandCount: 0 }), expected.result);

console.log("6 worker review summary projection assertions passed");
