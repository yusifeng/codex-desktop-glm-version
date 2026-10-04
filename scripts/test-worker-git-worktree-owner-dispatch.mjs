import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worktree-owner-dispatch-"));
const output = path.join(tempDir, "git-worktree-owner-dispatch.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/git-worktree-owner-dispatch.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { dispatchWorktreeOwnerRequest } = createRequire(import.meta.url)(output);

const calls = [];
const manager = {
  getWorktreeRepositoryForRoot(rootPath, host) {
    calls.push(["repository", rootPath, host]);
    return { root: rootPath, host };
  },
};
const host = { id: "local" };
const signal = new AbortController().signal;
const deps = {
  gitManager: manager,
  host,
  signal,
  setOwnerThread: async (...args) => calls.push(["owner", ...args]),
};

assert.deepEqual(
  await dispatchWorktreeOwnerRequest("set-worktree-owner-thread", {
    worktree: "/repo/.worktree",
    conversationId: "thread-1",
  }, deps),
  { handled: true, result: { success: true } },
);
assert.deepEqual(calls[0], ["repository", "/repo/.worktree", host]);
assert.equal(calls[1][0], "owner");
assert.equal(calls[1][2], "thread-1");
assert.equal(calls[1][3], signal);
assert.deepEqual(
  await dispatchWorktreeOwnerRequest("unknown", {}, deps),
  { handled: false, result: undefined },
);
await assert.rejects(
  () => dispatchWorktreeOwnerRequest("set-worktree-owner-thread", { worktree: "/repo", conversationId: "thread-2" }, {
    ...deps,
    setOwnerThread: async () => { throw new Error("owner write failed"); },
  }),
  /owner write failed/,
);
console.log("test-worker-git-worktree-owner-dispatch: 6 assertions passed");
