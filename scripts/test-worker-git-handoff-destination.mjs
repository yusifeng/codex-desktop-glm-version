import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  prepareHandoffDestinationCheckout,
  resolveCleanWorktreeCommit,
} = require("../app/.vite/build/worker/git-handoff-destination.js");

const calls = [];
const signal = new AbortController().signal;
const host = { id: "host" };
const repository = {
  root: "/repo",
  host,
  invalidateGitReadCachesForRepoChange: (change) => calls.push(["invalidate", change]),
};
let statusConfig = ["config"];
let headCommit = "abc1234";
let statusResult = { success: true, stdout: "" };
let currentBranch = "feature";
let defaultBranch = { branch: "main" };
let checkoutResult = { status: "success" };
let statusError = null;
const gitManager = {
  getWorktreeRepositoryForRoot: (root, targetHost) => {
    calls.push(["repository", root, targetHost]);
    return repository;
  },
};
const deps = {
  getStatusConfig: async (...args) => {
    calls.push(["status-config", ...args]);
    if (statusError != null) throw statusError;
    return statusConfig;
  },
  getHeadCommit: async (...args) => {
    calls.push(["head", ...args]);
    return headCommit;
  },
  runGit: async (...args) => {
    calls.push(["git", ...args]);
    return statusResult;
  },
  getCurrentBranch: async (...args) => {
    calls.push(["current-branch", ...args]);
    return currentBranch;
  },
  getDefaultRemoteBranch: async (...args) => {
    calls.push(["default-branch", ...args]);
    return defaultBranch;
  },
  checkoutBranch: async (...args) => {
    calls.push(["checkout", ...args]);
    return checkoutResult;
  },
};

calls.length = 0;
assert.equal(await resolveCleanWorktreeCommit(repository, signal, deps), "abc1234");
assert.deepEqual(calls.find(([name]) => name === "git"), [
  "git",
  "/repo",
  ["status", "--porcelain=v1", "--untracked-files=normal"],
  host,
  { configOverrides: statusConfig, signal },
]);

statusResult = { success: true, stdout: " M file" };
assert.equal(await resolveCleanWorktreeCommit(repository, signal, deps), null);
statusResult = { success: false, stdout: "" };
assert.equal(await resolveCleanWorktreeCommit(repository, signal, deps), null);
statusError = new Error("config failed");
assert.equal(await resolveCleanWorktreeCommit(repository, signal, deps), null);
statusError = null;
statusResult = { success: true, stdout: "" };

const params = {
  branch: "feature",
  cwd: "/repo",
  sourceHeadSha: "abc1234",
  canDetachDefaultBranch: false,
  gitManager,
  host,
  signal,
};
calls.length = 0;
currentBranch = "other";
assert.deepEqual(await prepareHandoffDestinationCheckout(params, deps), {
  previousBranch: null,
  error: null,
});
assert.deepEqual(calls.slice(0, 3), [
  ["repository", "/repo", host],
  ["invalidate", "head"],
  ["current-branch", repository],
]);
assert.equal(calls.some(([name]) => name === "default-branch"), false);

calls.length = 0;
currentBranch = "feature";
defaultBranch = { branch: "main" };
checkoutResult = { status: "success" };
assert.deepEqual(await prepareHandoffDestinationCheckout(params, deps), {
  previousBranch: "feature",
  error: null,
});
assert.deepEqual(calls.at(-1), [
  "checkout",
  { cwd: "/repo", branch: "main", stashUncommitted: false },
  gitManager,
  host,
]);

calls.length = 0;
checkoutResult = { status: "error", error: "checkout failed", execOutput: { command: "git" } };
assert.deepEqual(await prepareHandoffDestinationCheckout(params, deps), {
  previousBranch: null,
  error: { message: "checkout failed", execOutput: { command: "git" } },
});

calls.length = 0;
defaultBranch = { branch: "feature" };
checkoutResult = { status: "success" };
assert.equal((await prepareHandoffDestinationCheckout(params, deps)).error.message.includes("already using"), true);
assert.equal(calls.some(([name]) => name === "status-config"), false);

calls.length = 0;
const detachableParams = { ...params, canDetachDefaultBranch: true };
assert.deepEqual(await prepareHandoffDestinationCheckout(detachableParams, deps), {
  previousBranch: "feature",
  error: null,
});
assert.deepEqual(calls.at(-1), [
  "checkout",
  { cwd: "/repo", branch: "abc1234", stashUncommitted: false },
  gitManager,
  host,
]);

calls.length = 0;
headCommit = "different";
assert.equal((await prepareHandoffDestinationCheckout(detachableParams, deps)).error.message.includes("already using"), true);
assert.equal(calls.some(([name]) => name === "checkout"), false);
headCommit = "abc1234";

calls.length = 0;
defaultBranch = null;
assert.equal((await prepareHandoffDestinationCheckout(detachableParams, deps)).error.message.includes("already using"), true);
assert.equal(calls.some(([name]) => name === "checkout"), false);

console.log("19 worker git handoff destination assertions passed");
