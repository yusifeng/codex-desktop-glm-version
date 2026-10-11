import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { projectGitReviewSummaryResult } = require("../app/.vite/build/worker/git-request-context-policy.js");

const expected = { method: "review-summary", result: { type: "expected", source: "local" } };
assert.deepEqual(projectGitReviewSummaryResult(expected, { failedCommandCount: 0 }), expected);
assert.deepEqual(projectGitReviewSummaryResult(expected, null), expected);
assert.deepEqual(projectGitReviewSummaryResult(expected, { failedCommandCount: 2 }), {
  method: "review-summary",
  result: { type: "error", source: "local", failureReason: "review_comparison" },
});
const other = { method: "review-diff", result: { type: "expected" } };
assert.equal(projectGitReviewSummaryResult(other, { failedCommandCount: 2 }), other);

console.log("4 worker review summary projection assertions passed");
