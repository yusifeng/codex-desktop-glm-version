import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveDefaultRemoteBranch, resolveMergeBase, resolveOriginUrl, resolveOrigins, resolveShellEnvironment, resolveWorktreeOwner } = require("../app/.vite/build/worker/git-read-request-handlers.js");
const repository = { id: "repo" };
const gitManager = { getRepoRepository: async () => repository, getWorktreeRepository: async () => repository };
const deps = { gitManager, host: { id: "local" }, getOriginUrl: async () => "origin", getOrigins: async (dirs) => dirs.map((dir) => ({ dir })), getShellEnvironment: async () => ({ shell: "bash" }), getOwnerThreadId: async () => "thread-1", getDefaultRemoteBranch: async () => ({ branch: "origin/main" }), getMergeBase: async (_repo, branch) => `sha:${branch}` };
assert.deepEqual(await resolveOriginUrl("/repo", deps), { originUrl: "origin" });
assert.deepEqual(await resolveOrigins(["/one", "/two"], deps), { origins: [{ dir: "/one" }, { dir: "/two" }] });
assert.deepEqual(await resolveShellEnvironment("/repo", new AbortController().signal, deps), { shellEnvironment: { shell: "bash" } });
assert.deepEqual(await resolveWorktreeOwner("/repo", deps), { ownerThreadId: "thread-1" });
assert.deepEqual(await resolveDefaultRemoteBranch("/repo", deps), { branch: "origin/main" });
assert.deepEqual(await resolveMergeBase("/repo", "main", deps), { mergeBaseSha: "sha:main" });
const empty = { ...deps, gitManager: { getRepoRepository: async () => null, getWorktreeRepository: async () => null } };
assert.deepEqual(await resolveOriginUrl("/missing", empty), { originUrl: null });
assert.deepEqual(await resolveMergeBase("/missing", "main", empty), { mergeBaseSha: null });

console.log("8 worker git read request handler assertions passed");
