import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createWorktreeSnapshotCommitMessage, createWorktreeSnapshotRef, parsePushedRemoteBranches } = require("../app/.vite/build/worker/git-worktree-snapshot-policy.js");
assert.equal(createWorktreeSnapshotRef("abc"), "codex/worktree-snapshot/abc");
assert.equal(createWorktreeSnapshotCommitMessage("abc"), "Codex worktree snapshot: abc");
assert.deepEqual(parsePushedRemoteBranches("a1 refs/heads/main (push)\na1 refs/heads/other (push)\nb2 refs/heads/dev (fetch)\ninvalid"), { a1: "refs/heads/main" });
assert.deepEqual(parsePushedRemoteBranches(""), {});
console.log("4 worker worktree snapshot policy assertions passed");
