import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { deleteGitWorktreeLifecycle } = require("../app/.vite/build/worker/git-worktree-delete-lifecycle-controller.js");
const calls = [];
const id = await deleteGitWorktreeLifecycle({ worktree: { root: "/repo" }, host: { id: "local" }, reason: "user", force: true, getWorktreeId: async () => "wt-1", logInfo: (message) => calls.push(message), logWarning: (message) => calls.push(message), deleteWithSnapshot: async (...args) => calls.push(["delete", ...args.slice(1)]) });
assert.equal(id, "wt-1"); assert.deepEqual(calls, ["[worktree-delete] worker-start", ["delete", { id: "local" }, "user", true], "[worktree-delete] worker-success"]);
calls.length = 0; await assert.rejects(() => deleteGitWorktreeLifecycle({ worktree: {}, host: null, reason: "cleanup", force: false, getWorktreeId: async () => "wt-2", logInfo: (message) => calls.push(message), logWarning: (message) => calls.push(message), deleteWithSnapshot: async () => { throw new Error("failed"); } }), /failed/); assert.deepEqual(calls, ["[worktree-delete] worker-start", "[worktree-delete] worker-failed"]); console.log("6 worker worktree-delete lifecycle controller assertions passed");
