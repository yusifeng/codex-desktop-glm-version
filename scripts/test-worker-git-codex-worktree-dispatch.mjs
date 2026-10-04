import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worktree-dispatch-"));
const output = path.join(tempDir, "git-codex-worktree-dispatch.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/git-codex-worktree-dispatch.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { dispatchCodexWorktreeRequest } = createRequire(import.meta.url)(output);

const gitManager = { id: "manager" };
const host = { id: "local" };
const signal = new AbortController().signal;
let received;
const deps = {
  gitManager,
  host,
  signal,
  listCodexWorktrees: async (...args) => {
    received = args;
    return [{ dir: "/repo/.codex/worktrees/one" }];
  },
};

assert.deepEqual(
  await dispatchCodexWorktreeRequest("codex-worktrees", { worktreesRoot: "/managed" }, deps),
  { handled: true, result: { worktrees: [{ dir: "/repo/.codex/worktrees/one" }] } },
);
assert.deepEqual(received, [gitManager, host, "/managed", signal]);
assert.deepEqual(
  await dispatchCodexWorktreeRequest("unknown", { worktreesRoot: "/managed" }, deps),
  { handled: false, result: undefined },
);
await assert.rejects(
  () => dispatchCodexWorktreeRequest("codex-worktrees", { worktreesRoot: "/managed" }, {
    ...deps,
    listCodexWorktrees: async () => { throw new Error("discovery failed"); },
  }),
  /discovery failed/,
);
console.log("test-worker-git-codex-worktree-dispatch: 4 assertions passed");
