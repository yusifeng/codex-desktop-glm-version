import assert from "node:assert/strict";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worktree-list-handler-"));
const output = path.join(tempDir, "handler.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/git-worktree-list-request-handler.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { resolveWorktreeList } = createRequire(import.meta.url)(output);

const signal = new AbortController().signal;
const calls = [];
const repository = { root: "/repo" };
const dependencies = {
  getWorktreeRepository: async (cwd, host) => {
    calls.push(["repository", cwd, host]);
    return repository;
  },
  listWorktrees: async (repo, requestSignal) => {
    calls.push(["list", repo, requestSignal]);
    return [{ path: "/repo/worktree", branch: "feature" }];
  },
};
const host = { id: "local" };
assert.deepEqual(await resolveWorktreeList("/repo", host, signal, dependencies), {
  worktrees: [{ path: "/repo/worktree", branch: "feature" }],
});
assert.deepEqual(calls, [
  ["repository", "/repo", host],
  ["list", repository, signal],
]);

const missing = await resolveWorktreeList("/missing", host, signal, {
  ...dependencies,
  getWorktreeRepository: async () => null,
});
assert.deepEqual(missing, { worktrees: [] });
assert.equal(calls.length, 2);

console.log("5 worker worktree-list request handler assertions passed");
