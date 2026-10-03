import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseGitDiffHeader } = require("../app/.vite/build/worker/git-diff-text.js");
const {
  createReviewDiffFallback,
  diffMatchesRename,
  fetchTrackedReviewDiff,
  getReviewDiff,
  getTrackedReviewDiffs,
  getUntrackedReviewDiffs,
  reviewDiffError,
  splitReviewDiffs,
} = require("../app/.vite/build/worker/git-review-diffs.js");

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
    blob: [],
    gitDiff: [],
    prepare: [],
    read: 0,
    untracked: [],
  };
  const queryClient = {
    async fetchQuery(config) {
      calls.query = config;
      return options.returnQueryConfig ? config : config.queryFn();
    },
  };
  const worktreeRepo = {
    root: "/repo",
    host: { platformPath: async () => path.posix },
    queryClient,
  };
  const reviewSnapshot = {
    worktreeRepo,
    queryKey: (...parts) => ["snapshot", ...parts],
    gitDiff: async (...args) => {
      calls.gitDiff.push(args);
      return options.gitDiffResult ?? {
        success: true,
        outputLimitExceeded: false,
        stdout: "diff --git a/tracked.txt b/tracked.txt\nbody\n",
      };
    },
    read: async (callback) => {
      calls.read++;
      return callback();
    },
  };
  const dependencies = {
    byteLength: (value) => Buffer.byteLength(value, "utf8"),
    getBlobDiff: async (...args) => {
      calls.blob.push(args);
      return options.blobResult ?? {
        success: true,
        outputLimitExceeded: false,
        stdout: "blob diff",
      };
    },
    getQueryMeta: () => ({ scope: "review" }),
    getUntrackedWorkingTreeDiff: async (...args) => {
      calls.untracked.push(args);
      const currentPath = args[1];
      if (options.untrackedError)
        return { type: "error", error: { type: "untracked-error" } };
      return {
        type: "success",
        unifiedDiff: `untracked:${currentPath}`,
        ...(options.omitUntrackedBytes ? {} : { unifiedDiffBytes: 7 }),
      };
    },
    normalizePathFromRoot: (_platformPath, _sourceRoot, _targetRoot, value) =>
      value.startsWith("raw/") ? value.slice(4) : value,
    parseDiffHeader: parseGitDiffHeader,
    parseGitError: (result) => ({ type: "parsed", result }),
    prepareReviewComparison: async (params) => {
      calls.prepare.push(params);
      return (
        options.comparison ?? {
          type: "success",
          diffArgs: ["base"],
          untrackedPathSet: new Set(options.untrackedPaths ?? []),
        }
      );
    },
    rewriteRenameDiff: (diff, previousPath, currentPath) =>
      `rewritten:${previousPath}->${currentPath}:${diff}`,
  };
  return { calls, dependencies, reviewSnapshot, worktreeRepo };
}

deepEqual(reviewDiffError({ type: "failure" }), {
  type: "error",
  error: { type: "failure" },
});
deepEqual(
  createReviewDiffFallback("branch", [{ path: "a" }, { path: "b" }]),
  {
    source: "branch",
    diffs: {
      a: { type: "error", error: { type: "unknown" } },
      b: { type: "error", error: { type: "unknown" } },
    },
  },
);

let state = fixture();
const output =
  "prefix\n" +
  "diff --git a/old.txt b/new.txt\nfirst\n" +
  "diff --cc combined.txt\nsecond\n";
let diffs = splitReviewDiffs(output, state.dependencies);
equal(diffs.size, 3);
equal(diffs.get("old.txt"), diffs.get("new.txt"));
equal(diffs.get("old.txt").diff, "diff --git a/old.txt b/new.txt\nfirst\n");
equal(diffs.get("combined.txt").diff, "diff --cc combined.txt\nsecond\n");
equal(
  diffs.get("combined.txt").diffBytes,
  Buffer.byteLength("diff --cc combined.txt\nsecond\n"),
);
equal(splitReviewDiffs("diff --git malformed\n", state.dependencies).size, 0);
equal(
  diffMatchesRename(
    "diff --git a/old.txt b/new.txt\n",
    "old.txt",
    "new.txt",
    state.dependencies,
  ),
  true,
);
equal(
  diffMatchesRename(
    "diff --git a/old.txt b/other.txt\n",
    "old.txt",
    "new.txt",
    state.dependencies,
  ),
  false,
);

state = fixture({ returnQueryConfig: true });
let query = await fetchTrackedReviewDiff(
  ["base"],
  true,
  true,
  ["a", "b"],
  state.reviewSnapshot,
  state.dependencies,
);
deepEqual(query.queryKey, [
  "snapshot",
  "review-diffs",
  [
    "--binary",
    "base",
    "--ignore-all-space",
    "--full-index",
    "--find-renames",
    "--",
    "a",
    "b",
  ],
]);
equal(query.gcTime, 250);
equal(query.staleTime, 250);
deepEqual(query.meta, { scope: "review" });
await query.queryFn();
deepEqual(state.calls.gitDiff[0], [
  [
    "base",
    "--ignore-all-space",
    "--full-index",
    "--find-renames",
    "--",
    "a",
    "b",
  ],
  { allowedNonZeroExitCodes: [0, 1], binary: true, trim: false },
]);

state = fixture();
diffs = await getTrackedReviewDiffs(
  {
    binary: false,
    diffArgs: [],
    hideWhitespace: false,
    paths: [],
    reviewSnapshot: state.reviewSnapshot,
  },
  state.dependencies,
);
equal(diffs.size, 0);
equal(state.calls.gitDiff.length, 0);

state = fixture({
  gitDiffResult: {
    success: false,
    outputLimitExceeded: false,
    stdout: "",
  },
});
diffs = await getTrackedReviewDiffs(
  {
    binary: false,
    diffArgs: [],
    hideWhitespace: false,
    paths: ["a", "b"],
    reviewSnapshot: state.reviewSnapshot,
  },
  state.dependencies,
);
equal(diffs.size, 2);
equal(diffs.get("a").type, "error");
equal(diffs.get("a").error.type, "parsed");
equal(diffs.get("a"), diffs.get("b"));

state = fixture();
diffs = await getTrackedReviewDiffs(
  {
    binary: false,
    diffArgs: [],
    hideWhitespace: true,
    paths: ["tracked.txt", "unchanged.txt"],
    reviewSnapshot: state.reviewSnapshot,
  },
  state.dependencies,
);
deepEqual(diffs.get("unchanged.txt"), {
  type: "success",
  diff: "",
  diffBytes: 0,
});

state = fixture({ omitUntrackedBytes: true });
diffs = await getUntrackedReviewDiffs(
  { binary: true, paths: ["a", "b"], reviewSnapshot: state.reviewSnapshot },
  state.dependencies,
);
equal(diffs.size, 2);
equal(diffs.get("a").diffBytes, Buffer.byteLength("untracked:a"));
deepEqual(state.calls.untracked[0][2], { binary: true });
state = fixture({ untrackedError: true });
diffs = await getUntrackedReviewDiffs(
  { binary: false, paths: ["a"], reviewSnapshot: state.reviewSnapshot },
  state.dependencies,
);
deepEqual(diffs.get("a"), {
  type: "error",
  error: { type: "untracked-error" },
});

state = fixture({ comparison: { type: "expected", reason: "missing" } });
let result = await getReviewDiff(
  state.reviewSnapshot,
  "branch",
  [{ path: "raw/a.txt", changeKind: "modified" }],
  {},
  state.dependencies,
);
deepEqual(result, {
  source: "branch",
  diffs: {
    "raw/a.txt": { type: "error", error: { type: "unknown" } },
  },
});
deepEqual(state.calls.prepare[0].paths, ["a.txt"]);
equal(state.calls.prepare[0].includeUnmergedPaths, false);

state = fixture({ untrackedPaths: ["new.txt"] });
result = await getReviewDiff(
  state.reviewSnapshot,
  "branch",
  [
    { path: "raw/tracked.txt", changeKind: "modified" },
    { path: "raw/new.txt", changeKind: "untracked" },
  ],
  { binary: true },
  state.dependencies,
);
equal(result.source, "branch");
equal(result.diffs["raw/tracked.txt"].type, "success");
equal(result.diffs["raw/new.txt"].diff, "untracked:new.txt");
equal(state.calls.read, 1);
equal(state.calls.prepare[0].includeUntrackedFiles, true);

state = fixture({
  gitDiffResult: {
    success: true,
    outputLimitExceeded: false,
    stdout: "diff --git a/unrelated.txt b/new.txt\nbody\n",
  },
});
result = await getReviewDiff(
  state.reviewSnapshot,
  "branch",
  [
    {
      path: "raw/new.txt",
      previousPath: "raw/old.txt",
      changeKind: "renamed",
    },
  ],
  { hideWhitespace: true },
  state.dependencies,
);
equal(state.calls.blob.length, 1);
equal(state.calls.blob[0][1], "base:old.txt");
equal(state.calls.blob[0][2], "new.txt");
deepEqual(state.calls.blob[0][3], { binary: false, hideWhitespace: true });
equal(
  result.diffs["raw/new.txt"].diff,
  "rewritten:old.txt->new.txt:blob diff",
);

state = fixture({
  gitDiffResult: {
    success: true,
    outputLimitExceeded: false,
    stdout: "diff --git a/old.txt b/new.txt\nbody\n",
  },
});
await getReviewDiff(
  state.reviewSnapshot,
  "unstaged",
  [{ path: "new.txt", previousPath: "old.txt", changeKind: "renamed" }],
  {},
  state.dependencies,
);
equal(state.calls.blob.length, 0);

state = fixture({
  gitDiffResult: {
    success: true,
    outputLimitExceeded: false,
    stdout: "diff --git a/unrelated.txt b/new.txt\nbody\n",
  },
});
await getReviewDiff(
  state.reviewSnapshot,
  "staged",
  [{ path: "new.txt", previousPath: "old.txt", changeKind: "renamed" }],
  {},
  state.dependencies,
);
equal(state.calls.blob.length, 0);

console.log(`${count} worker git review diffs assertions passed`);
