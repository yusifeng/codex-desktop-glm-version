import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getCachedTrackedReviewDiff,
  getReviewPatch,
  unknownReviewPatchDiff,
} = require("../app/.vite/build/worker/git-review-patch.js");

let count = 0;
const equal = (...args) => {
  count += 1;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count += 1;
  assert.deepEqual(...args);
};

function deferred() {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

function fixture(options = {}) {
  const calls = {
    collect: [],
    comparison: [],
    meta: 0,
    parseError: [],
    query: [],
    read: [],
    sections: [],
    tracked: [],
    untracked: [],
    utf8: [],
  };
  const signal = new AbortController().signal;
  const queryResult = options.queryResult ?? {
    success: true,
    stdout: " tracked patch ",
  };
  const reviewSnapshot = {
    signal,
    worktreeRepo: {
      queryClient: {
        fetchQuery: async (config) => {
          calls.query.push(config);
          return options.fetchQuery
            ? options.fetchQuery(config)
            : config.queryFn();
        },
      },
    },
    queryKey: (...parts) => ["snapshot", ...parts],
    gitDiff: async (...args) => {
      calls.tracked.push(args);
      return queryResult;
    },
    read: async (callback) => {
      calls.read.push(callback);
      return Object.hasOwn(options, "readResult")
        ? options.readResult
        : callback();
    },
  };
  const comparison = options.comparison ?? {
    type: "success",
    diffArgs: ["base", "--", "path"],
    reviewSnapshot,
    untrackedPaths: { success: true, paths: ["new.txt"] },
  };
  const dependencies = {
    collectNonEmptySections: (...groups) => {
      calls.sections.push(groups);
      return groups.flat().flatMap((section) => {
        const trimmed = section?.trim();
        return trimmed ? [trimmed] : [];
      });
    },
    collectUntrackedDiffSections: async (...args) => {
      calls.collect.push(args);
      if (options.collectUntrackedDiffSections)
        return options.collectUntrackedDiffSections(...args);
      const result = await args[0]("new.txt", args[2]);
      return result.type === "error"
        ? { success: false, error: result.error }
        : { success: true, sections: [result.unifiedDiff] };
    },
    getQueryMeta: () => {
      calls.meta += 1;
      return { owner: "review" };
    },
    getUntrackedWorkingTreeDiff: async (...args) => {
      calls.untracked.push(args);
      return options.untrackedResult ?? {
        type: "success",
        unifiedDiff: " untracked patch ",
      };
    },
    parseGitError: (result) => {
      calls.parseError.push(result);
      return { type: "mapped", code: result.code };
    },
    resolveReviewComparisonForRepository: async (params) => {
      calls.comparison.push(params);
      return comparison;
    },
    utf8ByteLength: (value) => {
      calls.utf8.push(value);
      return Buffer.byteLength(value, "utf8");
    },
  };
  return { calls, comparison, dependencies, reviewSnapshot, signal };
}

deepEqual(unknownReviewPatchDiff(), {
  type: "error",
  error: { type: "unknown" },
});

let state = fixture();
deepEqual(
  await getCachedTrackedReviewDiff(
    ["base", "--", "path"],
    state.reviewSnapshot,
    state.dependencies,
  ),
  { success: true, stdout: " tracked patch " },
);
equal(state.calls.query.length, 1);
deepEqual(state.calls.query[0].queryKey, [
  "snapshot",
  "review-patch-diff",
  ["base", "--", "path"],
]);
equal(state.calls.query[0].gcTime, 250);
equal(state.calls.query[0].staleTime, 250);
deepEqual(state.calls.query[0].meta, { owner: "review" });
equal(state.calls.meta, 1);
deepEqual(state.calls.tracked[0], [
  ["base", "--", "path"],
  { allowedNonZeroExitCodes: [0, 1], trim: false },
]);

const host = { id: "host" };
const gitManager = { id: "manager" };
const externalSignal = new AbortController().signal;
state = fixture();
deepEqual(
  await getReviewPatch(
    "/repo",
    "branch",
    gitManager,
    host,
    externalSignal,
    "main",
    "abc",
    25,
    state.dependencies,
  ),
  {
    source: "branch",
    diff: {
      type: "success",
      unifiedDiff: "tracked patch\nuntracked patch",
      unifiedDiffBytes: 29,
    },
  },
);
deepEqual(state.calls.comparison, [
  {
    host,
    baseBranch: "main",
    commitSha: "abc",
    cwd: "/repo",
    gitManager,
    includeUntrackedFiles: true,
    maxUntrackedFiles: 25,
    source: "branch",
  },
]);
equal(state.calls.query.length, 1);
equal(state.calls.collect.length, 1);
deepEqual(state.calls.collect[0].slice(1), [
  state.comparison.untrackedPaths,
  state.signal,
]);
deepEqual(state.calls.untracked, [[state.reviewSnapshot, "new.txt"]]);
deepEqual(state.calls.sections, [
  [[" tracked patch "], [" untracked patch "]],
]);
equal(state.calls.read.length, 1);
deepEqual(state.calls.utf8, ["tracked patch\nuntracked patch"]);

state = fixture({ comparison: { type: "expected", reason: "no-base" } });
deepEqual(
  await getReviewPatch(
    "/repo",
    "staged",
    gitManager,
    host,
    undefined,
    undefined,
    undefined,
    undefined,
    state.dependencies,
  ),
  { source: "staged", diff: unknownReviewPatchDiff() },
);
equal(state.calls.query.length, 0);
equal(state.calls.collect.length, 0);

state = fixture({
  queryResult: {
    success: false,
    outputLimitExceeded: false,
    code: 128,
  },
});
deepEqual(
  await getReviewPatch(
    "/repo",
    "commit",
    gitManager,
    host,
    undefined,
    undefined,
    "abc",
    undefined,
    state.dependencies,
  ),
  {
    source: "commit",
    diff: { type: "error", error: { type: "mapped", code: 128 } },
  },
);
equal(state.calls.parseError.length, 1);
equal(state.calls.read.length, 0);

state = fixture({
  queryResult: {
    success: true,
    outputLimitExceeded: true,
    stdout: "partial",
    code: 0,
  },
});
deepEqual(
  (
    await getReviewPatch(
      "/repo",
      "unstaged",
      gitManager,
      host,
      undefined,
      undefined,
      undefined,
      undefined,
      state.dependencies,
    )
  ).diff,
  { type: "error", error: { type: "mapped", code: 0 } },
);

const untrackedError = { type: "diff-too-large", limitBytes: 10 };
state = fixture({
  collectUntrackedDiffSections: async () => ({
    success: false,
    error: untrackedError,
  }),
});
deepEqual(
  await getReviewPatch(
    "/repo",
    "uncommitted",
    gitManager,
    host,
    undefined,
    undefined,
    undefined,
    3,
    state.dependencies,
  ),
  {
    source: "uncommitted",
    diff: { type: "error", error: untrackedError },
  },
);
equal(state.calls.parseError.length, 0);
equal(state.calls.read.length, 0);

const trackedGate = deferred();
const untrackedGate = deferred();
const starts = [];
state = fixture({
  fetchQuery: async (config) => {
    starts.push("tracked");
    await trackedGate.promise;
    return config.queryFn();
  },
  collectUntrackedDiffSections: async () => {
    starts.push("untracked");
    await untrackedGate.promise;
    return { success: true, sections: [] };
  },
});
const parallelPatch = getReviewPatch(
  "/repo",
  "staged",
  gitManager,
  host,
  undefined,
  undefined,
  undefined,
  undefined,
  state.dependencies,
);
await new Promise((resolve) => setImmediate(resolve));
deepEqual(starts, ["tracked", "untracked"]);
trackedGate.resolve();
untrackedGate.resolve();
await parallelPatch;

state = fixture({ readResult: null });
equal(
  await getReviewPatch(
    "/repo",
    "staged",
    gitManager,
    host,
    undefined,
    undefined,
    undefined,
    undefined,
    state.dependencies,
  ),
  null,
);
equal(state.calls.read.length, 1);

state = fixture({
  queryResult: { success: true, stdout: "变更" },
  untrackedResult: { type: "success", unifiedDiff: "" },
});
const utf8Patch = await getReviewPatch(
  "/repo",
  "staged",
  gitManager,
  host,
  undefined,
  undefined,
  undefined,
  undefined,
  state.dependencies,
);
equal(utf8Patch.diff.unifiedDiff, "变更");
equal(utf8Patch.diff.unifiedDiffBytes, 6);

console.log(`${count} worker git review patch assertions passed`);
