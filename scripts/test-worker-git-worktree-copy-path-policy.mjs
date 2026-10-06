import assert from "node:assert/strict";
import { splitGitWorktreeNullSeparatedPaths } from "../app/.vite/build/worker/git-worktree-copy-path-policy.js";
assert.deepEqual(splitGitWorktreeNullSeparatedPaths("a\0\0b\0"), ["a", "b"]);
console.log("worker git worktree copy path policy assertions passed (1)");
