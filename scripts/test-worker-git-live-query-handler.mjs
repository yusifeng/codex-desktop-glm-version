import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handleGitLiveQuery } = require("../app/.vite/build/worker/git-live-query-handler.js");
const signal = new AbortController().signal;
const repository = { id: "repo" };
const calls = [];
const deps = {
  gitManager: { name: "manager" },
  getWorktreeRepositoryForRoot: (root, host) => (calls.push(["repo", root, host]), repository),
  getWatch: (root, host) => (calls.push(["watch", root, host]), { watcher: { requiresRecovery: false } }),
  getStatusSummary: async (...args) => (calls.push(["status", ...args.slice(0, 2)]), { type: "success", files: [] }),
  getReviewSummary: async (params) => (calls.push(["review", params.includeUntrackedFiles]), { type: "success", files: [{ path: "a" }] }),
  getBranchDiffStats: async (...args) => (calls.push(["stats", args[5]]), { type: "success", files: [] }),
  getRecentBranches: async (...args) => (calls.push(["recent", args[3]]), ["main"]),
  getCurrentBranch: async () => ({ branch: "main", isDetached: false }),
  getUpstreamBranch: async () => ({ branch: "main", upstream: null }),
  getBranchAheadCount: async () => ({ ahead: 1, behind: 0 }),
  getDefaultBranch: async (_root, _host, _signal, options) => ({ branch: options.live ? "main" : "master" }),
  getBaseBranch: async () => ({ local: "main", remote: "origin/main" }),
  getBranchCommits: async () => [{ sha: "1" }],
  resolveWorktreeList: async () => [{ path: "/repo" }],
  getMaxUntrackedFiles: () => 20,
  runWithUntracked: async (without, withUntracked, emit) => { emit(await without()); return withUntracked(); },
};

let intermediate = [];
const status = await handleGitLiveQuery({ method: "status-summary", params: { includeUntrackedFiles: true } }, "/repo", { id: "local" }, signal, (value) => intermediate.push(value), deps);
assert.equal(status.method, "status-summary");
assert.equal(intermediate.length, 1);

const stats = await handleGitLiveQuery({ method: "branch-diff-stats", params: { cwd: "/repo", baseBranch: "main", includeUntrackedFiles: true } }, "/repo", { id: "local" }, signal, () => {}, deps);
assert.equal(stats.result.type, "success");

const recent = await handleGitLiveQuery({ method: "recent-branches", params: { limit: 0 } }, "/repo", { id: "local" }, signal, () => {}, deps);
assert.deepEqual(recent.result.branches, ["main"]);

const branch = await handleGitLiveQuery({ method: "default-branch", params: { root: "/repo" } }, "/repo", { id: "local" }, signal, () => {}, deps);
assert.equal(branch.result.branch, "main");

assert.equal(await handleGitLiveQuery({ method: "unknown", params: {} }, "/repo", { id: "local" }, signal, () => {}, deps), undefined);
console.log("git live query handler tests passed (5 assertions)");
