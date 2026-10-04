import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getStatusCounts,
  getStatusSummary,
  getTrackedStatusSummary,
  parseTrackedStatus,
} = require("../app/.vite/build/worker/git-status-summary.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

{
  const output = [
    "M  staged.txt",
    " M unstaged.txt",
    "R  renamed.txt",
    "old.txt",
    " C copied.txt",
    "copy-source.txt",
    "?? ignored.txt",
  ].join("\0") + "\0";
  deepEqual(parseTrackedStatus(output), {
    type: "success",
    stagedCount: 2,
    stagedRenames: [{ path: "renamed.txt", previousPath: "old.txt" }],
    trackedPaths: [
      "staged.txt",
      "unstaged.txt",
      "renamed.txt",
      "old.txt",
      "copied.txt",
      "copy-source.txt",
    ],
    unstagedCount: 2,
    untrackedCount: null,
  });
  deepEqual(parseTrackedStatus("M  incomplete"), {
    type: "success",
    stagedCount: 0,
    stagedRenames: [],
    trackedPaths: [],
    unstagedCount: 0,
    untrackedCount: null,
  });
}

function fixture(overrides = {}) {
  const calls = [];
  const queryClient = {
    invalidateQueries: (...args) => calls.push(["invalidate", ...args]),
  };
  const repository = {
    root: "/repo",
    host: { id: "host" },
    gitReadGeneration: 7,
    queryClient,
  };
  const dependencies = {
    awaitAbortable: async (...args) => { calls.push(["await", ...args]); return args[0]; },
    fetchQueryWithSignal: async (...args) => {
      calls.push(["fetch", ...args]);
      return args[1].queryFn(args[2]);
    },
    getQueryMeta: () => ({ meta: true }),
    getSafeAttributeFilterOverrides: async (...args) => {
      calls.push(["filters", ...args]);
      return ["safe"];
    },
    getUntrackedPaths: async (...args) => {
      calls.push(["untracked", ...args]);
      return { success: true, paths: ["new-a", "new-b"] };
    },
    queryKey: (...args) => ["query", ...args],
    readCachedStatus: async (...args) => {
      calls.push(["cached", ...args]);
      return "M  cached.txt\0";
    },
    runGit: async (...args) => {
      calls.push(["git", ...args]);
      return { success: true, stdout: " M disk.txt\0" };
    },
    staleTime: Infinity,
    ...overrides,
  };
  return { calls, dependencies, repository };
}

{
  const state = fixture();
  const signal = new AbortController().signal;
  const result = await getTrackedStatusSummary(
    state.repository,
    undefined,
    signal,
    false,
    state.dependencies,
  );
  equal(result.stagedCount, 1);
  equal(result.trackedPaths[0], "cached.txt");
  equal(state.calls.some((call) => call[0] === "git"), false);
  deepEqual(state.calls.find((call) => call[0] === "cached").slice(1), [
    state.repository,
    7,
    false,
    signal,
  ]);
  const fetch = state.calls.find((call) => call[0] === "fetch");
  deepEqual(fetch[2].queryKey, [
    "query",
    "/repo",
    state.repository.host,
    "git-status-summary",
    "7",
    "tracked-only",
  ]);
  equal(fetch[2].staleTime, Infinity);
}

{
  const state = fixture({ readCachedStatus: async () => null });
  const result = await getTrackedStatusSummary(
    state.repository,
    undefined,
    undefined,
    true,
    state.dependencies,
  );
  equal(result.unstagedCount, 1);
  deepEqual(state.calls.find((call) => call[0] === "git").slice(1), [
    "/repo",
    ["status", "--renames", "--porcelain=v1", "-z", "--untracked-files=no"],
    state.repository.host,
    { configOverrides: ["safe"], signal: undefined, trim: false },
  ]);
}

{
  const state = fixture({
    readCachedStatus: async () => null,
    getSafeAttributeFilterOverrides: async () => { throw Error("config failed"); },
  });
  const result = await getTrackedStatusSummary(
    state.repository,
    undefined,
    undefined,
    false,
    state.dependencies,
  );
  deepEqual(result, { type: "error", failureReason: "status_config" });
  equal(state.calls.at(-1)[0], "invalidate");
  deepEqual(state.calls.at(-1)[1], {
    queryKey: ["query", "/repo", state.repository.host, "git-status-summary", "7", "tracked-only"],
    exact: true,
    refetchType: "none",
  });
}

{
  const state = fixture({
    readCachedStatus: async () => null,
    runGit: async () => ({ success: false, stdout: "", stderr: "failed" }),
  });
  const result = await getTrackedStatusSummary(
    state.repository,
    undefined,
    undefined,
    false,
    state.dependencies,
  );
  deepEqual(result, { type: "error", failureReason: "status_command" });
  equal(state.calls.at(-1)[0], "invalidate");
}

{
  const snapshotController = new AbortController();
  const requestController = new AbortController();
  const snapshot = {
    signal: snapshotController.signal,
    read: async (callback) => {
      snapshot.readCalls += 1;
      return callback();
    },
    readCalls: 0,
  };
  const state = fixture();
  await getTrackedStatusSummary(
    state.repository,
    snapshot,
    requestController.signal,
    false,
    state.dependencies,
  );
  equal(snapshot.readCalls, 1);
  equal(state.calls.some((call) => call[0] === "await"), true);
  const combined = state.calls.find((call) => call[0] === "fetch").at(-1);
  equal(combined.aborted, false);
  requestController.abort();
  equal(combined.aborted, true);
}

{
  const state = fixture();
  const result = await getStatusSummary(
    state.repository,
    true,
    undefined,
    undefined,
    false,
    state.dependencies,
  );
  equal(result.untrackedCount, 2);
  equal(state.calls.find((call) => call[0] === "cached")[3], true);
}

{
  const state = fixture({
    getUntrackedPaths: async () => ({ success: false, paths: [] }),
  });
  deepEqual(
    await getStatusSummary(
      state.repository,
      true,
      undefined,
      undefined,
      false,
      state.dependencies,
    ),
    { type: "error", failureReason: "untracked_paths" },
  );
}

{
  const state = fixture({
    readCachedStatus: async () => null,
    runGit: async () => ({ success: false }),
    getUntrackedPaths: async () => ({ success: false, paths: [] }),
  });
  deepEqual(
    await getStatusSummary(
      state.repository,
      true,
      undefined,
      undefined,
      false,
      state.dependencies,
    ),
    { type: "error", failureReason: "status_command" },
  );
}

{
  const state = fixture();
  deepEqual(
    await getStatusCounts(
      state.repository,
      true,
      undefined,
      undefined,
      state.dependencies,
    ),
    { type: "success", stagedCount: 1, unstagedCount: 0, untrackedCount: 2 },
  );
}

{
  const controller = new AbortController();
  controller.abort();
  const state = fixture({
    fetchQueryWithSignal: async () => { throw Error("aborted"); },
  });
  deepEqual(
    await getStatusCounts(
      state.repository,
      false,
      undefined,
      controller.signal,
      state.dependencies,
    ),
    { type: "error", failureReason: "canceled" },
  );
}

{
  const failure = new Error("query exploded");
  const state = fixture({ fetchQueryWithSignal: async () => { throw failure; } });
  await rejects(
    getStatusCounts(
      state.repository,
      false,
      undefined,
      undefined,
      state.dependencies,
    ),
    (value) => value === failure,
  );
}

console.log(`${assertions} worker git status summary assertions passed`);
