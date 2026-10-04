import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createWorktree } = require("../app/.vite/build/worker/git-worktree-create.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

function fixture(overrides = {}) {
  const calls = [];
  const worktreeRepository = {
    setConfigValueForScope: async (...args) => {
      calls.push(["set-config", ...args]);
      return true;
    },
    ...overrides.worktreeRepository,
  };
  const sourceRepository = { root: "/source/repo" };
  const host = {
    isLocal: true,
    codexHome: async () => "/codex",
    platformPath: async () => path.posix,
    writeFile: async (...args) => { calls.push(["write", ...args]); },
    remove: async (...args) => { calls.push(["remove", ...args]); },
    ...overrides.host,
  };
  const gitManager = {
    getWorktreeRepository: async (...args) => {
      calls.push(["source-repository", ...args]);
      return sourceRepository;
    },
    getWorktreeRepositoryForRoot: (...args) => {
      calls.push(["worktree-repository", ...args]);
      return worktreeRepository;
    },
    ...overrides.gitManager,
  };
  const dependencies = {
    copyAgentOverrideFiles: async (...args) => { calls.push(["copy-agents", ...args]); },
    copyWorktreeFiles: async (...args) => { calls.push(["copy-files", ...args]); },
    createWorktreeCheckout: async (...args) => {
      calls.push(["checkout", ...args]);
      return { success: true, startingRef: "refs/heads/topic" };
    },
    createWorktreePath: async (...args) => {
      calls.push(["create-path", ...args]);
      return {
        success: true,
        worktreeGitRoot: "/trees/topic/repo",
        worktreeWorkspaceRoot: "/trees/topic/repo/packages/app",
      };
    },
    ensureWorktreesRoot: async (...args) => { calls.push(["ensure-root", ...args]); },
    findWorktreeIncludeFiles: async (...args) => {
      calls.push(["find-includes", ...args]);
      return ["README.md"];
    },
    formatLocalBranchRef: (branch) => `refs/heads/${branch}`,
    getCommitTree: async (...args) => { calls.push(["tree", ...args]); return "tree-sha"; },
    getDefaultRemoteBranch: async (...args) => {
      calls.push(["default-branch", ...args]);
      return { branch: "main" };
    },
    normalizeCwd: (value) => value,
    normalizeRoot: (value) => value,
    originalWorkspaceEnv: "CODEX_SOURCE_TREE_PATH",
    readLocalEnvironmentConfig: async (...args) => {
      calls.push(["read-environment", ...args]);
      return { type: "success", configPath: "/env/setup.json" };
    },
    removeWorktreeShellEnvironment: async (...args) => { calls.push(["remove-shell", ...args]); },
    reserveWorktreeNameDirectory: async (...args) => {
      calls.push(["reserve", ...args]);
      return "/trees/topic";
    },
    resolveCreatedWorktreeBranchName: async (...args) => {
      calls.push(["resolve-branch", ...args]);
      return "topic";
    },
    resolveWorktreeLocalEnvironmentConfig: async (...args) => {
      calls.push(["resolve-environment", ...args]);
      return "/trees/topic/repo/.codex/environment.json";
    },
    runSetupScript: async (...args) => {
      calls.push(["setup", ...args]);
      return { setupResult: { status: "succeeded" }, shellEnvironment: { version: 1 } };
    },
    setSyncedBranchConfig: async (...args) => { calls.push(["set-synced", ...args]); },
    worktreeIncludeFile: ".worktreeinclude",
    worktreeNameMarker: ".codex-worktree-name",
    worktreeWorkspaceEnv: "CODEX_WORKTREE_PATH",
    writeWorktreeShellEnvironment: async (...args) => { calls.push(["write-shell", ...args]); },
    ...overrides.dependencies,
  };
  return { calls, dependencies, gitManager, host, sourceRepository, worktreeRepository };
}

const baseParams = (state, overrides = {}) => ({
  gitManager: state.gitManager,
  workspaceRoot: "/source/repo/packages/app",
  startingState: { type: "branch", branchName: "topic" },
  host: state.host,
  ...overrides,
});
const run = (state, overrides) => createWorktree(baseParams(state, overrides), state.dependencies);
const names = (state) => state.calls.map((call) => call[0]);

{
  const controller = new AbortController();
  controller.abort();
  const state = fixture();
  const result = await run(state, { signal: controller.signal });
  equal(result.success, false);
  equal(result.error.message, "Request canceled");
  equal(state.calls.length, 0);
}

{
  const state = fixture({ gitManager: { getWorktreeRepository: async () => null } });
  const result = await run(state);
  equal(result.success, false);
  equal(result.error.message, "Not a git repository");
}

{
  const logs = [];
  const state = fixture();
  const onLog = (...args) => logs.push(args);
  const result = await run(state, { onLog });
  equal(result.success, true);
  equal(result.worktreeGitRoot, "/trees/topic/repo");
  equal(result.worktreeWorkspaceRoot, "/trees/topic/repo/packages/app");
  equal(result.setupResult, null);
  deepEqual(state.calls.find((call) => call[0] === "ensure-root").slice(1), [
    state.host,
    "/codex/worktrees",
  ]);
  equal(names(state).includes("copy-agents"), true);
  deepEqual(state.calls.find((call) => call[0] === "copy-files")[1], {
    sourceGitRoot: "/source/repo",
    worktreeGitRoot: "/trees/topic/repo",
    relativePaths: ["README.md"],
    label: ".worktreeinclude",
    host: state.host,
    onLog,
  });
  equal(names(state).includes("set-synced"), true);
  equal(new TextDecoder().decode(logs.at(-1)[1]), "No local environment selected\n");
  deepEqual(state.calls.find((call) => call[0] === "set-config").slice(1, 4), [
    "codex.localEnvironmentConfigPath",
    "__none__",
    "worktree",
  ]);
}

{
  const state = fixture();
  await run(state, { worktreesRoot: "/custom", useWorkspaceDir: true });
  deepEqual(state.calls.find((call) => call[0] === "ensure-root").slice(1), [state.host, "/custom"]);
  equal(names(state).includes("reserve"), false);
}

{
  const allocated = [];
  const state = fixture({
    dependencies: {
      reserveWorktreeNameDirectory: async (...args) => {
        state.calls.push(["reserve", ...args]);
        return "/trees/topic-1234";
      },
    },
  });
  const result = await run(state, {
    name: "topic",
    onWorktreePathAllocated: (value) => allocated.push(value),
  });
  equal(result.worktreeGitRoot, "/trees/topic-1234/repo");
  equal(result.worktreeWorkspaceRoot, "/trees/topic-1234/repo/packages/app");
  deepEqual(allocated, ["/trees/topic-1234/repo"]);
  deepEqual(state.calls.find((call) => call[0] === "write").slice(1), [
    "/trees/topic-1234/.codex-worktree-name",
    "",
  ]);
}

{
  const failure = new Error("reserve denied");
  const state = fixture({
    dependencies: { reserveWorktreeNameDirectory: async () => { throw failure; } },
  });
  const result = await run(state, { name: "topic" });
  equal(result.success, false);
  equal(result.error.cause, failure);
  equal(names(state).includes("checkout"), false);
}

{
  const state = fixture({
    dependencies: {
      createWorktreeCheckout: async () => ({ success: false, error: Error("checkout failed") }),
    },
  });
  const result = await run(state, { name: "topic" });
  equal(result.success, false);
  equal(result.error.message, "checkout failed");
  deepEqual(state.calls.at(-1), ["remove", "/trees/topic", { recursive: true, force: true }]);
}

{
  const state = fixture({ host: { isLocal: false } });
  await run(state);
  equal(names(state).includes("copy-agents"), false);
  equal(names(state).includes("copy-files"), false);
}

for (const params of [
  { setUpSyncedBranch: false },
  { startingState: { type: "branch", branchName: "topic", remoteRef: "refs/remotes/origin/topic" } },
]) {
  const state = fixture();
  await run(state, params);
  equal(names(state).includes("set-synced"), false);
}

{
  const state = fixture({
    dependencies: { getDefaultRemoteBranch: async () => ({ branch: "topic" }) },
  });
  await run(state);
  equal(names(state).includes("set-synced"), false);
}

{
  const logs = [];
  const state = fixture({
    worktreeRepository: { setConfigValueForScope: async () => false },
  });
  await run(state, { onLog: (...args) => logs.push(args) });
  equal(
    logs.some(([, chunk]) =>
      new TextDecoder().decode(chunk).includes("Failed to store selected environment")),
    true,
  );
}

{
  const logs = [];
  const setupStarts = [];
  const state = fixture();
  const result = await run(state, {
    localEnvironmentConfigPath: "/source/env.json",
    onLog: (...args) => logs.push(args),
    onSetupStart: () => setupStarts.push(true),
  });
  equal(result.success, true);
  deepEqual(result.setupResult, { status: "succeeded" });
  deepEqual(setupStarts, [true]);
  deepEqual(state.calls.find((call) => call[0] === "setup")[5], {
    CODEX_SOURCE_TREE_PATH: "/source/repo/packages/app",
    CODEX_WORKTREE_PATH: "/trees/topic/repo/packages/app",
  });
  equal(names(state).includes("write-shell"), true);
  equal(new TextDecoder().decode(logs.at(-1)[1]), "Setup script completed\n");
}

{
  const state = fixture({
    dependencies: {
      resolveWorktreeLocalEnvironmentConfig: async () => { throw Error("copy failed"); },
      readLocalEnvironmentConfig: async (...args) => {
        state.calls.push(["read-environment", ...args]);
        return { type: "success", configPath: args[0] };
      },
    },
  });
  await run(state, { localEnvironmentConfigPath: "/source/env.json" });
  equal(state.calls.find((call) => call[0] === "read-environment")[1], "/source/env.json");
}

for (const allowSetupFailure of [false, true]) {
  const state = fixture({
    dependencies: {
      readLocalEnvironmentConfig: async () => ({ type: "error", error: { message: "invalid env" } }),
    },
  });
  const result = await run(state, {
    localEnvironmentConfigPath: "/env.json",
    allowSetupFailure,
  });
  equal(result.success, allowSetupFailure);
  equal((allowSetupFailure ? result.setupError : result.error).message, "invalid env");
}

for (const allowSetupFailure of [false, true]) {
  const state = fixture({
    dependencies: {
      runSetupScript: async () => ({ setupResult: { status: "failed", error: "setup boom" } }),
    },
  });
  const result = await run(state, {
    localEnvironmentConfigPath: "/env.json",
    allowSetupFailure,
  });
  equal(result.success, allowSetupFailure);
  equal((allowSetupFailure ? result.setupError : result.error).message, "setup boom");
}

{
  const state = fixture({
    dependencies: {
      runSetupScript: async () => ({ setupResult: null, shellEnvironment: null }),
    },
  });
  await run(state, { localEnvironmentConfigPath: "/env.json" });
  equal(names(state).includes("remove-shell"), true);
  equal(names(state).includes("write-shell"), false);
}

{
  const logs = [];
  const state = fixture({
    dependencies: {
      writeWorktreeShellEnvironment: async () => { throw Error("persist failed"); },
    },
  });
  const result = await run(state, {
    localEnvironmentConfigPath: "/env.json",
    onLog: (...args) => logs.push(args),
  });
  equal(result.success, true);
  equal(
    new TextDecoder().decode(logs.at(-1)[1]),
    "Failed to store worktree shell environment: Error: persist failed\n",
  );
}

console.log(`${assertions} worker git worktree create assertions passed`);
