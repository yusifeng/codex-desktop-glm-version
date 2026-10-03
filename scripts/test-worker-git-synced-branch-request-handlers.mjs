import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  overwriteSyncedBranchRepository,
  resolveSyncedBranch,
  resolveSyncedBranchState,
} = require("../app/.vite/build/worker/git-synced-branch-request-handlers.js");

const repository = { id: "repo" };
const signal = new AbortController().signal;
const calls = [];
const deps = {
  gitManager: { getWorktreeRepository: async () => repository },
  host: { id: "local" },
  signal,
  getSyncedBranch: async (repo, receivedSignal) => {
    calls.push(["branch", repo, receivedSignal]);
    return { branch: "feature", base: "main", hasConflicts: false };
  },
  getSyncedBranchState: async (...args) => {
    calls.push(["state", ...args]);
    return { state: "ahead" };
  },
  overwriteRepository: async (args) => {
    calls.push(["overwrite", args]);
    return { status: args.status ?? "success" };
  },
};

assert.deepEqual(await resolveSyncedBranch("/repo", deps), { branch: "feature", base: "main", hasConflicts: false });
assert.deepEqual(calls[0], ["branch", repository, signal]);

let unavailableCalls = 0;
const unavailable = {
  ...deps,
  gitManager: { getWorktreeRepository: async () => null },
  getSyncedBranch: async () => { unavailableCalls += 1; },
};
assert.deepEqual(await resolveSyncedBranch("/missing", unavailable), { branch: null, base: null, hasConflicts: false });
assert.equal(unavailableCalls, 0);

assert.deepEqual(await resolveSyncedBranchState("/repo", deps), { state: "ahead" });
assert.deepEqual(calls[1], ["state", "/repo", deps.gitManager, deps.host, signal]);
await assert.rejects(
  resolveSyncedBranchState("/bad", { ...deps, getSyncedBranchState: async () => { throw new Error("bad state"); } }),
  /bad state/,
);

const success = await overwriteSyncedBranchRepository({ gitRoot: "/git", targetRoot: "/target", status: "success", host: "caller-host", signal: "caller-signal" }, deps);
assert.deepEqual(success, { result: { status: "success" }, refreshRoot: "/target" });
assert.deepEqual(calls[2][1], { gitRoot: "/git", targetRoot: "/target", status: "success", host: deps.host, signal, gitManager: deps.gitManager });
assert.equal((await overwriteSyncedBranchRepository({ gitRoot: "/git", status: "updated" }, deps)).refreshRoot, "/git");
assert.equal((await overwriteSyncedBranchRepository({ gitRoot: "/git", targetRoot: "/target", status: "command-error" }, deps)).refreshRoot, null);

console.log("11 worker git synced branch request handler assertions passed");
