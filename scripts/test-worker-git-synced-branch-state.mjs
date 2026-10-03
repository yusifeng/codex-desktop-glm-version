import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const stateApi = require("../app/.vite/build/worker/git-synced-branch-state.js");
let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};
const rejects = async (...args) => {
  count++;
  await assert.rejects(...args);
};
const signal = new AbortController().signal;

deepEqual(stateApi.parseNumstat("2\t3\ta.txt\n-\t-\tb.bin\ninvalid"), {
  filesChanged: 2,
  linesAdded: 2,
  linesRemoved: 3,
});
deepEqual(stateApi.parseNumstat(" \n"), {
  filesChanged: 0,
  linesAdded: 0,
  linesRemoved: 0,
});

function fixture(overrides = {}) {
  const calls = [],
    logs = [];
  const repository = {
    root: "/worktree",
    host: {},
    queryClient: {
      fetchQuery: async (options) => {
        calls.push(["query", options]);
        return options.queryFn();
      },
    },
  };
  const branchRepository = {
    root: "/local",
    host: {},
    queryClient: repository.queryClient,
  };
  const gitManager = {
    async getWorktreeRepository(...args) {
      calls.push(["repository", ...args]);
      return repository;
    },
    getWorktreeRepositoryForRoot(root) {
      calls.push(["repository-root", root]);
      return root === "/local" ? branchRepository : repository;
    },
  };
  const deps = {
    readConfig: async () => ({
      branch: "feature",
      lastSyncedTreeRef: "base-tree",
    }),
    hasConflicts: async () => true,
    normalizeBranch: (branch) => branch.replace(/^refs\/heads\//, ""),
    queryKey: (...parts) => parts,
    queryMeta: () => ({ family: "diff" }),
    runDiff: async (root, args, host, options) => {
      calls.push(["diff", root, args, host, options]);
      return {
        success: true,
        stdout: root === "/local" ? "4\t1\tlocal.txt" : "2\t3\tworktree.txt",
      };
    },
    listWorktrees: async () => [
      { root: "/local", headRef: { type: "branch", string: "feature" } },
    ],
    resolveObject: async () => "branch-head",
    isObjectId: (value) => value.endsWith("head"),
    normalizeCommitSha: (value) => value,
    getUntrackedPaths: async (repo) => ({
      success: true,
      root: repo.root,
      paths: [],
    }),
    getWorkingTree: async (repo) =>
      repo.root === "/local" ? "local-tree" : "worktree-tree",
    getHeadCommit: async () => "worktree-head",
    getCurrentBranch: async () => null,
    compareAhead: async () => ({ leftAhead: 2, rightAhead: 3 }),
    logger: { warning: (...args) => logs.push(args) },
    ...overrides,
  };
  return { branchRepository, calls, deps, gitManager, logs, repository };
}

let fixtureState = fixture({ readConfig: async () => null });
deepEqual(
  await stateApi.resolveSyncedBranch(
    fixtureState.repository,
    signal,
    fixtureState.deps,
  ),
  { branch: null, base: null, hasConflicts: false },
);
fixtureState = fixture();
deepEqual(
  await stateApi.resolveSyncedBranch(
    fixtureState.repository,
    signal,
    fixtureState.deps,
  ),
  { branch: "feature", base: "base-tree", hasConflicts: true },
);

fixtureState = fixture();
equal(
  await stateApi.findBranchWorktree(
    fixtureState.repository,
    "feature",
    signal,
    fixtureState.deps,
  ),
  "/local",
);
equal(
  await stateApi.resolveCommit(
    fixtureState.repository,
    "feature",
    signal,
    fixtureState.deps,
  ),
  "branch-head",
);
await rejects(
  stateApi.resolveCommit(fixtureState.repository, "feature", signal, {
    ...fixtureState.deps,
    resolveObject: async () => "bad",
    isObjectId: () => false,
  }),
  /Unexpected feature SHA/,
);

fixtureState = fixture();
deepEqual(
  await stateApi.resolveDiffStats(
    fixtureState.repository,
    "left",
    "right",
    signal,
    fixtureState.deps,
  ),
  { filesChanged: 1, linesAdded: 2, linesRemoved: 3 },
);
equal(fixtureState.calls.find(([name]) => name === "query")[1].staleTime, 250);
deepEqual(fixtureState.calls.find(([name]) => name === "diff")[2], [
  "--numstat",
  "left",
  "right",
]);

fixtureState = fixture();
const result = await stateApi.resolveSyncedBranchState(
  "/cwd",
  fixtureState.gitManager,
  {},
  signal,
  fixtureState.deps,
);
equal(result.branch, "feature");
deepEqual(result.worktreeSnapshot, {
  root: "/worktree",
  headCommitSha: "worktree-head",
  workingTreeRef: "worktree-tree",
});
deepEqual(result.branchSnapshot, {
  checkedOut: true,
  snapshot: {
    root: "/local",
    headCommitSha: "branch-head",
    workingTreeRef: "local-tree",
  },
});
equal(result.localCommitsAhead, 2);
equal(result.worktreeCommitsAhead, 3);
deepEqual(result.localUncommittedDiffStats, {
  filesChanged: 1,
  linesAdded: 4,
  linesRemoved: 1,
  leftRef: "branch-head",
  rightRef: "local-tree",
});
deepEqual(result.worktreeUncommittedDiffStats, {
  filesChanged: 1,
  linesAdded: 2,
  linesRemoved: 3,
  leftRef: "worktree-head",
  rightRef: "worktree-tree",
});

fixtureState = fixture({
  listWorktrees: async () => [],
  getWorkingTree: async () => "worktree-tree",
});
const unchecked = await stateApi.resolveSyncedBranchState(
  "/cwd",
  fixtureState.gitManager,
  {},
  signal,
  fixtureState.deps,
);
deepEqual(unchecked.branchSnapshot, {
  checkedOut: false,
  headCommitSha: "branch-head",
});
deepEqual(unchecked.localUncommittedDiffStats, {
  filesChanged: 0,
  linesAdded: 0,
  linesRemoved: 0,
  leftRef: "branch-head",
  rightRef: "branch-head",
});

fixtureState = fixture({ getCurrentBranch: async () => "main" });
await rejects(
  stateApi.resolveSyncedBranchState(
    "/cwd",
    fixtureState.gitManager,
    {},
    signal,
    fixtureState.deps,
  ),
  /branch checked out/,
);
equal(fixtureState.logs.length, 1);

fixtureState = fixture();
fixtureState.gitManager.getWorktreeRepository = async () => null;
await rejects(
  stateApi.resolveSyncedBranchState(
    "/cwd",
    fixtureState.gitManager,
    {},
    signal,
    fixtureState.deps,
  ),
  /Unable to resolve git root/,
);
equal(fixtureState.logs.length, 0);

console.log(`${count} worker git synced-branch state assertions passed`);
