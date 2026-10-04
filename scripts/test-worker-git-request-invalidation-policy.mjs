import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isGitMutationMethod, resolveGitInvalidationTarget, resolveMutationRoot } = require("../app/.vite/build/worker/git-request-invalidation-policy.js");
const cwd = (value) => `cwd:${value}`;
const root = (value) => `root:${value}`;

assert.equal(isGitMutationMethod("create-worktree"), true);
assert.equal(isGitMutationMethod("status-summary"), false);
assert.deepEqual(resolveMutationRoot({ method: "status", params: { sourceCwd: "/repo" } }, cwd, root), "cwd:/repo");
assert.deepEqual(resolveMutationRoot({ method: "status", params: { root: "/repo" } }, cwd, root), "root:/repo");
assert.deepEqual(resolveGitInvalidationTarget({ method: "apply-changes", params: { destinationRoot: "/repo" } }, cwd, root), { type: "exact", cwd: "cwd:/repo" });
assert.deepEqual(resolveGitInvalidationTarget({ method: "commit", params: { includeUnstaged: false, cwd: "/repo" } }, cwd, root), null);
assert.deepEqual(resolveGitInvalidationTarget({ method: "delete-worktree", params: {} }, cwd, root), { type: "host" });
console.log("worker git request invalidation policy: 7 assertions passed");
