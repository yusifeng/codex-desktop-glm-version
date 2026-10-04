import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  createGitLiveQueryState,
  getGitLiveQueryBranchDependencyKey,
  getGitLiveQueryRepositoryKey,
  getGitLiveQuerySharedKey,
} = require("../app/.vite/build/worker/git-live-query-state.js");

const host = { id: "host-1", isLocal: true };
const params = {
  commonDir: "/common",
  host,
  query: { method: "status-summary", params: { includeUntrackedFiles: true } },
  requiresRecovery: false,
  root: "/repo",
  subscriptionId: "subscription-1",
  trace: { traceparent: "00-abc-01" },
};
const state = createGitLiveQueryState(params, 7);
assert.equal(state.generation, 7);
assert.equal(state.dirty, true);
assert.equal(state.trigger, "subscription");
assert.deepEqual(state.refreshWaiters, []);
assert.equal(getGitLiveQueryRepositoryKey(state), "host-1\0/common");
assert.equal(getGitLiveQuerySharedKey(state), "host-1\0/common\0/repo\0[\"status-summary\",{\"includeUntrackedFiles\":true}]");
assert.equal(getGitLiveQueryBranchDependencyKey({ hostId: "host-1", commonDir: "/common", root: "/repo", branch: "main" }), "host-1\0/common\0/repo\0main");
console.log("7 worker git live-query state assertions passed");
