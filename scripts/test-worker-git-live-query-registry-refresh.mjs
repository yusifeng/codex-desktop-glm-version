import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  handleGitLiveQueryRepoChanged,
  recoverGitLiveQueries,
  refreshGitLiveQueryRepository,
  setGitLiveQueryRecovery,
} = require("../app/.vite/build/worker/git-live-query-registry-refresh.js");

let assertions = 0;
const equal = (actual, expected) => { assertions += 1; assert.equal(actual, expected); };
const states = new Map([
  ["a", { subscriptionId: "a", host: { id: "local" }, commonDir: "/repo/.git", root: "/repo", query: { method: "status-summary" }, requiresRecovery: true }],
  ["b", { subscriptionId: "b", host: { id: "local" }, commonDir: "/repo/.git", root: "/repo", query: { method: "current-branch" }, requiresRecovery: false }],
  ["c", { subscriptionId: "c", host: { id: "remote" }, commonDir: "/repo/.git", root: "/repo", query: { method: "status-summary" }, requiresRecovery: true }],
]);
const refreshes = [];
const recoveries = [];
const registry = {
  states,
  dependencies: { getActiveTrace: () => ({ traceId: "trace" }), prepareRecovery: (root, host) => recoveries.push([root, host.id]) },
  refreshStates: async (selected, trigger, trace) => { refreshes.push({ ids: selected.map((state) => state.subscriptionId), trigger, trace }); },
};

await handleGitLiveQueryRepoChanged(registry, { hostId: "local", commonDir: "/repo/.git", root: "/repo", changeType: "head", trace: { traceId: "event" } }, (count) => equal(count, 2));
equal(refreshes.at(-1).ids.join(","), "a,b");
equal(refreshes.at(-1).trigger, "invalidation");
equal(refreshes.at(-1).trace.traceId, "event");

await setGitLiveQueryRecovery(registry, "local", "/repo", true);
equal(refreshes.at(-1).ids.join(","), "b");
equal(refreshes.at(-1).trigger, "recovery");
equal(states.get("b").requiresRecovery, true);

await recoverGitLiveQueries(registry, { subscriptionIds: ["a", "b", "c"], hostId: "local" });
equal(recoveries.length, 1);
equal(recoveries[0][0], "/repo");
equal(refreshes.at(-1).ids.join(","), "a,b");

await refreshGitLiveQueryRepository(registry, "remote", "/repo");
equal(refreshes.at(-1).ids.join(","), "c");
equal(refreshes.at(-1).trigger, "mutation");

console.log(`test-worker-git-live-query-registry-refresh: ${assertions} assertions passed`);
