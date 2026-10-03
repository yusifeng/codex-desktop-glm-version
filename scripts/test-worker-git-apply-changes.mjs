import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  applyGitChangesBetweenTrees,
  filterExistingGitPaths,
  resolveApplyChangesMergeBase,
  stageAndApplyGitChanges,
  stageExistingPatchPaths,
  stageTargetAndApplyGitChanges,
} = require("../app/.vite/build/worker/git-apply-changes.js");

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
    applyPatch: [],
    loggerErrors: [],
    loggerWarnings: [],
    runDiff: [],
    runGit: [],
    temporaryIndex: [],
  };
  const host = {
    platformPath: async () => path.posix,
    stat: async (filePath) => {
      if (options.missingPaths?.includes(filePath)) throw new Error("missing");
      return {};
    },
  };
  const dependencies = {
    applyPatch: async (...args) => {
      calls.applyPatch.push(args);
      return options.applyResult ?? { status: "success" };
    },
    createLogger: () => ({
      error: (message) => calls.loggerErrors.push(message),
      warning: (message) => calls.loggerWarnings.push(message),
    }),
    getTemporaryIndexContext: async (...args) => {
      calls.temporaryIndex.push(["get", ...args]);
      return options.indexContext ?? null;
    },
    normalizeCommitSha: (sha) => `sha:${sha}`,
    parsePatchPaths: () => options.patchPaths ?? ["a.txt", "missing.txt"],
    runDiff: async (...args) => {
      calls.runDiff.push(args);
      return options.diffResult ?? { success: true, stdout: "patch", outputLimitExceeded: false };
    },
    runGit: async (...args) => {
      calls.runGit.push(args);
      if (args[1][0] === "merge-base")
        return options.mergeBaseResult ?? { success: true, stdout: "abc\n" };
      return options.addResult ?? { success: true, stdout: "", stderr: "" };
    },
    serializeExecResult: (result) => ({ serialized: result }),
    withTemporaryIndex: async (context, callback, calledHost) => {
      calls.temporaryIndex.push(["with", context, calledHost]);
      return callback({ GIT_INDEX_FILE: "/tmp/index" });
    },
  };
  const params = {
    sourceHeadRef: "source-head",
    sourceTreeRef: "source-tree",
    destinationRoot: "/repo",
    destinationHeadRef: "destination-head",
    gitManager: { name: "manager" },
    host,
    signal: new AbortController().signal,
  };
  return { calls, dependencies, host, params };
}

let state = fixture();
equal(
  await resolveApplyChangesMergeBase(
    "/repo",
    "source",
    "destination",
    state.host,
    state.params.signal,
    state.dependencies,
  ),
  "sha:abc",
);
deepEqual(state.calls.runGit[0][1], ["merge-base", "source", "destination"]);
deepEqual(state.calls.runGit[0][3].allowedNonZeroExitCodes, [1]);
equal(state.calls.runGit[0][3].signal, state.params.signal);

state = fixture({ mergeBaseResult: { success: false, stdout: "abc" } });
equal(
  await resolveApplyChangesMergeBase(
    "/repo",
    "source",
    "destination",
    state.host,
    state.params.signal,
    state.dependencies,
  ),
  null,
);
state = fixture({ mergeBaseResult: { success: true, stdout: "  " } });
equal(
  await resolveApplyChangesMergeBase(
    "/repo",
    "source",
    "destination",
    state.host,
    state.params.signal,
    state.dependencies,
  ),
  null,
);

deepEqual(
  await filterExistingGitPaths("/repo", ["a.txt", "missing.txt"], {
    platformPath: async () => path.posix,
    stat: async (filePath) => {
      if (filePath.endsWith("missing.txt")) throw new Error("missing");
    },
  }),
  ["a.txt"],
);

state = fixture({ patchPaths: [] });
deepEqual(
  await stageExistingPatchPaths(
    "/repo",
    "patch",
    state.host,
    state.params.signal,
    undefined,
    state.dependencies,
  ),
  { success: true, command: "git add", stdout: "", stderr: "" },
);
equal(state.calls.runGit.length, 0);

state = fixture({ missingPaths: ["/repo/missing.txt"] });
await stageExistingPatchPaths(
  "/repo",
  "patch",
  state.host,
  state.params.signal,
  { GIT_INDEX_FILE: "/tmp/index" },
  state.dependencies,
);
deepEqual(state.calls.runGit[0][1], ["add", "--", "a.txt"]);
deepEqual(state.calls.runGit[0][3].env, { GIT_INDEX_FILE: "/tmp/index" });
equal(state.calls.runGit[0][3].signal, state.params.signal);

state = fixture({
  missingPaths: ["/repo/a.txt", "/repo/missing.txt"],
});
await stageExistingPatchPaths(
  "/repo",
  "patch",
  state.host,
  state.params.signal,
  undefined,
  state.dependencies,
);
equal(state.calls.runGit.length, 0);

state = fixture({ addResult: { success: false, stdout: "", stderr: "bad" } });
await stageTargetAndApplyGitChanges(
  "/repo",
  "patch",
  state.params.gitManager,
  state.host,
  state.params.signal,
  state.dependencies.createLogger(),
  undefined,
  state.dependencies,
);
deepEqual(state.calls.loggerErrors, ["Failed to stage target worktree changes"]);
equal(state.calls.applyPatch.length, 1);
deepEqual(state.calls.applyPatch[0][0], {
  cwd: "/repo",
  diff: "patch",
  allowBinary: true,
  revert: false,
  env: undefined,
});

state = fixture({ indexContext: { indexPath: "/repo/.git/index" } });
await stageAndApplyGitChanges(
  {
    root: "/repo",
    diff: "patch",
    gitManager: state.params.gitManager,
    host: state.host,
    signal: state.params.signal,
    logger: state.dependencies.createLogger(),
  },
  state.dependencies,
);
equal(state.calls.temporaryIndex[0][0], "get");
equal(state.calls.temporaryIndex[1][0], "with");
deepEqual(state.calls.applyPatch[0][0].env, { GIT_INDEX_FILE: "/tmp/index" });

state = fixture();
await stageAndApplyGitChanges(
  {
    root: "/repo",
    diff: "patch",
    gitManager: state.params.gitManager,
    host: state.host,
    signal: state.params.signal,
    logger: state.dependencies.createLogger(),
  },
  state.dependencies,
);
deepEqual(state.calls.loggerWarnings, [
  "Unable to resolve git index path; applying without temp index",
]);

state = fixture();
deepEqual(
  await applyGitChangesBetweenTrees(state.params, state.dependencies),
  { status: "success" },
);
deepEqual(state.calls.runDiff[0][1], ["sha:abc", "source-tree"]);
deepEqual(state.calls.runDiff[0][3], {
  binary: true,
  trim: false,
  allowedNonZeroExitCodes: [0, 1],
  signal: state.params.signal,
});

state = fixture({ mergeBaseResult: { success: false, stdout: "" } });
deepEqual(
  await applyGitChangesBetweenTrees(state.params, state.dependencies),
  { status: "command-error" },
);
equal(state.calls.runDiff.length, 0);

for (const diffResult of [
  { success: false, stdout: "bad", outputLimitExceeded: false },
  { success: true, stdout: "large", outputLimitExceeded: true },
]) {
  state = fixture({ diffResult });
  deepEqual(
    await applyGitChangesBetweenTrees(state.params, state.dependencies),
    { status: "command-error", execOutput: { serialized: diffResult } },
  );
}

state = fixture({ diffResult: { success: true, stdout: "", outputLimitExceeded: false } });
deepEqual(
  await applyGitChangesBetweenTrees(state.params, state.dependencies),
  { status: "success" },
);
equal(state.calls.applyPatch.length, 0);

const applyError = { status: "error", execOutput: { output: "failed" } };
state = fixture({ applyResult: applyError });
deepEqual(
  await applyGitChangesBetweenTrees(state.params, state.dependencies),
  { status: "command-error", execOutput: applyError.execOutput },
);

state = fixture({
  applyResult: {
    status: "partial-success",
    appliedPaths: ["a"],
    skippedPaths: ["b"],
    conflictedPaths: ["c"],
    ignoredField: true,
  },
});
deepEqual(
  await applyGitChangesBetweenTrees(state.params, state.dependencies),
  {
    status: "partial-success",
    appliedPaths: ["a"],
    skippedPaths: ["b"],
    conflictedPaths: ["c"],
  },
);

console.log(`${count} worker git apply changes assertions passed`);
