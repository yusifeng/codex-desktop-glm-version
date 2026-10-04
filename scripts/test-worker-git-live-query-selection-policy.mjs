import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  selectGitLiveQueriesForRepoChange,
  selectGitLiveQueriesForRecovery,
  selectGitLiveQueriesForRepository,
} = require("../app/.vite/build/worker/git-live-query-selection-policy.js");

let assertions = 0;
const equal = (actual, expected) => { assertions += 1; assert.equal(actual, expected); };
const states = [
  { subscriptionId: "a", host: { id: "local" }, commonDir: "/repo/.git", root: "/repo", query: { method: "status-summary" }, requiresRecovery: true },
  { subscriptionId: "b", host: { id: "local" }, commonDir: "/repo/.git", root: "/repo", query: { method: "current-branch" }, requiresRecovery: false },
  { subscriptionId: "c", host: { id: "remote" }, commonDir: "/repo/.git", root: "/repo", query: { method: "status-summary" }, requiresRecovery: true },
];
equal(selectGitLiveQueriesForRepoChange(states, { hostId: "local", commonDir: "/repo/.git", root: "/repo", changeType: "head" }, (query) => query.method === "status-summary").length, 1);
equal(selectGitLiveQueriesForRepoChange(states, { hostId: "local", commonDir: "/repo/.git", root: "/repo", changeType: "head" }, () => false).length, 0);
equal(selectGitLiveQueriesForRecovery(states, { subscriptionIds: ["a", "b"], hostId: "local" }).length, 1);
equal(selectGitLiveQueriesForRecovery(states, { subscriptionIds: ["a", "c"], hostId: "local", root: "/repo" }).length, 1);
equal(selectGitLiveQueriesForRepository(states, "local", "/repo").length, 2);
equal(selectGitLiveQueriesForRepository(states, "remote", "/repo")[0].subscriptionId, "c");
console.log(`test-worker-git-live-query-selection-policy: ${assertions} assertions passed`);
