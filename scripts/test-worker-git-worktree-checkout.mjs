import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  createWorktreeCheckout,
  performWorktreeCheckout,
} = require("../app/.vite/build/worker/git-worktree-checkout.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

function fixture(overrides = {}) {
  const calls = [];
  const repository = { root: "/repo", host: { id: "host" } };
  const host = {
    id: "host",
    platformPath: async () => path.posix,
    createDirectory: async (...args) => { calls.push(["mkdir", ...args]); },
    copy: async (...args) => { calls.push(["copy", ...args]); },
    ...overrides.host,
  };
  const gitManager = {
    getWorktreeRepositoryForRoot: (...args) => {
      calls.push(["repository", ...args]);
      return repository;
    },
  };
  const dependencies = {
    applyPatch: async (...args) => {
      calls.push(["apply", ...args]);
      return { status: "success", appliedPaths: [], skippedPaths: [], conflictedPaths: [] };
    },
    createLocalTrackingBranch: async (...args) => { calls.push(["track", ...args]); return null; },
    deleteLocalTrackingBranch: async (...args) => { calls.push(["untrack", ...args]); },
    getSafeAttributeFilterOverrides: async (...args) => {
      calls.push(["filters", ...args]);
      return ["-c", "filter.safe.required=false"];
    },
    getUntrackedPaths: async (...args) => {
      calls.push(["untracked", ...args]);
      return { success: true, paths: [] };
    },
    logger: { warning: (...args) => calls.push(["warning", ...args]) },
    normalizeRoot: (value) => `normalized:${value}`,
    refreshUpstream: async (...args) => { calls.push(["refresh", ...args]); },
    removeWorktree: async (...args) => { calls.push(["remove", ...args]); },
    resolveStartingState: async (...args) => {
      calls.push(["starting", ...args]);
      return { startingRef: "refs/heads/topic", startingDiff: null };
    },
    runGit: async (...args) => {
      calls.push(["git", ...args]);
      return { success: true, stdout: "", stderr: "" };
    },
    ...overrides.dependencies,
  };
  return { calls, dependencies, gitManager, host, repository };
}

const branchState = { type: "branch", branchName: "topic" };
const checkout = (state, startingState = branchState, options = {}) =>
  performWorktreeCheckout(
    "/repo",
    "/trees/topic",
    startingState,
    state.gitManager,
    state.host,
    options,
    state.dependencies,
  );
const create = (state, startingState = branchState, options = {}) =>
  createWorktreeCheckout(
    "/repo",
    "/trees/topic",
    startingState,
    state.gitManager,
    state.host,
    options,
    state.dependencies,
  );

{
  const state = fixture();
  const result = await checkout(state);
  deepEqual(result, { success: true, startingRef: "refs/heads/topic" });
  deepEqual(state.calls[0], ["repository", "normalized:/repo", state.host]);
  equal(state.calls[1][0], "filters");
  equal(state.calls[2][0], "refresh");
  equal(state.calls[2][1].mode, "never");
  equal(state.calls[3][0], "starting");
  deepEqual(state.calls.find((call) => call[0] === "git").slice(1, 4), [
    "/repo",
    ["worktree", "add", "--detach", "/trees/topic", "refs/heads/topic"],
    state.host,
  ]);
  equal(state.calls.some((call) => call[0] === "untracked"), false);
  equal(state.calls.at(-1)[0], "track");
}

{
  const controller = new AbortController();
  controller.abort();
  const state = fixture();
  const result = await checkout(state, branchState, { signal: controller.signal });
  equal(result.success, false);
  equal(result.error.message, "Operation canceled");
  equal(state.calls.length, 0);
}

{
  const controller = new AbortController();
  const state = fixture({
    dependencies: {
      refreshUpstream: async (...args) => {
        state.calls.push(["refresh", ...args]);
        controller.abort();
      },
    },
  });
  const result = await checkout(state, branchState, {
    signal: controller.signal,
    upstreamRefreshMode: "always",
    upstreamRefreshSignal: "refresh-signal",
  });
  equal(result.success, false);
  equal(state.calls.some((call) => call[0] === "starting"), false);
  equal(state.calls.at(-1)[1].mode, "always");
  equal(state.calls.at(-1)[1].upstreamRefreshSignal, "refresh-signal");
}

{
  const state = fixture({
    dependencies: {
      getUntrackedPaths: async (...args) => {
        state.calls.push(["untracked", ...args]);
        return { success: true, paths: ["a.txt", "nested/b.txt"] };
      },
    },
  });
  const signal = new AbortController().signal;
  const result = await checkout(state, { type: "working-tree" }, { signal });
  equal(result.success, true);
  deepEqual(state.calls.find((call) => call[0] === "untracked").slice(2), [
    undefined,
    undefined,
    signal,
  ]);
  deepEqual(state.calls.filter((call) => call[0] === "copy").map((call) => call.slice(1)), [
    ["/repo/a.txt", "/trees/topic/a.txt"],
    ["/repo/nested/b.txt", "/trees/topic/nested/b.txt"],
  ]);
  equal(state.calls.some((call) => call[0] === "track"), true);
}

{
  const state = fixture({
    dependencies: {
      getUntrackedPaths: async () => ({ success: false, paths: [] }),
    },
  });
  const result = await create(state, { type: "working-tree" });
  equal(result.success, false);
  equal(result.error.message, "Failed to collect untracked working tree files");
  deepEqual(state.calls.at(-1), ["remove", "/trees/topic", state.host, true]);
}

{
  const logs = [];
  const state = fixture({
    dependencies: {
      resolveStartingState: async () => ({
        startingRef: "refs/heads/topic",
        startingDiff: "diff body",
      }),
    },
  });
  const result = await checkout(state, branchState, { onLog: (...args) => logs.push(args) });
  equal(result.success, true);
  equal(new TextDecoder().decode(logs[0][1]), "[info] Applying working tree diff to new worktree\n");
  deepEqual(state.calls.find((call) => call[0] === "apply").slice(1), [
    { cwd: "/trees/topic", diff: "diff body", revert: false },
    state.gitManager,
    state.host,
    { gitConfigOverrides: ["-c", "filter.safe.required=false"], signal: undefined },
  ]);
}

{
  const logs = [];
  const state = fixture({
    dependencies: {
      resolveStartingState: async () => ({ startingRef: "HEAD", startingDiff: "diff" }),
      applyPatch: async () => ({
        status: "partial-success",
        appliedPaths: ["a"],
        skippedPaths: ["b", "c"],
        conflictedPaths: ["d"],
        execOutput: { output: " details \n" },
      }),
    },
  });
  const result = await create(state, branchState, { onLog: (...args) => logs.push(args) });
  equal(result.success, false);
  equal(
    result.error.message,
    "git apply failed: applied:1 skipped:2 conflicted:1\ndetails",
  );
  equal(new TextDecoder().decode(logs.at(-1)[1]).endsWith("details\n"), true);
  equal(state.calls.at(-1)[0], "remove");
}

{
  const state = fixture({
    dependencies: {
      runGit: async () => ({ success: false, stdout: "fallback", stderr: "add failed" }),
    },
  });
  const result = await create(state);
  equal(result.success, false);
  equal(result.error.message, "git worktree add failed: add failed");
  equal(state.calls.at(-1)[0], "remove");
}

{
  const state = fixture();
  const result = await checkout(
    state,
    { type: "branch", branchName: "topic", remoteRef: "refs/remotes/origin/topic" },
  );
  equal(result.success, true);
  equal(state.calls.some((call) => call[0] === "track"), false);
}

{
  const controller = new AbortController();
  const state = fixture({
    dependencies: {
      createLocalTrackingBranch: async (...args) => {
        state.calls.push(["track", ...args]);
        controller.abort();
        return "topic";
      },
    },
  });
  const result = await checkout(state, branchState, { signal: controller.signal });
  equal(result.success, false);
  deepEqual(state.calls.at(-1), ["untrack", state.repository, "topic"]);
}

{
  const thrown = { reason: "boom" };
  const state = fixture({
    dependencies: { getSafeAttributeFilterOverrides: async () => { throw thrown; } },
  });
  const result = await create(state);
  equal(result.success, false);
  equal(result.error.message, "[object Object]");
  equal(state.calls.at(-1)[0], "remove");
}

{
  const cleanupFailure = new Error("cleanup denied");
  const state = fixture({
    dependencies: {
      runGit: async () => ({ success: false, stdout: "failed", stderr: "" }),
      removeWorktree: async () => { throw cleanupFailure; },
    },
  });
  const result = await create(state);
  equal(result.success, false);
  deepEqual(state.calls.at(-1), [
    "warning",
    "Failed to cleanup worktree",
    { safe: {}, sensitive: { error: cleanupFailure } },
  ]);
}

{
  const state = fixture();
  const result = await create(state);
  equal(result.success, true);
  equal(state.calls.some((call) => call[0] === "remove"), false);
}

console.log(`${assertions} worker git worktree checkout assertions passed`);
