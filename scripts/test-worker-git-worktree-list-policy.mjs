import assert from "node:assert/strict";
import { parseWorktreeList } from "../app/.vite/build/worker/git-worktree-list-policy.js";

const output = [
  "worktree /repo/main",
  "HEAD abc123",
  "branch refs/heads/main",
  "locked",
  "",
  "worktree /repo/detached",
  "HEAD def456",
  "detached",
  "prunable",
  "",
].join("\n");

assert.deepEqual(parseWorktreeList(output, (root) => `normalized:${root}`), [
  {
    root: "normalized:/repo/main",
    prunable: false,
    locked: true,
    headRef: { sha: "abc123", type: "branch", string: "main" },
  },
  {
    root: "normalized:/repo/detached",
    prunable: true,
    locked: false,
    headRef: { sha: "def456", type: "detached" },
  },
]);
assert.deepEqual(parseWorktreeList("unknown\nworktree \nHEAD ignored\n", (root) => root), []);
assert.deepEqual(parseWorktreeList("", (root) => root), []);

console.log("worker git worktree list policy assertions passed (3)");
