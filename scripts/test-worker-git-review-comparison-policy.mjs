import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const policy = require("../app/.vite/build/worker/git-review-comparison-policy.js");
const base = {
  findMergeBase: async (_repo, branch) => branch === "origin/main" ? "base-sha" : null,
  getDefaultBranch: async () => ({ remote: "origin", branch: "main" }),
  normalizeCommitSha: (sha) => `sha:${sha}`,
  validateObjectId: (sha) => sha === "head-sha",
  runGit: async (_root, args) => ({ success: true, stdout: String(args.at(-1)).endsWith("^") ? "parent-sha\n" : "head-sha\n" }),
};
const repo = { root: "/repo", host: {} };
assert.deepEqual(await policy.resolveReviewComparisonArgs({ source: "staged" }, base), { type: "success", args: ["--cached"] });
assert.deepEqual(await policy.resolveReviewComparisonArgs({ source: "unstaged" }, base), { type: "success", args: [] });
assert.deepEqual(await policy.resolveReviewComparisonArgs({ source: "branch", worktreeRepo: repo }, base), { type: "success", args: ["base-sha"] });
assert.deepEqual(await policy.resolveReviewComparisonArgs({ source: "branch", baseBranch: "feature", worktreeRepo: repo }, base), { type: "expected", reason: "merge_base_unavailable" });
assert.deepEqual(await policy.resolveReviewComparisonArgs({ source: "commit", commitSha: "abc", worktreeRepo: repo, signal: undefined }, base), { type: "success", args: ["parent-sha", "abc"] });
assert.deepEqual(await policy.resolveReviewComparisonArgs({ source: "uncommitted", worktreeRepo: repo, signal: undefined }, base), { type: "success", args: ["HEAD"] });
assert.deepEqual(await policy.resolveReviewComparisonArgs({ source: "branch" }, base), { type: "error", failureReason: "review_comparison" });
assert.equal(policy.normalizeOptionalHeadSha(null, base), null);
console.log("8 worker Git review comparison policy assertions passed");
