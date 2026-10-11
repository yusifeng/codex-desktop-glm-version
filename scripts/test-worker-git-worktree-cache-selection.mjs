import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { selectGitCachedWorktrees } = require("../app/.vite/build/worker/git-worktree-cache-selection.js");
const worktrees = [{ root: "/repo/a" }, { root: "/repo/b" }];
const related = (worktree, cwd) => worktree.root === cwd;

assert.deepEqual(selectGitCachedWorktrees(worktrees, null, [], related), worktrees);
assert.deepEqual(selectGitCachedWorktrees(worktrees, [], [], related), []);
assert.deepEqual(selectGitCachedWorktrees(worktrees, ["/repo/a"], ["/repo/a"], related), [worktrees[0]]);
assert.deepEqual(selectGitCachedWorktrees(worktrees, ["/missing"], ["/missing"], related), worktrees);

console.log("4 worker git worktree cache selection assertions passed");
