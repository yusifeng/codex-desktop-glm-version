import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  resolveBranchDiffStats,
  resolveReviewDiff,
  resolveReviewPatch,
  resolveReviewSearch,
  resolveReviewSourceLineCounts,
  resolveReviewSummary,
  resolveStatusSummary,
} = require("../app/.vite/build/worker/git-review-request-handlers.js");

class StaleSnapshotError extends Error {}

const repository = { id: "repo" };
const signal = new AbortController().signal;
const calls = [];
const deps = {
  gitManager: { getWorktreeRepository: async () => repository },
  host: { id: "local" },
  attribution: { source: "test" },
  signal,
  runAbortable: async (promise, receivedSignal) => {
    assert.equal(receivedSignal, signal);
    return promise;
  },
  maxUntrackedFiles: (operationSource) => operationSource === "review" ? 25 : 10,
  applyAttribution: (result, attribution) => ({ ...result, attribution }),
  getStatusSummary: async (repo, includeUntrackedFiles, extra, receivedSignal) => {
    calls.push(["status", repo, includeUntrackedFiles, extra, receivedSignal]);
    return { type: "success", files: 2 };
  },
  getBranchDiffStats: async (...args) => ({ type: "success", args }),
  getReviewSummary: async (args) => ({ type: "success", source: args.source, max: args.maxUntrackedFiles, repo: args.worktreeRepo }),
  getReviewSourceLineCounts: async (args) => [{ source: args.sources[0], lines: args.maxUntrackedFiles }],
  getReviewSnapshot: (repo, generation) => repo && generation === 3 ? { generation } : null,
  getReviewDiffFallback: (source, files) => ({ source, files, fallback: true }),
  getReviewDiff: async (_snapshot, source, files, options) => ({ source, files, options }),
  staleSnapshotError: StaleSnapshotError,
  searchReview: async (...args) => ({ type: "success", args }),
  getReviewPatch: async (...args) => ({ type: "success", args }),
};

const status = await resolveStatusSummary({ cwd: "/repo", includeUntrackedFiles: true }, deps);
assert.deepEqual(status, { result: { type: "success", files: 2 }, performance: { operation: "status-summary", result: { type: "success", files: 2 } } });
assert.deepEqual(calls[0], ["status", repository, true, undefined, signal]);

const unavailable = { ...deps, gitManager: { getWorktreeRepository: async () => null } };
assert.deepEqual((await resolveStatusSummary({ cwd: "/missing" }, unavailable)).result, { type: "error", failureReason: "repository_unavailable" });

const stats = await resolveBranchDiffStats({ cwd: 42, baseBranch: "main", hideWhitespace: true, includeUntrackedFiles: false, operationSource: "review" }, deps);
assert.equal(stats.performance.operation, "branch-diff-stats");
assert.deepEqual(stats.result.args, ["42", deps.gitManager, deps.host, "main", true, false, 25]);

const summary = await resolveReviewSummary({ cwd: "/repo", source: "worktree", operationSource: "review" }, deps);
assert.deepEqual(summary.result, { type: "success", source: "worktree", max: 25, repo: repository, attribution: deps.attribution });
assert.deepEqual((await resolveReviewSummary({ cwd: "/missing", source: "commit" }, unavailable)).result, { type: "error", source: "commit", failureReason: "repository_unavailable", attribution: deps.attribution });

assert.deepEqual((await resolveReviewSourceLineCounts({ cwd: "/repo", sources: ["worktree"], operationSource: "review" }, deps)).result, [{ source: "worktree", lines: 25 }]);
assert.deepEqual((await resolveReviewSourceLineCounts({ cwd: "/missing", sources: ["a", "b"] }, unavailable)).result, [
  { source: "a", type: "error", failureReason: "repository_unavailable" },
  { source: "b", type: "error", failureReason: "repository_unavailable" },
]);

const diffParams = { cwd: "/repo", snapshotGeneration: 3, source: "worktree", files: ["a.ts"], baseBranch: "main", commitSha: "abc", hideWhitespace: true };
assert.deepEqual((await resolveReviewDiff(diffParams, deps)).result, { type: "success", source: "worktree", files: ["a.ts"], options: { baseBranch: "main", commitSha: "abc", hideWhitespace: true } });
assert.deepEqual((await resolveReviewDiff({ ...diffParams, snapshotGeneration: 2 }, deps)).result, { type: "stale-snapshot", source: "worktree" });
assert.deepEqual((await resolveReviewDiff(diffParams, { ...deps, getReviewDiff: async () => { throw new StaleSnapshotError(); } })).result, { type: "stale-snapshot", source: "worktree" });
assert.deepEqual((await resolveReviewDiff(diffParams, { ...deps, getReviewDiff: async () => { throw new Error("read failed"); } })).result, { type: "success", source: "worktree", files: ["a.ts"], fallback: true });

const search = await resolveReviewSearch({ cwd: 7, source: "commit", query: "needle", baseBranch: "main", commitSha: "abc", includeUntrackedFiles: true, operationSource: "review" }, deps);
assert.deepEqual(search.result.args, ["7", "commit", "needle", deps.gitManager, deps.host, signal, "main", "abc", true, 25]);

const patchResult = await resolveReviewPatch({ cwd: 8, source: "worktree", baseBranch: "main", commitSha: "def", operationSource: "review" }, deps);
assert.deepEqual(patchResult.result.args, ["8", "worktree", deps.gitManager, deps.host, undefined, "main", "def", 25]);

console.log("15 worker git review request handler assertions passed");
