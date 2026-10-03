import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const snapshotApi = require("../app/.vite/build/worker/git-turn-diff-snapshot.js");
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

deepEqual(snapshotApi.parseTurnDiffStatus("?? new.txt\0 M tracked.txt\0"), {
  hasTrackedChanges: true,
  untrackedPaths: ["new.txt"],
});
deepEqual(snapshotApi.parseTurnDiffStatus(""), {
  hasTrackedChanges: false,
  untrackedPaths: [],
});
assert.throws(() => snapshotApi.parseTurnDiffStatus("?? bad"), /Malformed/);
count++;

function fixture(overrides = {}) {
  const calls = [];
  const snapshot = {
    generation: 7,
    signal,
    read: async (callback) => {
      calls.push(["snapshot-read"]);
      return callback();
    },
  };
  const repository = {
    root: "/repo",
    host: {},
    reviewSnapshot: snapshot,
    queryClient: {
      fetchQuery: async (options) => {
        calls.push(["query", options]);
        return options.queryFn();
      },
    },
  };
  const deps = {
    queryKey: (...parts) => parts,
    getStatusConfig: async () => ({ core: "false" }),
    runGit: async (_root, args, _host, options) => {
      calls.push(["git", args, options]);
      if (args[0] === "status") return { success: true, stdout: "" };
      if (args[0] === "rev-parse")
        return { success: true, code: 0, stdout: "tree-sha\n" };
      return { success: true, stdout: "written-tree\n" };
    },
    getIndexPath: async () => "/repo/.git/index",
    withTemporaryIndex: async (indexPath, callback, host) => {
      calls.push(["temporary-index", indexPath, host]);
      return callback({ GIT_INDEX_FILE: "/tmp/index" });
    },
    stageWorktree: async (...args) => {
      calls.push(["stage", ...args]);
      return { success: true };
    },
    isObjectId: (value) => value.endsWith("sha") || value.endsWith("tree"),
    normalizeTreeSha: (value) => value,
    ...overrides,
  };
  return { calls, deps, repository, snapshot };
}

let state = fixture();
equal(snapshotApi.normalizeTreeOutput(" tree-sha\n", state.deps), "tree-sha");
assert.throws(
  () => snapshotApi.normalizeTreeOutput("bad", state.deps),
  /Unexpected tree SHA/,
);
count++;

state = fixture();
deepEqual(
  await snapshotApi.readTurnDiffStatus(state.repository, signal, state.deps),
  { hasTrackedChanges: false, untrackedPaths: [] },
);
const statusCall = state.calls.find(
  ([name, args]) => name === "git" && args[0] === "status",
);
equal(statusCall[2].trim, false);
deepEqual(statusCall[2].configOverrides, { core: "false" });

state = fixture();
equal(
  await snapshotApi.createTurnDiffSnapshotTree(
    state.repository,
    signal,
    state.deps,
  ),
  "tree-sha",
);
equal(
  state.calls.some(([name]) => name === "temporary-index"),
  false,
);

state = fixture({
  runGit: async (_root, args) =>
    args[0] === "status"
      ? { success: true, stdout: "?? new.txt\0 M tracked.txt\0" }
      : { success: true, stdout: "written-tree\n" },
});
equal(
  await snapshotApi.createTurnDiffSnapshotTree(
    state.repository,
    signal,
    state.deps,
  ),
  "written-tree",
);
equal(state.calls.filter(([name]) => name === "temporary-index").length, 1);
const stage = state.calls.find(([name]) => name === "stage")[1];
equal(stage.includeTrackedChanges, true);
deepEqual((await stage.untrackedPathsPromise).paths, ["new.txt"]);
deepEqual(stage.env, { GIT_INDEX_FILE: "/tmp/index" });

state = fixture({
  getIndexPath: async () => null,
  runGit: async (_root, args) =>
    args[0] === "status"
      ? { success: true, stdout: "?? new.txt\0" }
      : { success: true },
});
await rejects(
  snapshotApi.createTurnDiffSnapshotTree(state.repository, signal, state.deps),
  /resolve git index path/,
);

state = fixture({
  runGit: async (_root, args) =>
    args[0] === "status"
      ? { success: false, stderr: "status failed", stdout: "" }
      : { success: true },
});
await rejects(
  snapshotApi.readTurnDiffStatus(state.repository, signal, state.deps),
  /status failed/,
);

state = fixture();
equal(
  await snapshotApi.captureTurnDiffSnapshotTree(state.repository, state.deps),
  "tree-sha",
);
deepEqual(
  state.calls.find(([name]) => name === "query")[1].queryKey.slice(-2),
  ["turn-diff-snapshot-tree", "7"],
);
equal(state.calls.find(([name]) => name === "query")[1].staleTime, 0);
equal(state.calls.filter(([name]) => name === "snapshot-read").length, 1);

console.log(`${count} worker git turn-diff snapshot assertions passed`);
