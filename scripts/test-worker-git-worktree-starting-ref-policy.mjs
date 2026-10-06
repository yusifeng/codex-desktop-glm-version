import assert from "node:assert/strict";
import { formatLocalBranchRef, getRemoteStartingRefCandidates, normalizeLocalBranchCandidate } from "../app/.vite/build/worker/git-worktree-starting-ref-policy.js";
assert.equal(formatLocalBranchRef("main"), "refs/heads/main");
assert.equal(normalizeLocalBranchCandidate("refs/tags/v1"), null);
assert.deepEqual(getRemoteStartingRefCandidates("feature/x", ["origin"]), [{ remote: "origin", branchName: "feature/x", ref: "refs/remotes/origin/feature/x" }]);
console.log("worker git worktree starting ref policy assertions passed (3)");
