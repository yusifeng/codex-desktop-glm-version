import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  restoreHandoffBranchAndStash,
  restoreHandoffSource,
  rollbackHostHandoffWorktree,
} = require("../app/.vite/build/worker/git-handoff-rollback.js");

const calls = [];
const host = { id: "host" };
const gitManager = { id: "git" };
const checkoutResults = [];
const stashResults = [];
let removeError = null;
const deps = {
  checkoutBranch: async (...args) => {
    calls.push(["checkout", ...args]);
    const result = checkoutResults.shift();
    if (result instanceof Error) throw result;
    return result ?? { status: "success" };
  },
  applyStash: async (...args) => {
    calls.push(["stash", ...args]);
    return stashResults.shift() ?? { status: "success" };
  },
  removeWorktree: async (...args) => {
    calls.push(["remove", ...args]);
    if (removeError != null) throw removeError;
  },
};
const base = {
  cwd: "/repo",
  branch: "main",
  stashRef: null,
  restoreBranchError: "branch-failed",
  restoreStashError: "stash-failed",
  gitManager,
  host,
};

calls.length = 0;
assert.deepEqual(await restoreHandoffBranchAndStash({ ...base, branch: null, stashRef: "stash" }, deps), [
  "branch-failed",
]);
assert.deepEqual(calls, []);

calls.length = 0;
checkoutResults.push({ status: "success" });
assert.deepEqual(await restoreHandoffBranchAndStash(base, deps), []);
assert.deepEqual(calls, [[
  "checkout",
  { cwd: "/repo", branch: "main", stashUncommitted: false },
  gitManager,
  host,
]]);

calls.length = 0;
checkoutResults.push({ status: "error" });
assert.deepEqual(await restoreHandoffBranchAndStash(base, deps), ["branch-failed"]);

calls.length = 0;
checkoutResults.push({ status: "error" });
stashResults.push({ status: "error" });
assert.deepEqual(await restoreHandoffBranchAndStash({ ...base, stashRef: "stash@{0}" }, deps), [
  "branch-failed",
  "stash-failed",
]);
assert.deepEqual(calls[1], [
  "stash",
  { cwd: "/repo", stashRef: "stash@{0}", mode: "pop" },
  host,
]);

calls.length = 0;
assert.deepEqual(await restoreHandoffSource({ ...base, branch: null, stashRef: null }, deps), []);
assert.deepEqual(calls, []);
stashResults.push({ status: "success" });
assert.deepEqual(await restoreHandoffSource({ ...base, branch: null, stashRef: "stash" }, deps), []);
stashResults.push({ status: "error" });
assert.deepEqual(await restoreHandoffSource({ ...base, branch: null, stashRef: "stash" }, deps), [
  "restore-source-stash-failed",
]);
checkoutResults.push({ status: "error" });
stashResults.push({ status: "error" });
assert.deepEqual(await restoreHandoffSource({ ...base, stashRef: "stash" }, deps), [
  "restore-source-branch-failed",
  "restore-source-stash-failed",
]);

const rollbackBase = {
  createdWorktree: true,
  worktreeGitRoot: "/repo/worktree-git",
  worktreeWorkspaceRoot: "/repo/worktree",
  reusedWorktreePreviousCheckout: "old-worktree-branch",
  reusedWorktreeStashRef: "stash@{1}",
  destinationCheckoutGitRoot: "/repo",
  destinationCheckoutPreviousBranch: "old-destination-branch",
  gitManager,
  host,
};
calls.length = 0;
await rollbackHostHandoffWorktree(rollbackBase, deps);
assert.deepEqual(calls, [
  ["remove", "/repo/worktree-git", host, true],
  [
    "checkout",
    { cwd: "/repo", branch: "old-destination-branch", stashUncommitted: false },
    gitManager,
    host,
  ],
]);

calls.length = 0;
removeError = new Error("remove failed");
checkoutResults.push(new Error("destination checkout failed"));
await rollbackHostHandoffWorktree(rollbackBase, deps);
assert.equal(calls.length, 2);
removeError = null;

calls.length = 0;
await rollbackHostHandoffWorktree(
  { ...rollbackBase, destinationCheckoutPreviousBranch: null },
  deps,
);
assert.deepEqual(calls, [["remove", "/repo/worktree-git", host, true]]);

calls.length = 0;
await rollbackHostHandoffWorktree({ ...rollbackBase, createdWorktree: false }, deps);
assert.deepEqual(calls, [
  [
    "checkout",
    { cwd: "/repo/worktree", branch: "old-worktree-branch", stashUncommitted: false },
    gitManager,
    host,
  ],
  ["stash", { cwd: "/repo/worktree", stashRef: "stash@{1}", mode: "pop" }, host],
  [
    "checkout",
    { cwd: "/repo", branch: "old-destination-branch", stashUncommitted: false },
    gitManager,
    host,
  ],
]);

calls.length = 0;
await rollbackHostHandoffWorktree({
  ...rollbackBase,
  createdWorktree: false,
  reusedWorktreePreviousCheckout: null,
  reusedWorktreeStashRef: null,
  destinationCheckoutPreviousBranch: null,
}, deps);
assert.deepEqual(calls, []);

calls.length = 0;
checkoutResults.push(new Error("reused checkout failed"));
await assert.rejects(
  rollbackHostHandoffWorktree({ ...rollbackBase, createdWorktree: false }, deps),
  /reused checkout failed/,
);
assert.equal(calls.length, 1);

console.log("19 worker git handoff rollback assertions passed");
