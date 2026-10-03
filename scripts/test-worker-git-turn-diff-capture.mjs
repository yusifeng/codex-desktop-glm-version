import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const captureApi = require("../app/.vite/build/worker/git-turn-diff-capture.js");
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

function fixture(overrides = {}) {
  const calls = [];
  const repository = { root: "/repo" };
  const gitManager = {
    async getWorktreeRepository(...args) {
      calls.push(["repository", ...args]);
      return repository;
    },
    getWorktreeRepositoryForRoot(...args) {
      calls.push(["repository-root", ...args]);
      return repository;
    },
  };
  const deps = {
    captureSnapshotTree: async () => {
      calls.push(["snapshot"]);
      return calls.filter(([name]) => name === "snapshot").length === 1
        ? "base-tree"
        : "head-tree";
    },
    getHeadCommit: async () => "head-commit",
    getRepositoryStatus: async (...args) => {
      calls.push(["status", ...args]);
      return { statusGeneration: 3 };
    },
    runGit: async (root, args, host, options) => {
      calls.push(["git", root, args, host, options]);
      return { success: true, stdout: "", stderr: "" };
    },
    runDiff: async (...args) => {
      calls.push(["diff", ...args]);
      return { success: true, stdout: "diff text", stdoutBytes: 9 };
    },
    parseDiffError: () => ({ type: "unknown" }),
    classifyGitError: () => "repository_missing",
    normalizeTreeSha: (sha) => sha,
    hash: async (_algorithm, value) => `hash-${value}`,
    now: () => 1000,
    randomUUID: () => "uuid",
    captureTtlMs: 100,
    checkpointTtlMs: 700,
    maxDiffBytes: 123,
    sessionStartDiffTimeoutMs: 50,
    ...overrides,
  };
  return { calls, deps, gitManager, repository };
}

let state = fixture();
deepEqual(
  await captureApi.computeTurnDiff(
    {
      root: "/repo",
      baseRef: "a",
      headTreeSha: "b",
      host: {},
      signal,
      timeoutMs: 7,
    },
    state.deps,
  ),
  { type: "success", unifiedDiff: "diff text", unifiedDiffBytes: 9 },
);
const diffOptions = state.calls.find(([name]) => name === "diff")[4];
equal(diffOptions.maxOutputBytes, 123);
equal(diffOptions.timeoutMs, 7);

state = fixture({
  runDiff: async () => ({
    success: false,
    outputLimitExceeded: true,
    stderr: "bad",
  }),
});
deepEqual(
  await captureApi.computeTurnDiff(
    { root: "/repo", baseRef: "a", headTreeSha: "b", host: {}, signal },
    state.deps,
  ),
  {
    type: "error",
    error: { type: "unknown", failureReason: "repository_missing" },
  },
);

state = fixture();
await captureApi.retainTree(
  { root: "/repo", ref: "refs/test", treeSha: "tree", host: {}, signal },
  state.deps,
);
await captureApi.releaseTree(
  { root: "/repo", ref: "refs/test", host: {} },
  state.deps,
);
deepEqual(
  state.calls.filter(([name]) => name === "git").map(([, , args]) => args),
  [
    ["update-ref", "refs/test", "tree"],
    ["update-ref", "-d", "refs/test"],
  ],
);

state = fixture({ runGit: async () => ({ success: false }) });
await rejects(
  captureApi.retainTree(
    { root: "/repo", ref: "x", treeSha: "tree", host: {}, signal },
    state.deps,
  ),
  /retain/,
);

state = fixture({
  runGit: async () => ({
    success: true,
    stdout: "refs/x/100/a old\nrefs/x/800/b recent\nrefs/x/900/c latest\n",
  }),
});
equal(
  await captureApi.findRecentCheckpoint(
    { root: "/repo", refPrefix: "refs/x/*", nowMs: 1000, host: {} },
    state.deps,
  ),
  "latest",
);

state = fixture();
const started = await captureApi.startTurnDiffCapture(
  {
    host: {},
    baseTurnId: null,
    checkpointKey: "scope",
    cwd: "/cwd",
    gitManager: state.gitManager,
    isRepoWatched: () => true,
    signal,
    turnId: "turn",
  },
  state.deps,
);
equal(started.baseTreeSha, "base-tree");
equal(started.sessionStartCommitSha, "head-commit");
equal(
  started.checkpointScopeRefPrefix,
  "refs/codex/turn-diffs/checkpoints/hash-scope",
);
equal(
  started.checkpointRefPrefix,
  "refs/codex/turn-diffs/checkpoints/hash-scope/hash-turn",
);
equal(started.statusGeneration, 3);
equal(started.sessionStartDiff.type, "success");
equal(
  state.calls.some(
    ([name, , args]) => name === "git" && args[1]?.endsWith("/base"),
  ),
  true,
);

state = fixture();
state.gitManager.getWorktreeRepository = async () => null;
equal(
  await captureApi.startTurnDiffCapture(
    { host: {}, cwd: "/cwd", gitManager: state.gitManager, signal },
    state.deps,
  ),
  null,
);

state = fixture();
const capture = {
  root: "/repo",
  baseTreeSha: "base-tree",
  baseTurnHeadTreeSha: null,
  sessionStartCommitSha: "head-commit",
  sessionStartDiff: null,
  refPrefix: "refs/codex/turn-diffs/captures/1/id",
  checkpointScopeRefPrefix: "refs/codex/turn-diffs/checkpoints/scope",
  checkpointRefPrefix: "refs/codex/turn-diffs/checkpoints/scope/turn",
};
const completed = await captureApi.completeTurnDiffCapture(
  {
    host: {},
    capture,
    gitManager: state.gitManager,
    retainCheckpoint: true,
    signal,
  },
  state.deps,
);
equal(completed.headTreeSha, "base-tree");
equal(completed.diff.type, "success");
equal(
  state.calls.filter(
    ([name, , args]) =>
      name === "git" && args[0] === "update-ref" && args[1] === "-d",
  ).length,
  3,
);
equal(
  state.calls.some(
    ([name, , args]) =>
      name === "git" &&
      args[1]?.startsWith("refs/codex/turn-diffs/checkpoints/scope/turn/"),
  ),
  true,
);

console.log(`${count} worker git turn-diff capture assertions passed`);
