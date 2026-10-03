import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getRecentBranches, MAX_RECENT_BRANCHES } = require(
  "../app/.vite/build/worker/git-recent-branches.js",
);

let assertions = 0;
const equal = (...args) => {
  assertions += 1;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  assertions += 1;
  assert.deepEqual(...args);
};
const rejects = async (...args) => {
  assertions += 1;
  await assert.rejects(...args);
};

function fixture(overrides = {}) {
  const calls = { fetch: [], git: [], remove: [] };
  const querySignal = new AbortController().signal;
  const repository = {
    root: "/repo",
    host: { id: "local" },
    queryClient: {
      removeQueries: (options) => calls.remove.push(options),
    },
    watchScopedGitReadGeneration: 7,
  };
  const dependencies = {
    fetchQueryWithSignal: async (queryClient, options, signal) => {
      calls.fetch.push({ queryClient, options, signal });
      return options.queryFn(querySignal);
    },
    getLiveQueryMeta: () => ({ family: "live" }),
    getShortLivedQueryMeta: () => ({ family: "short" }),
    queryKey: (...parts) => ["key", ...parts],
    runGit: async (...args) => {
      calls.git.push(args);
      return { success: true, stdout: " feature \nmain\n\nfeature\r\n" };
    },
    staleTime: Infinity,
    ...overrides,
  };
  return { calls, dependencies, querySignal, repository };
}

const outerSignal = new AbortController().signal;
let state = fixture();
deepEqual(
  await getRecentBranches(state.repository, 3, outerSignal, {}, state.dependencies),
  ["feature", "main", "feature"],
);
equal(MAX_RECENT_BRANCHES, 100);
deepEqual(state.calls.git[0][1], [
  "for-each-ref",
  "--count=100",
  "--sort=-committerdate",
  "refs/heads",
  "--format=%(refname:short)",
]);
equal(state.calls.git[0][0], "/repo");
equal(state.calls.git[0][2], state.repository.host);
equal(state.calls.git[0][3].signal, state.querySignal);
equal(state.calls.fetch[0].signal, outerSignal);
equal(state.calls.fetch[0].options.gcTime, 250);
equal(state.calls.fetch[0].options.staleTime, 250);
deepEqual(state.calls.fetch[0].options.meta, { family: "short" });
deepEqual(state.calls.fetch[0].options.queryKey, [
  "key",
  "/repo",
  state.repository.host,
  "recent-branches",
  "short-lived",
]);

for (const [limit, expected] of [
  [0, ["feature"]],
  [-4, ["feature"]],
  [1, ["feature"]],
  [200, ["feature", "main", "feature"]],
]) {
  state = fixture();
  deepEqual(
    await getRecentBranches(state.repository, limit, outerSignal, {}, state.dependencies),
    expected,
  );
}

state = fixture();
deepEqual(
  await getRecentBranches(state.repository, Number.NaN, outerSignal, {}, state.dependencies),
  [],
);

state = fixture();
deepEqual(
  await getRecentBranches(state.repository, 10, outerSignal, { live: true }, state.dependencies),
  ["feature", "main", "feature"],
);
equal(state.calls.fetch[0].options.gcTime, undefined);
equal(state.calls.fetch[0].options.staleTime, Infinity);
deepEqual(state.calls.fetch[0].options.meta, { family: "live" });
deepEqual(state.calls.fetch[0].options.queryKey, [
  "key",
  "/repo",
  state.repository.host,
  "recent-branches",
  "live",
  "7",
]);
equal(state.calls.remove.length, 0);

state = fixture({
  fetchQueryWithSignal: async (_client, options) => {
    state.repository.watchScopedGitReadGeneration = 8;
    return options.queryFn(state.querySignal);
  },
});
await getRecentBranches(state.repository, 10, outerSignal, { live: true }, state.dependencies);
deepEqual(state.calls.remove, [{
  queryKey: ["key", "/repo", state.repository.host, "recent-branches", "live", "7"],
  exact: true,
}]);

state = fixture({ runGit: async () => ({ success: false, stdout: "ignored" }) });
deepEqual(await getRecentBranches(state.repository, 10, outerSignal, {}, state.dependencies), []);

const aborted = new AbortController();
aborted.abort();
state = fixture({
  fetchQueryWithSignal: async () => {
    throw new Error("aborted query");
  },
});
deepEqual(await getRecentBranches(state.repository, 10, aborted.signal, {}, state.dependencies), []);

state = fixture({
  fetchQueryWithSignal: async () => {
    throw new Error("query failed");
  },
});
await rejects(
  getRecentBranches(state.repository, 10, outerSignal, {}, state.dependencies),
  /query failed/,
);

console.log(`${assertions} worker git recent branches assertions passed`);
