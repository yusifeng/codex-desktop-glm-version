import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  disposeGitInitWatch,
  recoverGitLiveQueries,
  unwatchGitRepository,
  watchGitRepository,
} = require("../app/.vite/build/worker/git-watch-request-handlers.js");

const calls = [];
let existingWatch = null;
let stableMetadata = null;
const deps = {
  gitManager: {
    getStableMetadata: async (...args) => {
      calls.push(["metadata", ...args]);
      return stableMetadata;
    },
  },
  host: { id: "host" },
  liveQueryRegistry: {
    recover: async (options) => calls.push(["recover", options]),
  },
  disposeGitInitWatcher: (...args) => calls.push(["dispose", ...args]),
  getExistingWatch: (root) => {
    calls.push(["existing", root]);
    return existingWatch;
  },
  ensureWatching: async (...args) => calls.push(["ensure", ...args]),
  trace: async (options, operation) => {
    calls.push(["trace", options]);
    return operation();
  },
  unwatchRepo: (...args) => calls.push(["unwatch", ...args]),
};

assert.deepEqual(disposeGitInitWatch("/cwd", deps), { success: true });
assert.deepEqual(calls.pop(), ["dispose", "/cwd", deps.host]);
assert.deepEqual(unwatchGitRepository("/repo", deps), { success: true });
assert.deepEqual(calls.pop(), ["unwatch", "/repo", deps.host]);

calls.length = 0;
assert.deepEqual(await watchGitRepository({ root: "/repo", commonDir: "/common" }, deps), { success: true });
assert.deepEqual(calls.map(([name]) => name), ["existing", "trace", "ensure"]);
assert.deepEqual(calls[1][1], {
  attributes: {
    "git.watcher_reused": false,
    "worker.id": "git",
    "worker.method": "watch-repo",
  },
  links: [],
  name: "git.watcher_start",
  op: "codex.git.watcher_start",
});
assert.deepEqual(calls[2], ["ensure", { commonDir: "/common", root: "/repo" }, deps.host]);

calls.length = 0;
existingWatch = { startTrace: "trace-link" };
await watchGitRepository({ root: "/repo", commonDir: "/common" }, deps);
assert.equal(calls[1][1].attributes["git.watcher_reused"], true);
assert.deepEqual(calls[1][1].links, ["trace-link"]);

calls.length = 0;
await recoverGitLiveQueries({ cwd: null, subscriptionIds: ["one"] }, deps);
assert.deepEqual(calls, [["recover", { hostId: "host", root: undefined, subscriptionIds: ["one"] }]]);

calls.length = 0;
stableMetadata = { root: "/stable" };
await recoverGitLiveQueries({ cwd: "/cwd", subscriptionIds: ["two"] }, deps);
assert.deepEqual(calls, [
  ["metadata", "/cwd", deps.host],
  ["recover", { hostId: "host", root: "/stable", subscriptionIds: ["two"] }],
]);

calls.length = 0;
stableMetadata = null;
await recoverGitLiveQueries({ cwd: "/missing", subscriptionIds: [] }, deps);
assert.deepEqual(calls, [["metadata", "/missing", deps.host]]);

console.log("13 worker git watch request handler assertions passed");
