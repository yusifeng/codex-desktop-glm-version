import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  REPOSITORY_OPERATION_MARKERS,
  getBranchDiffStats,
  hasRepositoryOperationInProgress,
  readRepositoryOperationPathStatus,
  reconcileBranchRenameStats,
} = require("../app/.vite/build/worker/git-review-branch-stats.js");

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

function fixture(options = {}) {
  const calls = {
    diff: [],
    infer: [],
    prepare: [],
    reconcile: [],
    resolve: [],
    stat: [],
    untracked: [],
  };
  const host = {
    platformPath: async () => path.posix,
    stat: async (filePath, config) => {
      calls.stat.push([filePath, config]);
      const outcome = options.pathOutcomes?.[filePath] ?? "missing";
      if (outcome === "exists") return { size: 1 };
      const error = Error(outcome);
      error.code = outcome === "missing" ? "ENOENT" : "EACCES";
      throw error;
    },
  };
  const reviewSnapshot = {
    signal: new AbortController().signal,
    read: async (callback) => callback(),
  };
  const repository = { root: "/repo", host, reviewSnapshot };
  const dependencies = {
    getDiffMetadata: async (params) => {
      calls.diff.push(params);
      return options.diffMetadata === undefined
        ? {
            files: [],
            rawEntries: [
              { path: "deleted", previousPath: null, status: "D" },
            ],
            stats: [
              { additions: 3, deletions: 2, path: "tracked", previousPath: null },
            ],
          }
        : options.diffMetadata;
    },
    getGitDir: async () =>
      options.gitDir === undefined ? "/repo/.git" : options.gitDir,
    getOmittedUntrackedFiles: (value, limit) =>
      value > limit ? { count: value, limit } : undefined,
    getStatusSummary: async () =>
      options.status ?? {
        type: "success",
        trackedPaths: ["tracked"],
        stagedRenames: [{ path: "new", previousPath: "old" }],
      },
    getUntrackedMetadata: async (...args) => {
      calls.untracked.push(args);
      return options.untrackedMetadata === undefined
        ? {
            files: [],
            rawEntries: [],
            stats: [
              { additions: 1, deletions: 0, path: "new", previousPath: null },
            ],
          }
        : options.untrackedMetadata;
    },
    inferRenames: async (params) => {
      calls.infer.push(params);
      return options.inferredRenames ?? [];
    },
    isMissingPathError: (error) => error?.code === "ENOENT",
    mergeReviewMetadata: (left, right) => ({
      files: [...left.files, ...right.files],
      rawEntries: [...left.rawEntries, ...right.rawEntries],
      stats: [...left.stats, ...right.stats],
    }),
    normalizeCwd: (cwd) => `normalized:${cwd}`,
    prepareReviewComparison: async (params) => {
      calls.prepare.push(params);
      return options.comparison ?? {
        type: "success",
        diffArgs: ["base"],
        untrackedPaths: { paths: ["new"] },
        untrackedPathSet: new Set(["new"]),
      };
    },
    reconcileRenameStats: (stats, renames, deletedPaths) => {
      calls.reconcile.push([stats, renames, deletedPaths]);
      return options.reconciledStats ?? renames;
    },
    reconcileUntrackedRenames: (metadata) => metadata,
    resolveReviewPaths: async (params) => {
      calls.resolve.push(params);
      return options.reviewPaths === undefined
        ? { paths: ["tracked", "new"] }
        : options.reviewPaths;
    },
    reviewFileKey: (currentPath, previousPath) =>
      `${previousPath ?? ""}\0${currentPath}`,
  };
  const gitManager = {
    getWorktreeRepository: async (...args) => {
      calls.repository = args;
      return options.repository === undefined ? repository : options.repository;
    },
  };
  return { calls, dependencies, gitManager, host, repository, reviewSnapshot };
}

deepEqual(REPOSITORY_OPERATION_MARKERS, [
  "MERGE_HEAD",
  "CHERRY_PICK_HEAD",
  "REVERT_HEAD",
  "REBASE_HEAD",
  "rebase-merge",
  "rebase-apply",
  "sequencer",
]);

let state = fixture({ pathOutcomes: { "/exists": "exists" } });
equal(
  await readRepositoryOperationPathStatus(
    "/exists",
    state.host,
    state.dependencies,
  ),
  "exists",
);
deepEqual(state.calls.stat[0], ["/exists", { bypassCache: true }]);
equal(
  await readRepositoryOperationPathStatus(
    "/missing",
    state.host,
    state.dependencies,
  ),
  "missing",
);
state = fixture({ pathOutcomes: { "/unknown": "unknown" } });
equal(
  await readRepositoryOperationPathStatus(
    "/unknown",
    state.host,
    state.dependencies,
  ),
  "unknown",
);

state = fixture({ gitDir: null });
equal(
  await hasRepositoryOperationInProgress(
    state.repository,
    state.reviewSnapshot.signal,
    state.dependencies,
  ),
  false,
);
equal(state.calls.stat.length, 0);
state = fixture({
  pathOutcomes: { "/repo/.git/MERGE_HEAD": "exists" },
});
equal(
  await hasRepositoryOperationInProgress(
    state.repository,
    state.reviewSnapshot.signal,
    state.dependencies,
  ),
  true,
);
equal(state.calls.stat.length, 8);
state = fixture({
  pathOutcomes: { "/repo/.git/index.lock": "unknown" },
});
equal(
  await hasRepositoryOperationInProgress(
    state.repository,
    state.reviewSnapshot.signal,
    state.dependencies,
  ),
  true,
);

state = fixture();
const metadata = {
  rawEntries: [
    { path: "deleted", previousPath: null, status: "D" },
  ],
  stats: [
    { path: "changed", previousPath: null },
    { path: "renamed", previousPath: "old" },
  ],
};
let stats = await reconcileBranchRenameStats(
  {
    diffArgs: ["base"],
    hideWhitespace: true,
    metadata,
    renames: [{ path: "renamed", previousPath: "old" }],
    reviewSnapshot: state.reviewSnapshot,
  },
  state.dependencies,
);
equal(stats, metadata.stats);
deepEqual([...state.calls.infer[0].changedPaths], ["changed"]);
deepEqual([...state.calls.infer[0].existingRenameKeys], ["old\0renamed"]);
equal(state.calls.infer[0].hideWhitespace, true);

state = fixture({
  inferredRenames: [
    { additions: 2, deletions: 3, path: "new", previousPath: "old" },
  ],
  reconciledStats: [{ additions: 2, deletions: 3 }],
});
stats = await reconcileBranchRenameStats(
  {
    diffArgs: ["base"],
    metadata,
    renames: [],
    reviewSnapshot: state.reviewSnapshot,
  },
  state.dependencies,
);
deepEqual(stats, [{ additions: 2, deletions: 3 }]);
deepEqual([...state.calls.reconcile[0][2]], ["deleted"]);

state = fixture({ repository: null });
equal(
  await getBranchDiffStats(
    "/cwd",
    state.gitManager,
    state.host,
    "main",
    false,
    true,
    10,
    state.dependencies,
  ),
  null,
);
deepEqual(state.calls.repository, ["normalized:/cwd", state.host]);

state = fixture({
  pathOutcomes: { "/repo/.git/index.lock": "exists" },
});
equal(
  await getBranchDiffStats(
    "/cwd",
    state.gitManager,
    state.host,
    undefined,
    false,
    true,
    10,
    state.dependencies,
  ),
  null,
);
equal(state.calls.prepare.length, 0);

state = fixture({ comparison: { type: "expected" } });
equal(
  await getBranchDiffStats(
    "/cwd",
    state.gitManager,
    state.host,
    "main",
    true,
    false,
    10,
    state.dependencies,
  ),
  null,
);
equal(state.calls.prepare[0].source, "branch");
equal(state.calls.prepare[0].includeUntrackedFiles, false);

state = fixture({
  inferredRenames: [
    { additions: 7, deletions: 8, path: "new", previousPath: "old" },
  ],
  reconciledStats: [
    { additions: 7, deletions: 8 },
    { additions: null, deletions: null },
  ],
});
let result = await getBranchDiffStats(
  "/cwd",
  state.gitManager,
  state.host,
  "main",
  true,
  true,
  10,
  state.dependencies,
);
deepEqual(result, {
  additions: 7,
  deletions: 8,
  fileCount: 2,
  untrackedFilesOmitted: undefined,
});
deepEqual(state.calls.untracked[0], [state.reviewSnapshot, ["new"]]);
deepEqual(state.calls.resolve[0].statusPaths, ["tracked"]);
equal(state.calls.diff[0].hideWhitespace, true);

state = fixture({
  comparison: {
    type: "success",
    diffArgs: ["base"],
    untrackedPaths: { paths: ["a", "b", "c"] },
    untrackedPathSet: new Set(["a", "b", "c"]),
  },
  diffMetadata: { files: [], rawEntries: [], stats: [] },
  untrackedMetadata: { files: [], rawEntries: [], stats: [] },
});
result = await getBranchDiffStats(
  "/cwd",
  state.gitManager,
  state.host,
  undefined,
  false,
  true,
  2,
  state.dependencies,
);
deepEqual(result, {
  additions: 0,
  deletions: 0,
  fileCount: 0,
  untrackedFilesOmitted: { count: 3, limit: 2 },
});
deepEqual(state.calls.untracked[0][1], []);

for (const [name, fixtureOptions] of [
  ["status", { status: { type: "error" } }],
  ["untracked", { untrackedMetadata: null }],
  ["paths", { reviewPaths: null }],
  ["diff", { diffMetadata: null }],
]) {
  state = fixture(fixtureOptions);
  equal(
    await getBranchDiffStats(
      "/cwd",
      state.gitManager,
      state.host,
      undefined,
      false,
      true,
      10,
      state.dependencies,
    ),
    null,
    name,
  );
}

console.log(`${count} worker git review branch stats assertions passed`);
