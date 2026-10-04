import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worktree-mutation-dispatch-"));
const output = path.join(tempDir, "git-worktree-mutation-dispatch.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/git-worktree-mutation-dispatch.ts")], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { dispatchWorktreeMutationRequest } = createRequire(import.meta.url)(output);

const calls = [];
const host = { id: "local" };
const deps = {
  gitManager: { getWorktreeRepositoryForRoot: (rootPath) => ({ root: rootPath }) , invalidateUntrackedPathsCache() {}, invalidateShortLivedGitReadCaches() {} },
  host,
  signal: new AbortController().signal,
  emit: event => calls.push(["emit", event]),
  scheduleRestore: async (...args) => { calls.push(["restore", ...args]); return true; },
  scheduleDelete: async (...args) => { calls.push(["delete", ...args]); return "worktree-id"; },
  unwatchRepository: (...args) => calls.push(["unwatch", ...args]),
  normalizeWorktreePath: value => value,
  setOwnerThread: async (...args) => calls.push(["owner", ...args]),
  warn: (...args) => calls.push(["warn", ...args]),
  moveToLocal: async (...args) => { calls.push(["local", ...args]); return { success: true }; },
  moveToWorktree: async (...args) => { calls.push(["worktree", ...args]); return { success: true }; },
  moveToHostWorktree: async (...args) => { calls.push(["host-worktree", ...args]); return { success: true }; },
  createExecutionHost: config => ({ id: config.id }),
  cleanupHostTransfer: async (...args) => calls.push(["cleanup", ...args]),
  upstreamRefreshControllers: new Map(),
  listCodexWorktrees: async () => [],
  listWorktrees: async () => ({ worktrees: [] }),
};

assert.equal((await dispatchWorktreeMutationRequest("restore-worktree", { repoRoot: "/repo", worktreePath: "/repo/.wt", cwd: "/repo", conversationId: "t" }, "1", deps)).result.success, true);
assert.deepEqual((await dispatchWorktreeMutationRequest("delete-worktree", { worktree: "/repo/.wt" }, "2", deps)).result, { success: true, worktreeId: "worktree-id" });
assert.deepEqual((await dispatchWorktreeMutationRequest("move-thread-to-worktree", { operationId: "op" }, "3", deps)).result, { success: true });
assert.equal((await dispatchWorktreeMutationRequest("unknown", {}, "4", deps)).handled, false);
console.log("test-worker-git-worktree-mutation-dispatch: 6 assertions passed");
