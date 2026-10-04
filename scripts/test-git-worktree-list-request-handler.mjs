import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveWorktreeList } = require("../app/.vite/build/worker/git-worktree-list-request-handler.js");
const signal = new AbortController().signal;
const repository = { root: "/repo" };
let calls = 0;
assert.deepEqual(await resolveWorktreeList("/repo", { id: "local" }, signal, {
  getWorktreeRepository: async () => repository,
  listWorktrees: async (value, requestSignal) => { calls++; assert.equal(value, repository); assert.equal(requestSignal, signal); return [{ path: "/repo" }]; },
}), { worktrees: [{ path: "/repo" }] });
assert.equal(calls, 1);
assert.deepEqual(await resolveWorktreeList("/missing", { id: "local" }, signal, {
  getWorktreeRepository: async () => null,
  listWorktrees: async () => { throw new Error("must not list a missing repository"); },
}), { worktrees: [] });
console.log("test-git-worktree-list-request-handler: 5 assertions passed");
