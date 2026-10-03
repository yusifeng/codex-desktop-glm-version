import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveBaseBranch, resolveBranchAheadCount, resolveBranchExists, resolveCurrentBranch, resolveCurrentBranchSnapshot, resolveDefaultBranch, resolveDefaultRemoteBranch, resolveMergeBase, resolveOriginUrl, resolveOrigins, resolveRecentBranches, resolveShellEnvironment, resolveUpstreamBranch, resolveWorktreeOwner } = require("../app/.vite/build/worker/git-read-request-handlers.js");
const repository = { id: "repo" };
const gitManager = { getRepoRepository: async () => repository, getWorktreeRepository: async () => repository };
const deps = { gitManager: { ...gitManager, getWorktreeRepositoryForRoot: async () => repository }, host: { id: "local" }, getOriginUrl: async () => "origin", getOrigins: async (dirs) => dirs.map((dir) => ({ dir })), getShellEnvironment: async () => ({ shell: "bash" }), getOwnerThreadId: async () => "thread-1", getDefaultRemoteBranch: async () => ({ branch: "origin/main" }), getMergeBase: async (_repo, branch) => `sha:${branch}`, getCurrentBranch: async () => ({ branch: "main" }), getCurrentBranchSnapshot: async () => "snapshot-branch", getUpstreamBranch: async () => ({ branch: "origin/main" }), getBranchAheadCount: async () => ({ ahead: 2, behind: 1 }), getDefaultBranch: async () => ({ branch: "main" }), getBaseBranch: async () => ({ branch: "main" }), getRecentBranches: async (params) => ({ branches: params.limit ? ["main"] : [] }), branchExists: async (_root, branch) => branch === "main" };
assert.deepEqual(await resolveOriginUrl("/repo", deps), { originUrl: "origin" });
assert.deepEqual(await resolveOrigins(["/one", "/two"], deps), { origins: [{ dir: "/one" }, { dir: "/two" }] });
assert.deepEqual(await resolveShellEnvironment("/repo", new AbortController().signal, deps), { shellEnvironment: { shell: "bash" } });
assert.deepEqual(await resolveWorktreeOwner("/repo", deps), { ownerThreadId: "thread-1" });
assert.deepEqual(await resolveDefaultRemoteBranch("/repo", deps), { branch: "origin/main" });
assert.deepEqual(await resolveMergeBase("/repo", "main", deps), { mergeBaseSha: "sha:main" });
assert.deepEqual(await resolveCurrentBranch("/repo", deps), { branch: "main" });
assert.deepEqual(await resolveCurrentBranchSnapshot("/repo", new AbortController().signal, deps), { branch: "snapshot-branch" });
assert.deepEqual(await resolveUpstreamBranch("/repo", new AbortController().signal, deps), { branch: "origin/main" });
assert.deepEqual(await resolveBranchAheadCount("/repo", new AbortController().signal, deps), { ahead: 2, behind: 1 });
assert.deepEqual(await resolveDefaultBranch("/repo", new AbortController().signal, deps), { branch: "main" });
assert.deepEqual(await resolveBaseBranch("/repo", deps), { branch: "main" });
assert.deepEqual(await resolveRecentBranches({ limit: 1 }, new AbortController().signal, deps), { branches: ["main"] });
assert.deepEqual(await resolveBranchExists("/repo", "main", new AbortController().signal, deps), { exists: true });
assert.deepEqual(await resolveBranchExists("/repo", "missing", new AbortController().signal, deps), { exists: false });
const empty = { ...deps, gitManager: { getRepoRepository: async () => null, getWorktreeRepository: async () => null } };
assert.deepEqual(await resolveOriginUrl("/missing", empty), { originUrl: null });
assert.deepEqual(await resolveMergeBase("/missing", "main", empty), { mergeBaseSha: null });

console.log("17 worker git read request handler assertions passed");
