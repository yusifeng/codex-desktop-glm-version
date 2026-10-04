import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  disposeGitInitWatch,
  recoverGitLiveQueries,
  subscribeGitLiveQuery,
  unwatchGitRepository,
  watchGitRepository,
} = require("../app/.vite/build/worker/git-watch-request-handlers.js");
const { prepareGitLiveQuerySubscription } = require("../app/.vite/build/worker/git-live-query-subscription-setup.js");

const calls = [];
let existingWatch = null;
let stableMetadata = null;
const deps = {
  gitManager: {
    getPendingStableMetadataTrace: () => "metadata-trace",
    getStableMetadata: async (...args) => {
      calls.push(["metadata", ...args]);
      return stableMetadata;
    },
  },
  host: { id: "host" },
  signal: new AbortController().signal,
  liveQueryRegistry: {
    recover: async (options) => calls.push(["recover", options]),
    subscribe: (options) => calls.push(["subscribe", options]),
    unsubscribe: (id) => calls.push(["unsubscribe", id]),
  },
  disposeGitInitWatcher: (...args) => calls.push(["dispose", ...args]),
  getExistingWatch: (root) => {
    calls.push(["existing", root]);
    return existingWatch;
  },
  ensureWatching: async (...args) => {
    calls.push(["ensure", ...args]);
    return () => calls.push(["release"]);
  },
  resolveQueryRoot: (query) => query.params.root,
  trace: async (options, operation) => {
    calls.push(["trace", options]);
    return operation();
  },
  unwatchRepo: (...args) => calls.push(["unwatch", ...args]),
  waitForAbort: async (signal) => calls.push(["wait", signal]),
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

calls.length = 0;
stableMetadata = { root: "/repo", commonDir: "/common" };
existingWatch = { startTrace: "watch-trace", watcher: { requiresRecovery: false } };
const query = { method: "current-branch", params: { root: "/repo" } };
await subscribeGitLiveQuery({ query, subscriptionId: "subscription", trace: "request-trace" }, deps);
assert.deepEqual(calls.filter(([name]) => name === "trace").map(([, options]) => options.name), [
  "git.subscription_setup",
  "git.metadata_lookup",
  "git.watcher_start",
]);
assert.deepEqual(calls.find(([name]) => name === "subscribe")[1], {
  commonDir: "/common",
  host: deps.host,
  query,
  requiresRecovery: false,
  root: "/repo",
  subscriptionId: "subscription",
  trace: "request-trace",
});
assert.deepEqual(calls.slice(-3).map(([name]) => name), ["wait", "unsubscribe", "release"]);
const metadataTrace = calls.find(([, options]) => options?.name === "git.metadata_lookup")[1];
assert.deepEqual(metadataTrace.links, ["metadata-trace"]);

calls.length = 0;
const prepared = await prepareGitLiveQuerySubscription({ query, trace: "direct-trace" }, deps);
assert.deepEqual(prepared.metadata, { root: "/repo", commonDir: "/common" });
assert.equal(typeof prepared.releaseWatch, "function");
assert.deepEqual(calls.filter(([name]) => name === "trace").map(([, options]) => options.name), [
  "git.subscription_setup",
  "git.metadata_lookup",
  "git.watcher_start",
]);
prepared.releaseWatch();
assert.equal(calls.at(-1)[0], "release");

calls.length = 0;
stableMetadata = null;
await assert.rejects(
  subscribeGitLiveQuery({ query, subscriptionId: "missing" }, deps),
  /requires repository metadata/,
);
assert.equal(calls.some(([name]) => name === "ensure"), false);

calls.length = 0;
stableMetadata = { root: "/repo", commonDir: "/common" };
const aborted = new AbortController();
aborted.abort();
deps.signal = aborted.signal;
await subscribeGitLiveQuery({ query, subscriptionId: "aborted" }, deps);
assert.equal(calls.some(([name]) => name === "ensure" || name === "subscribe"), false);

calls.length = 0;
deps.signal = new AbortController().signal;
deps.waitForAbort = async () => {
  calls.push(["wait"]);
  throw new Error("wait failed");
};
await assert.rejects(
  subscribeGitLiveQuery({ query, subscriptionId: "wait-error" }, deps),
  /wait failed/,
);
assert.deepEqual(calls.slice(-3).map(([name]) => name), ["wait", "unsubscribe", "release"]);

calls.length = 0;
deps.waitForAbort = async () => {};
const subscribe = deps.liveQueryRegistry.subscribe;
deps.liveQueryRegistry.subscribe = () => { throw new Error("subscribe failed"); };
await assert.rejects(
  subscribeGitLiveQuery({ query, subscriptionId: "subscribe-error" }, deps),
  /subscribe failed/,
);
assert.equal(calls.at(-1)[0], "release");
assert.equal(calls.some(([name]) => name === "unsubscribe"), false);
deps.liveQueryRegistry.subscribe = subscribe;

console.log("30 worker git watch request handler assertions passed");
