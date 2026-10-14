import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isGitMutationMethod, resolveGitInvalidationTarget, resolveMutationRoot } = require("../app/.vite/build/worker/git-request-invalidation-policy.js");
const cwd = (value) => `cwd:${value}`;
const root = (value) => `root:${value}`;

let assertions = 0;
const equal = (actual, expected) => {
  assert.equal(actual, expected);
  assertions += 1;
};
const deepEqual = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const mutationMethods = ["push", "checkout-branch", "prepare-worktree-snapshot", "overwrite-repo", "git-init-repo", "create-worktree", "restore-worktree", "delete-worktree", "apply-changes", "apply-patch", "apply-review-section-changes", "commit", "create-branch", "move-thread-to-local", "move-thread-to-worktree", "move-thread-to-host-worktree"];
for (const method of mutationMethods) equal(isGitMutationMethod(method), true);
for (const method of ["status-summary", "watch-repo", "cleanup-host-handoff-transfer", "cancel-worktree-upstream-refresh", "unknown"])
  equal(isGitMutationMethod(method), false);

for (const key of ["cwd", "sourceCwd", "localCwd", "sourceWorktreeCwd", "worktreeWorkspaceRoot"])
  equal(resolveMutationRoot({ method: "mutation", params: { [key]: `/${key}` } }, cwd, root), `cwd:/${key}`);
for (const key of ["root", "localGitRoot", "worktreeGitRoot"])
  equal(resolveMutationRoot({ method: "mutation", params: { [key]: `/${key}` } }, cwd, root), `root:/${key}`);
equal(resolveMutationRoot({ method: "mutation", params: { cwd: "/cwd", root: "/root" } }, cwd, root), "cwd:/cwd");
equal(resolveMutationRoot({ method: "mutation", params: {} }, cwd, root), null);
equal(resolveMutationRoot({ method: "mutation" }, cwd, root), null);

const exactCases = [
  ["restore-worktree", { worktreePath: "/worktree" }, { type: "exact", cwd: "/worktree" }],
  ["apply-changes", { destinationRoot: "/repo" }, { type: "exact", cwd: "cwd:/repo" }],
  ["apply-patch", { cwd: "/repo" }, { type: "exact", cwd: "cwd:/repo" }],
  ["apply-review-section-changes", { cwd: "/repo" }, { type: "exact", cwd: "cwd:/repo" }],
  ["checkout-branch", { cwd: "/repo" }, { type: "exact", cwd: "cwd:/repo" }],
  ["commit", { includeUnstaged: true, cwd: "/repo" }, { type: "exact", cwd: "/repo" }],
];
for (const [method, params, expected] of exactCases)
  deepEqual(resolveGitInvalidationTarget({ method, params }, cwd, root), expected);
for (const method of ["overwrite-repo", "git-init-repo", "delete-worktree", "move-thread-to-local", "move-thread-to-worktree", "move-thread-to-host-worktree"])
  deepEqual(resolveGitInvalidationTarget({ method, params: {} }, cwd, root), { type: "host" });
for (const [method, params] of [["commit", { includeUnstaged: false, cwd: "/repo" }], ["create-worktree", {}], ["create-branch", {}], ["unknown", {}], ["apply-patch", {}], ["restore-worktree", {}]])
  equal(resolveGitInvalidationTarget({ method, params }, cwd, root), null);

console.log(`${assertions} worker git request invalidation policy assertions passed`);
