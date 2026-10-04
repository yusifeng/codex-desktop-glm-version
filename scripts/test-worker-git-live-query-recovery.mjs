import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { recoverGitLiveQueries } = require("../app/.vite/build/worker/git-live-query-recovery.js");

const calls = [];
let metadata = null;
const deps = {
  host: { id: "host-1" },
  gitManager: { getStableMetadata: async (...args) => { calls.push(["metadata", ...args]); return metadata; } },
  liveQueryRegistry: { recover: async (options) => calls.push(["recover", options]) },
};

await recoverGitLiveQueries({ cwd: null, subscriptionIds: ["a"] }, deps);
assert.deepEqual(calls, [["recover", { hostId: "host-1", root: undefined, subscriptionIds: ["a"] }]]);

calls.length = 0;
metadata = { root: "/repo", commonDir: "/common" };
await recoverGitLiveQueries({ cwd: "/cwd", subscriptionIds: ["b", "c"] }, deps);
assert.deepEqual(calls, [
  ["metadata", "/cwd", deps.host],
  ["recover", { hostId: "host-1", root: "/repo", subscriptionIds: ["b", "c"] }],
]);

calls.length = 0;
metadata = null;
await recoverGitLiveQueries({ cwd: "/missing", subscriptionIds: ["ignored"] }, deps);
assert.deepEqual(calls, [["metadata", "/missing", deps.host]]);

console.log("3 worker git live-query recovery assertions passed");
