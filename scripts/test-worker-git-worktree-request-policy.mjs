import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worktree-request-policy-"));
const out = path.join(dir, "policy.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/git-worktree-request-policy.ts")],
  outfile: out,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { getWorktreeMutationMethod } = createRequire(import.meta.url)(out);

const methods = [
  "restore-worktree",
  "delete-worktree",
  "cancel-worktree-upstream-refresh",
  "move-thread-to-local",
  "move-thread-to-worktree",
  "move-thread-to-host-worktree",
  "cleanup-host-handoff-transfer",
];
for (const method of methods) assert.equal(getWorktreeMutationMethod(method), method);
for (const method of ["availability", "list-worktrees", "", "delete-worktree-extra"])
  assert.equal(getWorktreeMutationMethod(method), null);
assert.equal(methods.length + 4, 11);
console.log("11 worker git worktree request policy assertions passed");
