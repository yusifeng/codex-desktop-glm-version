import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";
import os from "node:os";
import fs from "node:fs/promises";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worktree-branch-policy-"));
const output = path.join(tempDir, "policy.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/git-worktree-branch-setup-policy.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { shouldSetUpSyncedBranch, resolveSyncedBranchSetup } = createRequire(import.meta.url)(output);

const local = { type: "branch", remoteRef: null };
assert.equal(shouldSetUpSyncedBranch({ branch: "feature", defaultBranch: "main", startingState: local }), true);
assert.equal(shouldSetUpSyncedBranch({ branch: "main", defaultBranch: "main", startingState: local }), false);
assert.equal(shouldSetUpSyncedBranch({ branch: null, defaultBranch: "main", startingState: local }), false);
assert.equal(shouldSetUpSyncedBranch({ branch: undefined, defaultBranch: "main", startingState: local }), false);
assert.equal(shouldSetUpSyncedBranch({ setUpSyncedBranch: false, branch: "feature", defaultBranch: "main", startingState: local }), false);
assert.equal(shouldSetUpSyncedBranch({ branch: "feature", defaultBranch: null, startingState: local }), true);
assert.equal(shouldSetUpSyncedBranch({ branch: "feature", defaultBranch: "main", startingState: { type: "branch", remoteRef: "origin/feature" } }), false);
assert.equal(shouldSetUpSyncedBranch({ branch: "feature", defaultBranch: "main", startingState: { type: "remote", remoteRef: "origin/feature" } }), true);
assert.equal(shouldSetUpSyncedBranch({ branch: "feature", defaultBranch: "feature", startingState: { type: "commit" } }), false);
assert.equal(shouldSetUpSyncedBranch({ branch: "release", defaultBranch: "main", startingState: { type: "commit" } }), true);
assert.deepEqual(resolveSyncedBranchSetup({ branch: "feature/foo", defaultBranch: "main", startingState: local }, (branch) => `refs/heads/${branch}`), { branch: "feature/foo", branchRef: "refs/heads/feature/foo" });
assert.equal(resolveSyncedBranchSetup({ branch: "main", defaultBranch: "main", startingState: local }, (branch) => `refs/heads/${branch}`), null);

console.log("12 worker git worktree branch setup policy assertions passed");
