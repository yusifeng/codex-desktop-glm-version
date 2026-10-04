import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  COMMIT_TREE_CACHE_MS,
  branchExists,
  createBranch,
  createLocalBranch,
  ensureUnbornHeadBranch,
  getCommitTree,
} = require("../app/.vite/build/worker/git-branch-create.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

function fixture(overrides = {}) {
  const calls = [];
  const host = { id: "local" };
  const results = [...(overrides.results ?? [])];
  const dependencies = {
    formatExecOutput: (params) => ({ formatted: params }),
    formatLocalBranchRef: (branch) => `refs/heads/${branch}`,
    getQueryMeta: () => ({ family: "git" }),
    normalizeCwd: (cwd) => `normalized:${cwd}`,
    queryKey: (...parts) => ["query", ...parts],
    runGit: async (...args) => {
      calls.push(["git", ...args]);
      return results.shift() ?? { success: true, code: 0, stdout: "" };
    },
    setSyncedBranchConfig: async (...args) => { calls.push(["config", ...args]); },
    ...overrides.dependencies,
  };
  return { calls, dependencies, host, results };
}

function repository(state, overrides = {}) {
  return {
    root: "/repo",
    host: state.host,
    queryClient: {
      fetchQuery: async (options) => {
        state.calls.push(["query", options]);
        return options.queryFn();
      },
    },
    ...overrides,
  };
}

const signal = new AbortController().signal;

equal(COMMIT_TREE_CACHE_MS, 250);

{
  const state = fixture({ results: [{ success: true, code: 0 }] });
  equal(await branchExists("/repo", "topic", state.host, signal, state.dependencies), true);
  deepEqual(state.calls[0], [
    "git",
    "/repo",
    ["show-ref", "--verify", "--quiet", "refs/heads/topic"],
    state.host,
    { signal },
  ]);
}

{
  const state = fixture({ results: [{ success: true, code: 1 }, { success: false, code: 0 }] });
  equal(await branchExists("/repo", "topic", state.host, signal, state.dependencies), false);
  equal(await branchExists("/repo", "topic", state.host, signal, state.dependencies), false);
}

{
  const state = fixture({ results: [{ success: true, stdout: "tree-sha" }] });
  const repo = repository(state);
  equal(await getCommitTree(repo, "refs/heads/topic", signal, state.dependencies), "tree-sha");
  const options = state.calls.find(([name]) => name === "query")[1];
  deepEqual(options.queryKey, ["query", "/repo", state.host, "tree", "refs/heads/topic"]);
  equal(options.gcTime, 250);
  equal(options.staleTime, 250);
  deepEqual(options.meta, { family: "git" });
  deepEqual(state.calls.find(([name]) => name === "git"), [
    "git",
    "/repo",
    ["rev-parse", "refs/heads/topic^{tree}"],
    state.host,
    { allowedNonZeroExitCodes: [128], signal },
  ]);
}

{
  for (const [result, message] of [
    [{ success: false, stderr: "bad ref", stdout: "ignored" }, "bad ref"],
    [{ success: false, stderr: "", stdout: "stdout failure" }, "stdout failure"],
    [{ success: true, stderr: "", stdout: "" }, "Failed to resolve tree"],
  ]) {
    const state = fixture({ results: [result] });
    await rejects(getCommitTree(repository(state), "missing", signal, state.dependencies), new RegExp(message));
  }
}

{
  const state = fixture({ results: [{ success: true, code: 0 }] });
  deepEqual(
    await createLocalBranch("/repo", "topic", state.host, false, null, signal, state.dependencies),
    { success: true, branchRef: "refs/heads/topic" },
  );
  equal(state.calls.length, 1);
}

{
  const state = fixture({ results: [{ success: true, code: 0 }] });
  deepEqual(
    await createLocalBranch("/repo", "topic", state.host, true, null, signal, state.dependencies),
    { success: false, reason: "already-exists", error: "Branch already exists" },
  );
  equal(state.calls.length, 1);
}

{
  const state = fixture({ results: [
    { success: false, code: 1 },
    { success: true },
  ] });
  deepEqual(
    await createLocalBranch("/repo", "topic", state.host, false, "origin/main", signal, state.dependencies),
    { success: true, branchRef: "refs/heads/topic" },
  );
  deepEqual(state.calls[1], [
    "git", "/repo", ["branch", "--", "topic", "origin/main"], state.host, { signal },
  ]);
}

{
  const state = fixture({ results: [
    { success: false, code: 1 },
    { success: false, command: "git branch", stdout: "", stderr: "denied" },
  ] });
  const result = await createLocalBranch(
    "/repo", "topic", state.host, false, undefined, signal, state.dependencies,
  );
  equal(result.success, false);
  equal(result.reason, "create-failed");
  equal(result.error, "denied");
  deepEqual(result.execOutput, {
    formatted: {
      command: "git branch",
      stdout: "",
      stderr: "denied",
      fallbackOutput: "denied",
    },
  });
  deepEqual(state.calls[1][2], ["branch", "--", "topic"]);
}

{
  const state = fixture({ results: [{ success: true }] });
  equal(
    await ensureUnbornHeadBranch("/repo", "topic", state.host, signal, state.dependencies),
    null,
  );
  equal(state.calls.length, 1);
}

{
  const state = fixture({ results: [{ success: false }, { success: true }] });
  deepEqual(
    await ensureUnbornHeadBranch("/repo", "topic", state.host, signal, state.dependencies),
    { success: true },
  );
  deepEqual(state.calls.map((call) => call[2]), [
    ["rev-parse", "--verify", "HEAD"],
    ["switch", "-c", "topic"],
  ]);
}

{
  const state = fixture({ results: [
    { success: false },
    { success: false, command: "git switch", stdout: "switch output", stderr: "" },
  ] });
  const result = await ensureUnbornHeadBranch("/repo", "topic", state.host, signal, state.dependencies);
  equal(result.success, false);
  equal(result.error, "switch output");
  equal(result.execOutput.formatted.fallbackOutput, "switch output");
}

{
  const state = fixture();
  const manager = { getWorktreeRepository: async () => { throw new Error("must not run"); } };
  deepEqual(
    await createBranch({ cwd: "  ", branch: "topic", mode: "synced" }, manager, state.host, signal, state.dependencies),
    { status: "error", error: "No workspace available for branch creation" },
  );
  deepEqual(
    await createBranch({ cwd: "/repo", branch: "  ", mode: "synced" }, manager, state.host, signal, state.dependencies),
    { status: "error", error: "Branch name is required" },
  );
  deepEqual(
    await createBranch({ cwd: "/repo", branch: "refs/heads/", mode: "synced" }, manager, state.host, signal, state.dependencies),
    { status: "error", error: "Branch name is required" },
  );
  for (const branch of ["refs/remotes/origin/main", "refs/tags/v1", "refs/heads/refs/heads/topic"]) {
    equal(
      (await createBranch({ cwd: "/repo", branch, mode: "synced" }, manager, state.host, signal, state.dependencies)).error,
      "Only local branches can be created",
    );
  }
}

{
  const state = fixture();
  const manager = {
    getWorktreeRepository: async (...args) => {
      state.calls.push(["repository", ...args]);
      return null;
    },
  };
  deepEqual(
    await createBranch({ cwd: " /repo ", branch: "topic", mode: "synced" }, manager, state.host, signal, state.dependencies),
    { status: "error", error: "No git repository found for branch creation" },
  );
  deepEqual(state.calls[0], ["repository", "normalized:/repo", state.host]);
}

{
  const state = fixture({ results: [
    { success: false, code: 1 },
    { success: true },
    { success: true, stdout: "tree-sha" },
  ] });
  const repo = repository(state);
  const manager = { getWorktreeRepository: async () => repo };
  deepEqual(
    await createBranch(
      { cwd: "/repo", branch: " refs/heads/topic ", mode: "synced", startPoint: "origin/main" },
      manager, state.host, signal, state.dependencies,
    ),
    { status: "success", branch: "topic" },
  );
  const configCall = state.calls.find(([name]) => name === "config");
  deepEqual(configCall, ["config", repo, "refs/heads/topic", "tree-sha", signal]);
}

{
  const state = fixture({ results: [{ success: true, code: 0 }] });
  const repo = repository(state);
  const result = await createBranch(
    { cwd: "/repo", branch: "topic", mode: "synced", failIfExists: true },
    { getWorktreeRepository: async () => repo }, state.host, signal, state.dependencies,
  );
  deepEqual(result, { status: "error", error: "Branch already exists", execOutput: undefined });
  equal(state.calls.some(([name]) => name === "config"), false);
}

{
  const state = fixture();
  const result = await createBranch(
    { cwd: "/repo", branch: "topic", mode: "synced" },
    { getWorktreeRepository: async () => { throw new Error("repository exploded"); } },
    state.host, signal, state.dependencies,
  );
  deepEqual(result, { status: "error", error: "repository exploded" });
  state.dependencies.normalizeCwd = () => { throw "string failure"; };
  deepEqual(
    await createBranch(
      { cwd: "/repo", branch: "topic", mode: "synced" }, {}, state.host, signal, state.dependencies,
    ),
    { status: "error", error: "string failure" },
  );
}

{
  const state = fixture({ results: [{ success: true, code: 0 }] });
  deepEqual(
    await createBranch(
      { cwd: " /workspace ", branch: " topic ", mode: "worktree" },
      {}, state.host, signal, state.dependencies,
    ),
    { status: "success", branch: "topic" },
  );
  equal(state.calls[0][1], "/workspace");
}

{
  const state = fixture({ results: [{ success: true, code: 0 }] });
  const result = await createBranch(
    { cwd: "/repo", branch: "topic", mode: "worktree", failIfExists: true },
    {}, state.host, signal, state.dependencies,
  );
  deepEqual(result, { status: "error", error: "Branch already exists", execOutput: undefined });
  equal(state.calls.length, 1);
}

{
  const state = fixture({ results: [
    { success: false, code: 1 },
    { success: false, stderr: "create failed", command: "git branch" },
  ] });
  const result = await createBranch(
    { cwd: "/repo", branch: "topic", mode: "worktree", startPoint: "main" },
    {}, state.host, signal, state.dependencies,
  );
  equal(result.status, "error");
  equal(result.error, "create failed");
  equal(state.calls.length, 2);
}

{
  const state = fixture({ results: [
    { success: false, code: 1 },
    { success: false, stderr: "create failed", command: "git branch" },
    { success: false },
    { success: true },
  ] });
  deepEqual(
    await createBranch({ cwd: "/repo", branch: "topic", mode: "worktree" }, {}, state.host, signal, state.dependencies),
    { status: "success", branch: "topic" },
  );
  deepEqual(state.calls.map((call) => call[2]), [
    ["show-ref", "--verify", "--quiet", "refs/heads/topic"],
    ["branch", "--", "topic"],
    ["rev-parse", "--verify", "HEAD"],
    ["switch", "-c", "topic"],
  ]);
}

{
  const state = fixture({ results: [
    { success: false, code: 1 },
    { success: false, stderr: "create failed", command: "git branch" },
    { success: true },
  ] });
  const result = await createBranch(
    { cwd: "/repo", branch: "topic", mode: "worktree" }, {}, state.host, signal, state.dependencies,
  );
  equal(result.status, "error");
  equal(result.error, "create failed");
  equal(state.calls.length, 3);
}

{
  const state = fixture({ results: [
    { success: false, code: 1 },
    { success: false, stderr: "create failed", command: "git branch" },
    { success: false },
    { success: false, stderr: "switch failed", command: "git switch" },
  ] });
  const result = await createBranch(
    { cwd: "/repo", branch: "topic", mode: "worktree" }, {}, state.host, signal, state.dependencies,
  );
  equal(result.status, "error");
  equal(result.error, "switch failed");
  equal(result.execOutput.formatted.command, "git switch");
}

{
  const state = fixture();
  equal(
    await createBranch({ cwd: "/repo", branch: "topic", mode: "unknown" }, {}, state.host, signal, state.dependencies),
    undefined,
  );
}

console.log(`${assertions} worker git branch create assertions passed`);
