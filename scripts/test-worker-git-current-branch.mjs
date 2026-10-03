import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  CURRENT_BRANCH_SNAPSHOT_STALE_MS,
  getCurrentBranch,
  getCurrentBranchSnapshot,
  getCurrentBranchState,
} = require("../app/.vite/build/worker/git-current-branch.js");

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

function fixture(results, onFetch) {
  const calls = { fetch: [], invalidate: [], run: [] };
  const querySignal = new AbortController().signal;
  const repository = {
    gitHeadReadGeneration: 4,
    host: { id: "local" },
    queryClient: {
      invalidateQueries: (options) => calls.invalidate.push(options),
    },
    root: "/repo",
  };
  const queue = [...results];
  const dependencies = {
    fetchQueryWithSignal: async (queryClient, options, signal) => {
      calls.fetch.push({ options, queryClient, signal });
      onFetch?.({ calls, options, repository });
      return options.queryFn(querySignal);
    },
    getQueryMeta: () => ({ family: "head" }),
    queryKey: (...parts) => ["key", ...parts],
    runGit: async (...args) => {
      calls.run.push(args);
      return queue.shift();
    },
    staleTime: Infinity,
  };
  return { calls, dependencies, querySignal, repository };
}

let state = fixture([{ success: true, stdout: "main" }]);
equal(await getCurrentBranch(state.repository, state.dependencies), "main");
equal(state.calls.run.length, 1);
deepEqual(state.calls.run[0], [
  "/repo",
  ["rev-parse", "--abbrev-ref", "HEAD"],
  state.repository.host,
  { signal: state.querySignal },
]);
deepEqual(state.calls.fetch[0].options.queryKey, [
  "key", "/repo", state.repository.host, "head-branch-name",
]);
deepEqual(state.calls.fetch[0].options.meta, { family: "head" });
equal(state.calls.fetch[0].options.staleTime, Infinity);

state = fixture([
  { success: true, stdout: "HEAD" },
  { success: true, stdout: "topic" },
]);
deepEqual(await getCurrentBranchState(state.repository, state.dependencies), {
  type: "branch",
  branch: "topic",
});
deepEqual(state.calls.run[1], [
  "/repo",
  ["symbolic-ref", "--quiet", "--short", "HEAD"],
  state.repository.host,
  { allowedNonZeroExitCodes: [1], signal: state.querySignal },
]);

state = fixture([
  { success: false, stdout: "" },
  { success: false, stdout: "", code: 1 },
]);
deepEqual(await getCurrentBranchState(state.repository, state.dependencies), { type: "detached" });
state = fixture([
  { success: false, stdout: "" },
  { success: false, stdout: "", code: 128 },
]);
deepEqual(await getCurrentBranchState(state.repository, state.dependencies), { type: "unknown" });
state = fixture([
  { success: true, stdout: "HEAD" },
  { success: false, stdout: "", code: 1 },
]);
equal(await getCurrentBranch(state.repository, state.dependencies), null);

const outerSignal = new AbortController().signal;
state = fixture([{ success: true, stdout: "main" }]);
equal(
  await getCurrentBranchSnapshot(state.repository, outerSignal, state.dependencies),
  "main",
);
equal(CURRENT_BRANCH_SNAPSHOT_STALE_MS, 15_000);
equal(state.calls.fetch[0].signal, outerSignal);
equal(state.calls.fetch[0].options.staleTime, 15_000);

state = fixture([
  { success: true, stdout: "HEAD" },
  { success: true, stdout: "" },
]);
equal(await getCurrentBranchSnapshot(state.repository, outerSignal, state.dependencies), null);

state = fixture([{ success: false, stdout: "", stderr: "head failed" }]);
await rejects(
  getCurrentBranchSnapshot(state.repository, outerSignal, state.dependencies),
  /head failed/,
);
deepEqual(state.calls.invalidate[0], {
  queryKey: ["key", "/repo", state.repository.host, "head-branch-name"],
  exact: true,
  refetchType: "none",
});

state = fixture([
  { success: false, stdout: "HEAD", stderr: "ignored" },
  { success: false, stdout: "", stderr: "symbolic failed" },
]);
await rejects(
  getCurrentBranchSnapshot(state.repository, outerSignal, state.dependencies),
  /symbolic failed/,
);
deepEqual(state.calls.invalidate[0], {
  queryKey: ["key", "/repo", state.repository.host, "symbolic-head-branch-name"],
  exact: true,
  refetchType: "none",
});

let fetches = 0;
state = fixture(
  [
    { success: true, stdout: "stale" },
    { success: true, stdout: "fresh" },
  ],
  ({ repository }) => {
    fetches += 1;
    if (fetches === 1) queueMicrotask(() => { repository.gitHeadReadGeneration = 5; });
  },
);
equal(await getCurrentBranch(state.repository, state.dependencies), "fresh");
equal(state.calls.run.length, 2);
deepEqual(state.calls.invalidate, [{
  queryKey: ["key", "/repo", state.repository.host, "head-branch-name"],
  exact: true,
  refetchType: "none",
}]);

let symbolicFetches = 0;
state = fixture(
  [
    { success: true, stdout: "HEAD" },
    { success: true, stdout: "stale-topic" },
    { success: true, stdout: "fresh-topic" },
  ],
  ({ options, repository }) => {
    if (options.queryKey.at(-1) !== "symbolic-head-branch-name") return;
    symbolicFetches += 1;
    if (symbolicFetches === 1)
      queueMicrotask(() => { repository.gitHeadReadGeneration = 5; });
  },
);
deepEqual(await getCurrentBranchState(state.repository, state.dependencies), {
  type: "branch",
  branch: "fresh-topic",
});
equal(symbolicFetches, 2);
deepEqual(state.calls.invalidate, [{
  queryKey: ["key", "/repo", state.repository.host, "symbolic-head-branch-name"],
  exact: true,
  refetchType: "none",
}]);

console.log(`${assertions} worker git current branch assertions passed`);
