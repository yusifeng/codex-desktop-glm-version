import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/worker/git-branch-request-runtime.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const {
  resolveBaseBranch,
  resolveBranchAheadCount,
  resolveCurrentBranch,
  resolveDefaultBranch,
  resolveRecentBranches,
  resolveUpstreamBranch,
} = module.exports;

const calls = [];
const repository = { root: "/repo" };
const gitManager = { getWorktreeRepositoryForRoot: (root, host) => { calls.push(["repo", root, host]); return repository; } };
const deps = {
  gitManager,
  getCurrentBranch: async () => "feature",
  getCurrentBranchState: async () => ({ type: "branch", branch: "feature" }),
  getUpstreamRef: async (...args) => { calls.push(["upstream", ...args]); return "origin/feature"; },
  getBranchAheadCount: async (...args) => { calls.push(["ahead", ...args]); return { ahead: 2 }; },
  getDefaultRemoteBranch: async () => ({ branch: "develop", remote: "origin" }),
  getRecentBranches: async (...args) => { calls.push(["recent", ...args]); return ["main", "feature"]; },
  branchAheadDependencies: "ahead-deps",
  recentBranchesDependencies: "recent-deps",
};
const host = { id: "local" };
const signal = new AbortController().signal;

assert.deepEqual(await resolveUpstreamBranch("/repo", host, signal, deps), {
  branch: "feature", upstream: { branch: "origin/feature" },
});
assert.deepEqual(await resolveBranchAheadCount("/repo", host, signal, deps), { ahead: 2 });
assert.deepEqual(await resolveDefaultBranch("/repo", host, signal, {}, deps), { branch: "develop" });
assert.deepEqual(await resolveBaseBranch("/repo", host, deps), { local: "develop", remote: "origin" });
assert.deepEqual(await resolveCurrentBranch("/repo", host, deps), { branch: "feature", isDetached: false });
assert.deepEqual(await resolveRecentBranches("/repo", 0, host, signal, deps), { branches: ["main", "feature"] });
assert.equal(calls.some(([kind]) => kind === "ahead"), true);
assert.equal(calls.some(([kind]) => kind === "recent"), true);
console.log("worker Git branch request runtime tests passed (8 assertions)");
