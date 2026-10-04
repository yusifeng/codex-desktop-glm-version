import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worktree-create-dispatch-"));
const output = path.join(tempDir, "git-worktree-create-dispatch.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/git-worktree-create-dispatch.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { dispatchWorktreeCreateRequest } = createRequire(import.meta.url)(output);

const calls = [];
const deps = {
  gitManager: {},
  host: { id: "local" },
  signal: new AbortController().signal,
  emit: () => {},
  upstreamRefreshControllers: new Map(),
  createWorktree: async (params) => {
    calls.push(params);
    return { success: true, worktreeGitRoot: "/repo/worktree", worktreeWorkspaceRoot: "/repo/worktree" };
  },
};

const params = { cwd: "/repo", name: "feature" };
const handled = await dispatchWorktreeCreateRequest("create-worktree", params, deps);
assert.equal(handled.handled, true);
assert.deepEqual(handled.result, {
  type: "ok",
  value: { worktreeGitRoot: "/repo/worktree", worktreeWorkspaceRoot: "/repo/worktree", setupError: null },
});
assert.equal(calls.length, 1);
assert.equal(calls[0].workspaceRoot, "/repo");

const unknown = await dispatchWorktreeCreateRequest("unknown", params, deps);
assert.deepEqual(unknown, { handled: false, result: undefined });
assert.equal(calls.length, 1);

console.log("worker worktree create dispatch tests passed (5 assertions)");
