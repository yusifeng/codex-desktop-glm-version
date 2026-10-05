import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isGitRequestFailure, resolveRequestRoot, resolveReviewCwd, resolveReviewSource } = require("../app/.vite/build/worker/git-request-context-policy.js");

assert.equal(resolveRequestRoot({ method: "status-summary", params: { cwd: "/repo" } }), "/repo");
assert.equal(resolveRequestRoot({ method: "branch-commits", params: { root: "/repo" } }), "/repo");
assert.equal(resolveRequestRoot({ method: "status-summary", params: {} }), undefined);
assert.equal(resolveReviewSource({ method: "review-summary", params: { source: "branch" } }), "branch");
assert.equal(resolveReviewSource({ method: "status-summary", params: { source: "branch" } }), null);
assert.equal(resolveReviewCwd({ method: "review-diff", params: { cwd: "/repo" } }), "/repo");
assert.equal(resolveReviewCwd({ method: "review-diff", params: {} }), null);
assert.equal(isGitRequestFailure({ type: "error" }), true);
assert.equal(isGitRequestFailure({ success: false }), true);
assert.equal(isGitRequestFailure({ status: "command-error" }), true);
assert.equal(isGitRequestFailure({ status: "ok" }), false);
assert.equal(isGitRequestFailure(null), false);
console.log("worker git request context policy: 12 assertions passed");
