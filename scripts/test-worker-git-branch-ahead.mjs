import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { countCommits, getBranchAheadCount } = require(
  "../app/.vite/build/worker/git-branch-ahead.js",
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

function fixture(options = {}) {
  const calls = {
    branch: [],
    defaultBranch: [],
    mergeBase: [],
    query: [],
    remotes: [],
    repository: [],
    run: [],
    upstream: [],
  };
  const host = { id: "host" };
  const repository = {
    root: "/repo",
    host,
    queryClient: {
      fetchQuery: async (config) => {
        calls.query.push(config);
        return config.queryFn();
      },
    },
  };
  const gitResults = [...(options.gitResults ?? [])];
  const dependencies = {
    getCurrentBranch: async (...args) => {
      calls.branch.push(args);
      return options.currentBranch === undefined
        ? "feature"
        : options.currentBranch;
    },
    getDefaultRemoteBranch: async (...args) => {
      calls.defaultBranch.push(args);
      return options.defaultRemoteBranch === undefined
        ? { branch: "main", remote: "origin" }
        : options.defaultRemoteBranch;
    },
    getMergeBase: async (...args) => {
      calls.mergeBase.push(args);
      return options.mergeBase === undefined ? "base-sha" : options.mergeBase;
    },
    getQueryMeta: () => ({ gitReadInvalidation: "short-lived" }),
    getRemotes: async (...args) => {
      calls.remotes.push(args);
      return options.remotes ?? ["fallback"];
    },
    getUpstreamBranch: async (...args) => {
      calls.upstream.push(args);
      return options.upstream === undefined ? null : options.upstream;
    },
    queryKey: (...parts) => ["key", ...parts],
    runGit: async (...args) => {
      calls.run.push(args);
      return gitResults.shift() ?? {
        code: 1,
        success: true,
        stdout: options.countOutput ?? "3",
      };
    },
  };
  const gitManager = {
    getWorktreeRepositoryForRoot: (...args) => {
      calls.repository.push(args);
      return repository;
    },
  };
  return { calls, dependencies, gitManager, host, repository };
}

const signal = new AbortController().signal;

let state = fixture({ countOutput: " 17 trailing" });
equal(
  await countCommits(
    state.repository,
    ["HEAD", "--not", "--remotes=origin"],
    signal,
    state.dependencies,
  ),
  17,
);
equal(state.calls.query.length, 1);
deepEqual(state.calls.query[0].queryKey, [
  "key",
  "/repo",
  state.host,
  "commit-count",
  ["HEAD", "--not", "--remotes=origin"],
]);
equal(state.calls.query[0].gcTime, 250);
equal(state.calls.query[0].staleTime, 250);
deepEqual(state.calls.query[0].meta, {
  gitReadInvalidation: "short-lived",
});
deepEqual(state.calls.run[0], [
  "/repo",
  ["rev-list", "--count", "HEAD", "--not", "--remotes=origin"],
  state.host,
  { allowedNonZeroExitCodes: [128, 1], signal },
]);

state = fixture({
  gitResults: [
    { success: false, stdout: "8" },
    { success: true, stdout: "" },
    { success: true, stdout: "not-a-number" },
  ],
});
equal(
  await countCommits(state.repository, ["one"], signal, state.dependencies),
  null,
);
equal(
  await countCommits(state.repository, ["two"], signal, state.dependencies),
  null,
);
equal(
  await countCommits(state.repository, ["three"], signal, state.dependencies),
  null,
);

state = fixture({
  upstream: "remotes/origin/feature",
  gitResults: [{ code: 0, success: true, stdout: "" }],
});
deepEqual(
  await getBranchAheadCount(
    "/requested",
    state.gitManager,
    state.host,
    signal,
    state.dependencies,
  ),
  { commitsAhead: 0 },
);
deepEqual(state.calls.repository, [["/requested", state.host]]);
deepEqual(state.calls.defaultBranch, [[state.repository]]);
equal(state.calls.remotes.length, 0);
deepEqual(state.calls.branch, [[state.repository]]);
deepEqual(state.calls.upstream, [[state.repository, "feature", signal]]);
deepEqual(state.calls.run[0], [
  "/repo",
  [
    "merge-base",
    "--is-ancestor",
    "HEAD",
    "refs/remotes/origin/feature",
  ],
  state.host,
  { allowedNonZeroExitCodes: [1, 128], signal },
]);
equal(state.calls.query.length, 0);

state = fixture({
  currentBranch: null,
  defaultRemoteBranch: { branch: "main", remote: null },
  remotes: ["upstream", "origin"],
  upstream: "upstream/feature",
  gitResults: [
    { code: 1, success: false, stdout: "" },
    { success: true, stdout: "4" },
  ],
});
deepEqual(
  await getBranchAheadCount(
    "/requested",
    state.gitManager,
    state.host,
    signal,
    state.dependencies,
  ),
  { commitsAhead: 4 },
);
deepEqual(state.calls.remotes, [[state.repository]]);
deepEqual(state.calls.upstream, [[state.repository, "HEAD", signal]]);
deepEqual(state.calls.run[0][1], [
  "merge-base",
  "--is-ancestor",
  "HEAD",
  "refs/remotes/upstream/feature",
]);
deepEqual(state.calls.run[1][1], [
  "rev-list",
  "--count",
  "HEAD",
  "--not",
  "--remotes=upstream",
]);
equal(state.calls.mergeBase.length, 0);

state = fixture({
  upstream: "refs/heads/tracking",
  gitResults: [
    { success: false, stdout: "" },
    { success: true, stdout: "2" },
  ],
});
deepEqual(
  await getBranchAheadCount(
    "/requested",
    state.gitManager,
    state.host,
    signal,
    state.dependencies,
  ),
  { commitsAhead: 2 },
);
equal(state.calls.run.length, 2);
deepEqual(state.calls.run[0][1], [
  "rev-list",
  "--count",
  "HEAD",
  "--not",
  "--remotes=origin",
]);
deepEqual(state.calls.run[1][1], [
  "rev-list",
  "--count",
  "refs/heads/tracking..HEAD",
]);

state = fixture({
  upstream: "tracking",
  gitResults: [
    { success: false, stdout: "" },
    { success: false, stdout: "99" },
  ],
});
deepEqual(
  await getBranchAheadCount(
    "/requested",
    state.gitManager,
    state.host,
    signal,
    state.dependencies,
  ),
  { commitsAhead: 0 },
);

state = fixture({
  defaultRemoteBranch: { branch: null, remote: null },
  remotes: [],
  upstream: null,
});
deepEqual(
  await getBranchAheadCount(
    "/requested",
    state.gitManager,
    state.host,
    signal,
    state.dependencies,
  ),
  { commitsAhead: 0 },
);
equal(state.calls.run.length, 0);
equal(state.calls.mergeBase.length, 0);

state = fixture({
  upstream: null,
  mergeBase: "merge-sha",
  gitResults: [
    { success: false, stdout: "" },
    { success: true, stdout: "3" },
  ],
});
deepEqual(
  await getBranchAheadCount(
    "/requested",
    state.gitManager,
    state.host,
    signal,
    state.dependencies,
  ),
  { commitsAhead: 3 },
);
deepEqual(state.calls.mergeBase, [[state.repository, "origin/main"]]);
deepEqual(state.calls.run[0][1], [
  "rev-list",
  "--count",
  "HEAD",
  "--not",
  "--remotes=origin",
]);
deepEqual(state.calls.run[1][1], [
  "rev-list",
  "--count",
  "merge-sha..HEAD",
]);

state = fixture({
  defaultRemoteBranch: { branch: "fork/main", remote: "origin" },
  upstream: null,
  mergeBase: null,
  gitResults: [{ success: false, stdout: "" }],
});
deepEqual(
  await getBranchAheadCount(
    "/requested",
    state.gitManager,
    state.host,
    signal,
    state.dependencies,
  ),
  { commitsAhead: 0 },
);
deepEqual(state.calls.mergeBase, [[state.repository, "fork/main"]]);

state = fixture({
  defaultRemoteBranch: { branch: "main", remote: null },
  remotes: [],
  upstream: null,
  mergeBase: "base",
});
deepEqual(
  await getBranchAheadCount(
    "/requested",
    state.gitManager,
    state.host,
    signal,
    state.dependencies,
  ),
  { commitsAhead: 3 },
);
deepEqual(state.calls.mergeBase, [[state.repository, "main"]]);
equal(state.calls.run.length, 1);

console.log(`worker git branch ahead tests passed (${assertions} assertions)`);
