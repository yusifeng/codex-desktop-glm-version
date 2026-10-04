import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getGitLiveQueryBranchDependency,
  updateGitLiveQueryBranchDependency,
} = require("../app/.vite/build/worker/git-live-query-branch-dependency.js");

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};
const key = (value) => `${value.hostId}\0${value.commonDir}\0${value.root}\0${value.branch}`;
const state = (method, params) => ({
  host: { id: "host" },
  commonDir: "/common",
  root: "/repo",
  query: { method, params },
});

deepEqual(
  getGitLiveQueryBranchDependency(
    state("review-summary", { source: "branch", baseBranch: " refs/heads/topic " }),
  ),
  { hostId: "host", commonDir: "/common", root: "/repo", branch: "topic" },
);
deepEqual(
  getGitLiveQueryBranchDependency(state("branch-commits", { baseBranch: "feature" })),
  { hostId: "host", commonDir: "/common", root: "/repo", branch: "feature" },
);
equal(getGitLiveQueryBranchDependency(state("review-summary", { source: "commit" })), null);
equal(getGitLiveQueryBranchDependency(state("status-summary", {})), null);
equal(getGitLiveQueryBranchDependency(state("branch-commits", { baseBranch: "  " })), null);

const dependencies = new Map();
const branchState = state("branch-diff-stats", { baseBranch: "topic" });
updateGitLiveQueryBranchDependency(dependencies, branchState, 1, key);
updateGitLiveQueryBranchDependency(dependencies, branchState, 1, key);
equal(dependencies.get("host\0/common\0/repo\0topic"), 2);
updateGitLiveQueryBranchDependency(dependencies, branchState, -1, key);
equal(dependencies.get("host\0/common\0/repo\0topic"), 1);
updateGitLiveQueryBranchDependency(dependencies, branchState, -1, key);
equal(dependencies.has("host\0/common\0/repo\0topic"), false);

console.log(`${count} worker git live-query branch dependency assertions passed`);
