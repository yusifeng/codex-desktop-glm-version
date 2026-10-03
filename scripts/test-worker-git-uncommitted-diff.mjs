import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  collectTrackedUncommittedDiff,
  serializeGitProcessResult,
} = require("../app/.vite/build/worker/git-uncommitted-diff.js");

let count = 0;
const equal = (...args) => { count += 1; assert.equal(...args); };
const deepEqual = (...args) => { count += 1; assert.deepEqual(...args); };

deepEqual(
  serializeGitProcessResult({
    command: "git add",
    success: false,
    code: 1,
    stdout: "out",
    stderr: "err",
    outputLimitExceeded: { limitBytes: 10 },
    ignored: true,
  }),
  {
    command: "git add",
    success: false,
    code: 1,
    stdout: "out",
    stderr: "err",
    outputLimitExceeded: { limitBytes: 10 },
  },
);

function fixture(options = {}) {
  const calls = [];
  const host = {
    remove: async (...args) => {
      calls.push(["remove", ...args]);
      if (options.removeError) throw options.removeError;
    },
  };
  const repository = { root: "/repo", host };
  const dependencies = {
    copyIndex: async (...args) => {
      calls.push(["copy-index", ...args]);
      if (options.copyError) throw options.copyError;
      return "/tmp/index-copy/index";
    },
    createTemporaryDirectory: async (...args) => {
      calls.push(["temp", ...args]);
      if (options.tempError) throw options.tempError;
      return "/tmp/index-copy";
    },
    getIndexContext: async (...args) => {
      calls.push(["index", ...args]);
      return options.index === undefined ? { indexPath: "/repo/.git/index" } : options.index;
    },
    logger: {
      error: (...args) => calls.push(["error", ...args]),
      warning: (...args) => calls.push(["warning", ...args]),
    },
    parseGitError: (result) => ({ type: "mapped", code: result.code }),
    runDiff: async (...args) => {
      calls.push(["diff", ...args]);
      return options.diffResult ?? {
        success: true,
        stdout: "patch",
        stdoutBytes: 5,
      };
    },
    runGit: async (...args) => {
      calls.push(["git", ...args]);
      return options.stageResult ?? { success: true, stdout: "", stderr: "", code: 0 };
    },
  };
  return { calls, dependencies, host, repository };
}

const signal = new AbortController().signal;
let state = fixture({ index: null });
deepEqual(
  await collectTrackedUncommittedDiff(state.repository, [], signal, {}, state.dependencies),
  { type: "error", error: { type: "unknown" } },
);
deepEqual(state.calls, [["index", state.repository, signal]]);

state = fixture();
deepEqual(
  await collectTrackedUncommittedDiff(
    state.repository,
    ["-c", "filter.lfs.clean="],
    signal,
    { binary: true },
    state.dependencies,
  ),
  { type: "success", unifiedDiff: "patch", unifiedDiffBytes: 5 },
);
deepEqual(state.calls[0], ["index", state.repository, signal]);
deepEqual(state.calls[1], ["temp", state.host, "codex-git-index-", signal]);
deepEqual(state.calls[2], [
  "copy-index",
  "/tmp/index-copy",
  { indexPath: "/repo/.git/index" },
  state.host,
]);
deepEqual(state.calls[3], [
  "git",
  "/repo",
  ["add", "-u"],
  state.host,
  {
    configOverrides: ["-c", "filter.lfs.clean="],
    env: { GIT_INDEX_FILE: "/tmp/index-copy/index" },
    signal,
  },
]);
deepEqual(state.calls[4], [
  "diff",
  "/repo",
  ["--cached"],
  state.host,
  {
    binary: true,
    trim: false,
    allowedNonZeroExitCodes: [0, 1],
    env: { GIT_INDEX_FILE: "/tmp/index-copy/index" },
    signal,
  },
]);
deepEqual(state.calls[5], [
  "remove",
  "/tmp/index-copy",
  { recursive: true, force: true },
]);

state = fixture({
  stageResult: {
    command: "git add",
    success: false,
    code: 2,
    stdout: "out",
    stderr: "stage failed",
  },
});
deepEqual(
  await collectTrackedUncommittedDiff(state.repository, [], signal, {}, state.dependencies),
  { type: "error", error: { type: "unknown" } },
);
equal(state.calls.some((call) => call[0] === "diff"), false);
equal(state.calls.at(-2)[0], "warning");
equal(state.calls.at(-1)[0], "remove");
deepEqual(state.calls.at(-2)[2].sensitive, {
  command: "git add",
  success: false,
  code: 2,
  stdout: "out",
  stderr: "stage failed",
  outputLimitExceeded: undefined,
});

for (const diffResult of [
  { success: false, code: 128, stdout: "", stderr: "bad" },
  { success: true, code: 0, stdout: "partial", outputLimitExceeded: { limitBytes: 12 } },
]) {
  state = fixture({ diffResult });
  deepEqual(
    await collectTrackedUncommittedDiff(state.repository, [], signal, {}, state.dependencies),
    { type: "error", error: { type: "mapped", code: diffResult.code } },
  );
  equal(state.calls.at(-2)[0], "warning");
  equal(state.calls.at(-1)[0], "remove");
}

for (const errorOption of [
  { tempError: new Error("temp") },
  { copyError: new Error("copy") },
]) {
  state = fixture(errorOption);
  deepEqual(
    await collectTrackedUncommittedDiff(state.repository, [], signal, {}, state.dependencies),
    { type: "error", error: { type: "unknown" } },
  );
  equal(state.calls.some((call) => call[0] === "error"), true);
  equal(
    state.calls.some((call) => call[0] === "remove"),
    errorOption.copyError != null,
  );
}

state = fixture({ removeError: new Error("cleanup") });
await assert.rejects(
  collectTrackedUncommittedDiff(state.repository, [], signal, {}, state.dependencies),
  /cleanup/,
);
count += 1;

console.log(`${count} worker git uncommitted diff assertions passed`);
