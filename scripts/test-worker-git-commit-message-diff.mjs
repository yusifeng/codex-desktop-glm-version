import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getCommitMessageDiff,
  unknownDiffError,
} = require("../app/.vite/build/worker/git-commit-message-diff.js");

let count = 0;
const equal = (...args) => { count += 1; assert.equal(...args); };
const deepEqual = (...args) => { count += 1; assert.deepEqual(...args); };

deepEqual(unknownDiffError(), { type: "error", error: { type: "unknown" } });

function fixture(options = {}) {
  const calls = [];
  const host = { id: "host" };
  const repository = { root: "/repo" };
  const gitManager = {
    getWorktreeRepository: async (...args) => {
      calls.push(["repository", ...args]);
      return options.repository === undefined ? repository : options.repository;
    },
  };
  const dependencies = {
    collectTrackedUncommittedDiff: async (...args) => {
      calls.push(["uncommitted", ...args]);
      return { type: "success", unifiedDiff: "working" };
    },
    getReviewPatch: async (...args) => {
      calls.push(["patch", ...args]);
      return { source: "staged", diff: { type: "success", unifiedDiff: "staged" } };
    },
    getSafeAttributeFilterOverrides: async (...args) => {
      calls.push(["filters", ...args]);
      if (options.filterError) throw options.filterError;
      return ["-c", "filter.lfs.clean="];
    },
    normalizeCwd: (cwd) => `normalized:${cwd}`,
  };
  return { calls, dependencies, gitManager, host, repository };
}

const signal = new AbortController().signal;
let state = fixture();
deepEqual(
  await getCommitMessageDiff(
    "/repo",
    false,
    state.gitManager,
    state.host,
    signal,
    state.dependencies,
  ),
  { type: "success", unifiedDiff: "staged" },
);
deepEqual(state.calls, [[
  "patch", "/repo", "staged", state.gitManager, state.host, signal,
]]);

state = fixture({ repository: null });
deepEqual(
  await getCommitMessageDiff(
    "/missing",
    true,
    state.gitManager,
    state.host,
    signal,
    state.dependencies,
  ),
  unknownDiffError(),
);
deepEqual(state.calls, [["repository", "normalized:/missing", state.host]]);

state = fixture({ filterError: new Error("config") });
deepEqual(
  await getCommitMessageDiff(
    "/repo",
    true,
    state.gitManager,
    state.host,
    undefined,
    state.dependencies,
  ),
  unknownDiffError(),
);
deepEqual(state.calls[0], ["repository", "normalized:/repo", state.host]);
deepEqual(state.calls[1], ["filters", state.repository, undefined]);
equal(state.calls.some((call) => call[0] === "uncommitted"), false);

state = fixture();
deepEqual(
  await getCommitMessageDiff(
    "/repo",
    true,
    state.gitManager,
    state.host,
    signal,
    state.dependencies,
  ),
  { type: "success", unifiedDiff: "working" },
);
deepEqual(state.calls, [
  ["repository", "normalized:/repo", state.host],
  ["filters", state.repository, signal],
  ["uncommitted", state.repository, ["-c", "filter.lfs.clean="], signal],
]);

console.log(`${count} worker git commit message diff assertions passed`);
