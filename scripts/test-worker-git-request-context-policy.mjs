import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { classifyGitRequestException, isGitRequestFailure, resolveGitRequestPerformanceContext, resolveRequestRoot, resolveReviewCwd, resolveReviewSource } = require("../app/.vite/build/worker/git-request-context-policy.js");
const unavailable = new Error("git unavailable");
const stale = new Error("stale");
const isStale = (value) => value === stale;

let assertions = 0;
const equal = (actual, expected) => {
  assert.equal(actual, expected);
  assertions += 1;
};
const deepEqual = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

equal(classifyGitRequestException(unavailable, unavailable, isStale), "git_unavailable");
equal(classifyGitRequestException(stale, unavailable, isStale), "stale_snapshot");
equal(classifyGitRequestException(new Error("other"), unavailable, isStale), "exception");

for (const method of ["status-summary", "review-summary", "branch-diff-stats", "list-worktrees"])
  equal(resolveRequestRoot({ method, params: { cwd: "/cwd", root: "/root" } }), "/cwd");
for (const method of ["recent-branches", "current-branch", "upstream-branch", "branch-ahead-count", "default-branch", "base-branch", "branch-commits"])
  equal(resolveRequestRoot({ method, params: { cwd: "/cwd", root: "/root" } }), "/root");
equal(resolveRequestRoot({ method: "status-summary", params: {} }), undefined);
equal(resolveRequestRoot({ method: "unknown", params: { cwd: "/cwd", root: "/root" } }), undefined);
equal(resolveRequestRoot({ method: "unknown" }), undefined);

for (const method of ["review-diff", "review-patch", "review-search", "review-summary"])
  equal(resolveReviewSource({ method, params: { source: "branch" } }), "branch");
equal(resolveReviewSource({ method: "status-summary", params: { source: "branch" } }), null);
equal(resolveReviewSource({ method: "review-summary" }), undefined);

for (const method of ["branch-diff-stats", "review-diff", "review-patch", "review-search", "review-summary", "status-summary"])
  equal(resolveReviewCwd({ method, params: { cwd: "/repo" } }), "/repo");
equal(resolveReviewCwd({ method: "review-diff", params: {} }), null);
equal(resolveReviewCwd({ method: "current-branch", params: { cwd: "/repo" } }), null);

for (const result of [{ type: "error" }, { success: false }, { status: "error" }, { status: "command-error" }])
  equal(isGitRequestFailure(result), true);
for (const result of [{ type: "ok" }, { success: true }, { status: "ok" }, null, "error"])
  equal(isGitRequestFailure(result), false);

deepEqual(resolveGitRequestPerformanceContext({ method: "review-summary", params: { cwd: "/repo", source: "branch" } }), {
  root: "/repo",
  reviewCwd: "/repo",
  reviewSource: "branch",
});
deepEqual(resolveGitRequestPerformanceContext({ method: "current-branch", params: { root: "/repo" } }), {
  root: "/repo",
  reviewCwd: null,
  reviewSource: null,
});

console.log(`${assertions} worker git request context assertions passed`);
