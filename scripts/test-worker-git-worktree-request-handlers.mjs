import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  cancelWorktreeUpstreamRefresh,
  cleanupHostHandoffTransfer,
  createHandoffProgressReporter,
  deleteWorktree,
  moveThreadToHostWorktree,
  moveThreadToLocal,
  moveThreadToWorktree,
  resolveCodexWorktrees,
  resolveWorktrees,
  restoreWorktree,
  setWorktreeOwnerThread,
} = require("../app/.vite/build/worker/git-worktree-request-handlers.js");

const calls = [];
const host = { id: "source-host" };
const destinationHost = { id: "destination-host" };
const signal = new AbortController().signal;
let restoreResult = true;
let moveResult = { status: "success" };
let ownerError = null;
let hostMoveError = null;
const refreshController = new AbortController();
const gitManager = {
  getWorktreeRepositoryForRoot(root, targetHost) {
    calls.push(["repository", root, targetHost]);
    return { root, host: targetHost };
  },
  invalidateUntrackedPathsCache(targetHost) {
    calls.push(["invalidate-untracked", targetHost]);
  },
  invalidateShortLivedGitReadCaches(targetHost) {
    calls.push(["invalidate-short-lived", targetHost]);
  },
};
const deps = {
  gitManager,
  host,
  signal,
  emit: (event) => calls.push(["emit", event]),
  scheduleRestore: async (...args) => {
    calls.push(["restore", ...args]);
    return restoreResult;
  },
  scheduleDelete: async (...args) => {
    calls.push(["delete", ...args]);
    return "worktree-id";
  },
  unwatchRepository: (...args) => calls.push(["unwatch", ...args]),
  normalizeWorktreePath: (value) => `normalized:${value}`,
  setOwnerThread: async (...args) => {
    calls.push(["set-owner", ...args]);
    if (ownerError != null) throw ownerError;
  },
  warn: (...args) => calls.push(["warn", ...args]),
  moveToLocal: async (...args) => {
    calls.push(["move-local", ...args]);
    return moveResult;
  },
  moveToWorktree: async (...args) => {
    calls.push(["move-worktree", ...args]);
    return moveResult;
  },
  moveToHostWorktree: async (...args) => {
    calls.push(["move-host", ...args]);
    if (hostMoveError != null) throw hostMoveError;
    return moveResult;
  },
  createExecutionHost: (config) => {
    calls.push(["create-host", config]);
    return destinationHost;
  },
  cleanupHostTransfer: async (...args) => calls.push(["cleanup", ...args]),
  upstreamRefreshControllers: new Map([["pending", refreshController]]),
  listCodexWorktrees: async (...args) => {
    calls.push(["codex-worktrees", ...args]);
    return ["codex-worktree"];
  },
  listWorktrees: async (...args) => {
    calls.push(["list-worktrees", ...args]);
    return ["worktree"];
  },
};

const progressEvents = [];
createHandoffProgressReporter(42, undefined, "to-local", (event) => progressEvents.push(event))(
  "copy-files",
  "started",
);
assert.deepEqual(progressEvents[0], {
  type: "worker-event",
  event: {
    type: "thread-handoff-progress",
    operationId: "42",
    direction: "to-local",
    step: "copy-files",
    status: "started",
  },
});
createHandoffProgressReporter(42, "operation", "to-worktree", (event) => progressEvents.push(event))(
  "complete",
  "done",
);
assert.equal(progressEvents[1].event.operationId, "operation");
assert.equal(progressEvents[1].event.direction, "to-worktree");

const restoreParams = {
  repoRoot: "/repo",
  worktreePath: "/repo/worktree",
  cwd: "/repo/subdir",
  conversationId: "thread-1",
};
calls.length = 0;
restoreResult = false;
assert.deepEqual(await restoreWorktree(restoreParams, deps), { success: false });
assert.deepEqual(calls, [["restore", "/repo", "/repo/worktree", "/repo/subdir", host, signal]]);

calls.length = 0;
restoreResult = true;
assert.deepEqual(await restoreWorktree(restoreParams, deps), { success: true });
assert.deepEqual(calls[1], ["repository", "normalized:/repo/worktree", host]);
assert.deepEqual(calls[2], [
  "set-owner",
  { root: "normalized:/repo/worktree", host },
  "thread-1",
  signal,
]);

calls.length = 0;
ownerError = new Error("owner failed");
assert.deepEqual(await restoreWorktree(restoreParams, deps), { success: true });
assert.equal(calls.at(-1)[0], "warn");
assert.equal(calls.at(-1)[1], "[worktree-restore] failed to set restored worktree owner thread");
assert.deepEqual(calls.at(-1)[2].safe, {
  worktreePath: "/repo/worktree",
  conversationId: "thread-1",
});
assert.equal(calls.at(-1)[2].sensitive.error, ownerError);
ownerError = null;

calls.length = 0;
assert.deepEqual(await deleteWorktree({ worktree: "/repo/worktree", value: 1 }, deps), {
  success: true,
  worktreeId: "worktree-id",
});
assert.deepEqual(calls, [
  ["delete", { worktree: "/repo/worktree", value: 1 }, host],
  ["unwatch", "/repo/worktree", host],
]);

calls.length = 0;
moveResult = { status: "moved" };
assert.equal(await moveThreadToLocal({ operationId: "local-op", value: 1 }, 7, deps), moveResult);
const localOptions = calls[0][2];
assert.equal(calls[0][0], "move-local");
assert.equal(localOptions.host, host);
assert.equal(localOptions.gitManager, gitManager);
assert.equal(localOptions.signal, signal);
localOptions.onProgress("prepare", "started");
assert.equal(calls.at(-1)[1].event.operationId, "local-op");
assert.equal(calls.at(-1)[1].event.direction, "to-local");

calls.length = 0;
assert.equal(await moveThreadToWorktree({ value: 2 }, 8, deps), moveResult);
const worktreeOptions = calls[0][2];
worktreeOptions.onProgress("checkout", "complete");
assert.equal(calls.at(-1)[1].event.operationId, "8");
assert.equal(calls.at(-1)[1].event.direction, "to-worktree");

calls.length = 0;
const hostParams = { destinationHostConfig: { kind: "ssh" }, operationId: "host-op" };
assert.equal(await moveThreadToHostWorktree(hostParams, 9, deps), moveResult);
assert.deepEqual(calls[0], ["create-host", hostParams.destinationHostConfig]);
const hostOptions = calls[1][2];
assert.equal(hostOptions.sourceHost, host);
assert.equal(hostOptions.destinationHost, destinationHost);
hostOptions.onProgress("transfer", "started");
assert.equal(calls.at(-1)[1].event.direction, "to-host-worktree");
assert.deepEqual(calls.slice(2, 4), [
  ["invalidate-untracked", destinationHost],
  ["invalidate-short-lived", destinationHost],
]);

calls.length = 0;
hostMoveError = new Error("move failed");
await assert.rejects(moveThreadToHostWorktree(hostParams, 9, deps), hostMoveError);
assert.deepEqual(calls.slice(-2), [
  ["invalidate-untracked", destinationHost],
  ["invalidate-short-lived", destinationHost],
]);
hostMoveError = null;

calls.length = 0;
assert.deepEqual(await cleanupHostHandoffTransfer({ rolloutPath: "/tmp/rollout" }, deps), {
  success: true,
});
assert.deepEqual(calls, [["cleanup", "/tmp/rollout", host]]);

assert.deepEqual(
  cancelWorktreeUpstreamRefresh({ pendingWorktreeId: "missing" }, deps),
  { success: false },
);
assert.equal(refreshController.signal.aborted, false);
assert.deepEqual(
  cancelWorktreeUpstreamRefresh({ pendingWorktreeId: "pending" }, deps),
  { success: true },
);
assert.equal(refreshController.signal.aborted, true);

calls.length = 0;
assert.deepEqual(await resolveCodexWorktrees({ worktreesRoot: "/managed" }, deps), {
  worktrees: ["codex-worktree"],
});
assert.deepEqual(calls, [["codex-worktrees", gitManager, host, "/managed"]]);

calls.length = 0;
assert.deepEqual(await resolveWorktrees({ cwd: "/repo" }, deps), ["worktree"]);
assert.deepEqual(calls, [["list-worktrees", "/repo", host, signal]]);

calls.length = 0;
assert.deepEqual(
  await setWorktreeOwnerThread(
    { worktree: "/repo/worktree", conversationId: "thread-2" },
    deps,
  ),
  { success: true },
);
assert.deepEqual(calls, [
  ["repository", "/repo/worktree", host],
  ["set-owner", { root: "/repo/worktree", host }, "thread-2", signal],
]);

console.log("45 worker git worktree request handler assertions passed");
