import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createGitWorktreeIdentity } = require("../app/.vite/build/worker/git-worktree-identity-policy.js");

assert.equal(await createGitWorktreeIdentity(""), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
assert.equal(await createGitWorktreeIdentity("/repo/worktree"), "36cf64691a80d01cc83c726e7d3549d7e862d39c");
assert.equal(await createGitWorktreeIdentity("C:\\repo\\worktree"), "e7b11eda70c6f74b75fe998e5cb723c63dd3c5bf");

console.log("3 worker git worktree identity assertions passed");
