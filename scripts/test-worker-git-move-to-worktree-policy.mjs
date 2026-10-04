import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";
import os from "node:os";
import fs from "node:fs/promises";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-move-worktree-policy-"));
const output = path.join(tempDir, "policy.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/git-move-to-worktree-policy.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { validateMoveToWorktreeParams } = createRequire(import.meta.url)(output);

const valid = validateMoveToWorktreeParams({ sourceBranch: " feature ", defaultBranch: "main" });
assert.deepEqual(valid, { worktreeCheckoutBranch: "feature", warnings: [] });
assert.equal(validateMoveToWorktreeParams({ sourceBranch: "", defaultBranch: "main" }).error.error, "invalid-params");
assert.equal(validateMoveToWorktreeParams({ sourceBranch: "main", defaultBranch: "main" }).error.message, "Move to worktree is not available on the default branch");
assert.equal(validateMoveToWorktreeParams({ sourceBranch: "feature", worktreeCheckoutBranch: "main", defaultBranch: "main" }).error.error, "default-branch-blocked");
assert.equal(validateMoveToWorktreeParams({ sourceBranch: "feature", worktreeCheckoutBranch: "  ", defaultBranch: "main" }).error.message, "Missing worktree checkout branch");
assert.equal(validateMoveToWorktreeParams({ sourceBranch: "feature", defaultBranch: null }).worktreeCheckoutBranch, "feature");
assert.deepEqual(validateMoveToWorktreeParams({ sourceBranch: "feature", defaultBranch: "main" }).warnings, []);

console.log("6 worker move-to-worktree policy assertions passed");
