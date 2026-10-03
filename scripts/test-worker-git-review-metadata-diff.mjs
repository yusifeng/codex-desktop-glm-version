import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  MAX_REVIEW_METADATA_PATHS,
  fetchReviewMetadataDiff,
  inferReviewRenames,
  readReviewDiffMetadata,
  reconcileStagedReviewRenames,
  resolveReviewMetadataPaths,
} = require("../app/.vite/build/worker/git-review-metadata-diff.js");

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
  const calls = { blob: [], count: [], diff: [], parse: [], query: [], reconcile: [] };
  const reviewSnapshot = {
    queryKey: (...args) => ["snapshot", ...args],
    gitDiff: async (...args) => {
      calls.diff.push(args);
      return options.diffResult ?? { success: true, stdout: "diff-output" };
    },
    worktreeRepo: {
      queryClient: {
        fetchQuery: async (config) => {
          calls.query.push(config);
          return options.queryResult ?? config.queryFn();
        },
      },
    },
  };
  const dependencies = {
    countDiffLines: (diff) => {
      calls.count.push(diff);
      return options.counts === undefined ? { additions: 4, deletions: 2 } : options.counts;
    },
    getBlobDiff: async (...args) => {
      calls.blob.push(args);
      return options.blobResult ?? { success: true, outputLimitExceeded: false, stdout: "blob-diff" };
    },
    getQueryMeta: () => ({ owner: "review" }),
    gitStatusToReviewChangeKind: (status) => `kind:${status}`,
    parseReviewMetadataDiff: (output) => {
      calls.parse.push(output);
      return options.metadata ?? { rawEntries: [], stats: [] };
    },
    reconcileRenameStats: (...args) => {
      calls.reconcile.push(args);
      return options.reconciledStats ?? args[0];
    },
    reviewFileKey: (currentPath, previousPath) => `${previousPath ?? ""}\0${currentPath}`,
    staleTime: Infinity,
  };
  return { calls, dependencies, reviewSnapshot };
}

equal(MAX_REVIEW_METADATA_PATHS, 512);

let state = fixture();
const queryResult = await fetchReviewMetadataDiff(
  state.reviewSnapshot,
  ["base", "--raw"],
  state.dependencies,
);
equal(queryResult.success, true);
deepEqual(state.calls.query[0].queryKey, [
  "snapshot",
  "review-metadata-diff",
  ["base", "--raw"],
]);
deepEqual(state.calls.query[0].meta, { owner: "review" });
equal(state.calls.query[0].staleTime, Infinity);
deepEqual(state.calls.diff[0], [
  ["base", "--raw"],
  { allowedNonZeroExitCodes: [0, 1], trim: false },
]);

state = fixture();
deepEqual(
  await resolveReviewMetadataPaths(
    {
      diffArgs: [],
      requestedPaths: ["requested"],
      reviewSnapshot: state.reviewSnapshot,
      source: "commit",
      statusPaths: ["status"],
    },
    state.dependencies,
  ),
  { paths: ["requested"] },
);
equal(state.calls.query.length, 0);
equal(
  await resolveReviewMetadataPaths(
    {
      diffArgs: [],
      reviewSnapshot: state.reviewSnapshot,
      source: "branch",
      statusPaths: [],
    },
    state.dependencies,
  ),
  null,
);

state = fixture({ diffResult: { success: true, stdout: "cached\0shared\0" } });
deepEqual(
  await resolveReviewMetadataPaths(
    {
      diffArgs: ["base"],
      requestedPaths: ["shared", "cached"],
      reviewSnapshot: state.reviewSnapshot,
      source: "uncommitted",
      statusPaths: ["status", "shared"],
    },
    state.dependencies,
  ),
  { paths: ["shared", "cached"] },
);
deepEqual(state.calls.diff[0][0], [
  "--cached",
  "base",
  "--no-renames",
  "--name-only",
  "-z",
]);

state = fixture({ diffResult: { success: false, stdout: "" } });
equal(
  await resolveReviewMetadataPaths(
    {
      diffArgs: ["base"],
      reviewSnapshot: state.reviewSnapshot,
      source: "branch",
      statusPaths: [],
    },
    state.dependencies,
  ),
  null,
);

state = fixture();
const tooManyPaths = Array.from({ length: 513 }, (_, index) => `path-${index}`);
deepEqual(
  await resolveReviewMetadataPaths(
    {
      diffArgs: [],
      requestedPaths: undefined,
      reviewSnapshot: state.reviewSnapshot,
      source: "unstaged",
      statusPaths: tooManyPaths,
    },
    state.dependencies,
  ),
  { paths: undefined },
);
equal(state.calls.query.length, 0);
deepEqual(
  await resolveReviewMetadataPaths(
    {
      diffArgs: [],
      requestedPaths: ["keep"],
      reviewSnapshot: state.reviewSnapshot,
      source: "unstaged",
      statusPaths: ["drop", "keep"],
    },
    state.dependencies,
  ),
  { paths: ["keep"] },
);

state = fixture();
deepEqual(
  await readReviewDiffMetadata(
    { diffArgs: ["base"], paths: [], reviewSnapshot: state.reviewSnapshot },
    state.dependencies,
  ),
  { files: [], rawEntries: [], stats: [] },
);
equal(state.calls.query.length, 0);

const rawEntries = [
  { path: "modified", previousPath: null, status: "M" },
  { path: "added", previousPath: null, status: "A" },
  { path: "unmerged", previousPath: null, status: "U" },
  { path: "hidden", previousPath: null, status: "D" },
];
const stats = [{ additions: 1, deletions: 1, path: "modified", previousPath: null }];
state = fixture({ metadata: { rawEntries, stats } });
let metadata = await readReviewDiffMetadata(
  {
    diffArgs: ["base"],
    hideWhitespace: true,
    paths: ["modified", "added"],
    reviewSnapshot: state.reviewSnapshot,
  },
  state.dependencies,
);
deepEqual(state.calls.diff[0][0], [
  "base",
  "--ignore-all-space",
  "--find-renames",
  "--raw",
  "--no-abbrev",
  "--numstat",
  "-z",
  "--",
  "modified",
  "added",
]);
equal(state.calls.parse[0], "diff-output");
deepEqual(metadata.rawEntries, rawEntries.slice(0, 3));
deepEqual(metadata.files, [
  { additions: null, changeKind: "kind:M", deletions: null, path: "modified", previousPath: null },
  { additions: null, changeKind: "kind:A", deletions: null, path: "added", previousPath: null },
  { additions: null, changeKind: "kind:U", deletions: null, path: "unmerged", previousPath: null },
]);
equal(metadata.stats, stats);

state = fixture({ metadata: { rawEntries, stats } });
metadata = await readReviewDiffMetadata(
  { diffArgs: ["base"], hideWhitespace: false, reviewSnapshot: state.reviewSnapshot },
  state.dependencies,
);
equal(metadata.rawEntries.length, 4);
equal(state.calls.diff[0][0].includes("--ignore-all-space"), false);

state = fixture({ diffResult: { success: false, stdout: "" } });
equal(
  await readReviewDiffMetadata(
    { diffArgs: [], reviewSnapshot: state.reviewSnapshot },
    state.dependencies,
  ),
  null,
);
equal(state.calls.parse.length, 0);

state = fixture();
deepEqual(
  await inferReviewRenames(
    {
      changedPaths: new Set(),
      diffArgs: [],
      existingRenameKeys: new Set(),
      renames: [],
      reviewSnapshot: state.reviewSnapshot,
    },
    state.dependencies,
  ),
  [],
);

const renameCandidates = [
  { path: "existing-new", previousPath: "existing-old" },
  { path: "unchanged-new", previousPath: "unchanged-old" },
  { path: "new", previousPath: "old" },
];
state = fixture();
let renames = await inferReviewRenames(
  {
    changedPaths: new Set(["unchanged-old", "old", "new"]),
    diffArgs: ["base"],
    existingRenameKeys: new Set(["existing-old\0existing-new"]),
    hideWhitespace: true,
    renames: renameCandidates,
    reviewSnapshot: state.reviewSnapshot,
  },
  state.dependencies,
);
deepEqual(renames, [{ path: "new", previousPath: "old", additions: 4, deletions: 2 }]);
equal(state.calls.blob.length, 1);
deepEqual(state.calls.blob[0].slice(1), ["base:old", "new", { hideWhitespace: true }]);
equal(state.calls.count[0], "blob-diff");

state = fixture({ blobResult: { success: true, outputLimitExceeded: true, stdout: "large" } });
renames = await inferReviewRenames(
  {
    changedPaths: new Set(["old", "new"]),
    diffArgs: ["base"],
    existingRenameKeys: new Set(),
    renames: [{ path: "new", previousPath: "old" }],
    reviewSnapshot: state.reviewSnapshot,
  },
  state.dependencies,
);
deepEqual(renames, []);
equal(state.calls.count.length, 0);

state = fixture({ counts: null });
renames = await inferReviewRenames(
  {
    changedPaths: new Set(["old", "new"]),
    diffArgs: ["base"],
    existingRenameKeys: new Set(),
    renames: [{ path: "new", previousPath: "old" }],
    reviewSnapshot: state.reviewSnapshot,
  },
  state.dependencies,
);
deepEqual(renames, [{ path: "new", previousPath: "old", additions: null, deletions: null }]);

const originalMetadata = { files: [], rawEntries: [], stats: [] };
state = fixture({ blobResult: { success: false } });
equal(
  await reconcileStagedReviewRenames(
    {
      diffArgs: ["base"],
      metadata: originalMetadata,
      renames: [{ path: "new", previousPath: "old" }],
      reviewSnapshot: state.reviewSnapshot,
    },
    state.dependencies,
  ),
  originalMetadata,
);

const stagedMetadata = {
  files: [
    { changeKind: "deleted", path: "old", previousPath: null },
    { changeKind: "added", path: "new", previousPath: null },
  ],
  rawEntries: [
    { oldMode: "100644", oldOid: "old-oid", path: "old", previousPath: null, status: "D" },
    { oldMode: "000000", oldOid: "zero", path: "new", previousPath: null, status: "A" },
  ],
  stats: [{ additions: 3, deletions: 0, path: "new", previousPath: null }],
};
state = fixture({ reconciledStats: [{ additions: 3, deletions: 2, path: "new", previousPath: "old" }] });
metadata = await reconcileStagedReviewRenames(
  {
    diffArgs: ["base"],
    hideWhitespace: true,
    metadata: stagedMetadata,
    renames: [{ path: "new", previousPath: "old" }],
    reviewSnapshot: state.reviewSnapshot,
  },
  state.dependencies,
);
deepEqual(metadata.files, [{ changeKind: "renamed", path: "new", previousPath: "old" }]);
deepEqual(metadata.rawEntries, [
  { oldMode: "100644", oldOid: "old-oid", path: "new", previousPath: "old", status: "R" },
]);
deepEqual(metadata.stats, [{ additions: 3, deletions: 2, path: "new", previousPath: "old" }]);
equal(state.calls.reconcile.length, 1);
deepEqual([...state.calls.reconcile[0][2]], ["old"]);

state = fixture();
metadata = await reconcileStagedReviewRenames(
  {
    diffArgs: ["base"],
    metadata: {
      files: [{ changeKind: "added", path: "new", previousPath: null }],
      rawEntries: [{ path: "new", previousPath: null, status: "A" }],
      stats: [],
    },
    renames: [{ path: "new", previousPath: "old" }],
    reviewSnapshot: state.reviewSnapshot,
  },
  state.dependencies,
);
equal(metadata.files[0].changeKind, "added");
equal(metadata.rawEntries[0].status, "A");

console.log(`worker git review metadata diff tests passed (${count} assertions)`);
