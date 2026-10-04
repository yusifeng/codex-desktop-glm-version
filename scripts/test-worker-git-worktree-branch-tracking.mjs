import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  createLocalTrackingBranch,
  deleteLocalTrackingBranch,
  resolveCreatedWorktreeBranchName,
} = require("../app/.vite/build/worker/git-worktree-branch-tracking.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

function fixture(overrides = {}) {
  const calls = [];
  const repository = { root: "/repo", host: { id: "host" } };
  const dependencies = {
    getCurrentBranch: async (...args) => { calls.push(["current", ...args]); return "current"; },
    getOrderedRemotes: async (...args) => { calls.push(["remotes", ...args]); return ["origin", "upstream"]; },
    localBranchExists: async (...args) => { calls.push(["exists", ...args]); return true; },
    logger: { warning: (...args) => calls.push(["warning", ...args]) },
    resolveRef: async (...args) => { calls.push(["resolve", ...args]); return null; },
    runGit: async (...args) => { calls.push(["git", ...args]); return { success: true, stdout: "", stderr: "" }; },
    ...overrides,
  };
  return { calls, dependencies, repository };
}

{
  const state = fixture();
  equal(await createLocalTrackingBranch(state.repository, "HEAD", undefined, state.dependencies), null);
  equal(state.calls.length, 0);
}

{
  const state = fixture({ getOrderedRemotes: async () => ["upstream"] });
  equal(
    await createLocalTrackingBranch(
      state.repository,
      "refs/remotes/origin/topic",
      undefined,
      state.dependencies,
    ),
    null,
  );
  equal(state.calls.some((call) => call[0] === "git"), false);
}

for (const ref of ["refs/remotes/origin/", "refs/remotes/origin/HEAD"]) {
  const state = fixture();
  equal(await createLocalTrackingBranch(state.repository, ref, undefined, state.dependencies), null);
}

{
  const state = fixture({ resolveRef: async (...args) => { state.calls.push(["resolve", ...args]); return "sha"; } });
  equal(
    await createLocalTrackingBranch(
      state.repository,
      "refs/remotes/origin/topic",
      undefined,
      state.dependencies,
    ),
    null,
  );
  equal(state.calls.some((call) => call[0] === "git"), false);
}

{
  const state = fixture();
  const signal = new AbortController().signal;
  equal(
    await createLocalTrackingBranch(
      state.repository,
      "refs/remotes/origin/team/topic",
      signal,
      state.dependencies,
    ),
    "team/topic",
  );
  deepEqual(state.calls.find((call) => call[0] === "git"), [
    "git",
    "/repo",
    ["branch", "--track", "team/topic", "refs/remotes/origin/team/topic"],
    state.repository.host,
  ]);
  deepEqual(state.calls.filter((call) => call[0] === "resolve").map((call) => call.slice(2)), [
    ["refs/heads/team/topic", signal],
    ["refs/heads/team/topic", undefined, { fresh: true }],
  ]);
}

{
  const state = fixture({
    runGit: async () => ({ success: false, stderr: "cannot create", stdout: "fallback" }),
  });
  await rejects(
    createLocalTrackingBranch(
      state.repository,
      "refs/remotes/origin/topic",
      undefined,
      state.dependencies,
    ),
    /cannot create/,
  );
}

{
  let resolves = 0;
  const failure = new Error("fresh failed");
  const state = fixture({
    resolveRef: async (...args) => {
      state.calls.push(["resolve", ...args]);
      resolves += 1;
      if (resolves === 2) throw failure;
      return null;
    },
  });
  await rejects(
    createLocalTrackingBranch(
      state.repository,
      "refs/remotes/origin/topic",
      undefined,
      state.dependencies,
    ),
    (value) => value === failure,
  );
  deepEqual(state.calls.filter((call) => call[0] === "git").map((call) => call[2]), [
    ["branch", "--track", "topic", "refs/remotes/origin/topic"],
    ["branch", "-D", "topic"],
  ]);
}

{
  const cleanupFailure = new Error("cleanup refresh failed");
  let resolves = 0;
  const state = fixture({
    resolveRef: async () => {
      resolves += 1;
      if (resolves >= 2) throw cleanupFailure;
      return null;
    },
  });
  await rejects(
    createLocalTrackingBranch(
      state.repository,
      "refs/remotes/origin/topic",
      undefined,
      state.dependencies,
    ),
    (value) => value === cleanupFailure,
  );
}

{
  const state = fixture();
  await deleteLocalTrackingBranch(state.repository, "topic", state.dependencies);
  deepEqual(state.calls[0], ["git", "/repo", ["branch", "-D", "topic"], state.repository.host]);
  deepEqual(state.calls[1], [
    "resolve",
    state.repository,
    "refs/heads/topic",
    undefined,
    { fresh: true },
  ]);
}

{
  const state = fixture({
    runGit: async (...args) => {
      state.calls.push(["git", ...args]);
      return { success: false, stderr: "delete failed", stdout: "" };
    },
  });
  await deleteLocalTrackingBranch(state.repository, "topic", state.dependencies);
  deepEqual(state.calls[1], [
    "warning",
    "Failed to cleanup local tracking branch",
    { safe: {}, sensitive: { error: "delete failed" } },
  ]);
  equal(state.calls.at(-1)[0], "resolve");
}

for (const startingState of [
  { type: "working-tree" },
  { type: "branch", branchName: "HEAD" },
  { type: "branch", branchName: "@" },
]) {
  const state = fixture();
  equal(
    await resolveCreatedWorktreeBranchName(
      state.repository,
      startingState,
      "ignored",
      undefined,
      state.dependencies,
    ),
    "current",
  );
}

{
  const state = fixture();
  const signal = new AbortController().signal;
  equal(
    await resolveCreatedWorktreeBranchName(
      state.repository,
      { type: "commit" },
      "refs/heads/topic",
      signal,
      state.dependencies,
    ),
    "topic",
  );
  deepEqual(state.calls.at(-1), ["exists", "/repo", "topic", state.repository.host, signal]);
  state.dependencies.localBranchExists = async () => false;
  equal(
    await resolveCreatedWorktreeBranchName(
      state.repository,
      { type: "commit" },
      "refs/heads/missing",
      signal,
      state.dependencies,
    ),
    null,
  );
}

{
  const state = fixture({ getOrderedRemotes: async () => ["team", "team/repo"] });
  equal(
    await resolveCreatedWorktreeBranchName(
      state.repository,
      { type: "commit" },
      "refs/remotes/team/repo/topic",
      undefined,
      state.dependencies,
    ),
    "repo/topic",
  );
  equal(state.calls.at(-1)[2], "repo/topic");
}

for (const ref of [
  "refs/tags/v1",
  "refs/remotes/unknown/topic",
  "refs/remotes/origin/",
  "refs/remotes/origin/HEAD",
]) {
  const state = fixture();
  equal(
    await resolveCreatedWorktreeBranchName(
      state.repository,
      { type: "commit" },
      ref,
      undefined,
      state.dependencies,
    ),
    null,
  );
}

console.log(`${assertions} worker git worktree branch tracking assertions passed`);
