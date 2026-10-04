import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  INVALID_WORKTREE_NAME_MESSAGE,
  WORKTREE_NAME_MARKER,
  createWorktreePath,
  ensureWorktreesRoot,
  getRootRelativeCwd,
  reserveWorktreeNameDirectory,
  resolveWorktreesRoot,
} = require("../app/.vite/build/worker/git-worktree-path-allocation.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

equal(WORKTREE_NAME_MARKER, ".codex-worktree-name");
equal(INVALID_WORKTREE_NAME_MESSAGE.includes("1–64 lowercase letters"), true);

function fixture(overrides = {}) {
  const calls = [];
  const host = {
    isLocal: true,
    workspacesRoot: async () => "/workspaces",
    platformPath: async () => path.posix,
    platformOs: async () => "linux",
    createDirectory: async (...args) => { calls.push(["mkdir", ...args]); },
    writeFile: async (...args) => { calls.push(["write", ...args]); },
    stat: async (...args) => { calls.push(["stat", ...args]); return { isDirectory: () => true }; },
    ...overrides.host,
  };
  const dependencies = {
    logger: { error: (...args) => calls.push(["error", ...args]) },
    normalizeCwd: (value) => `cwd:${value}`,
    normalizeRoot: (value) => `root:${value}`,
    normalizeWindowsPath: (value) => `windows:${value}`,
    processPlatform: "darwin",
    queryKey: (...args) => ["query", ...args],
    random: () => 0.1234,
    randomUUID: () => "abcd-uuid",
    runGit: async (...args) => { calls.push(["git", ...args]); return { success: true, stdout: "packages/app///" }; },
    staleTime: Infinity,
    validateWorktreeName: () => true,
    ...overrides.dependencies,
  };
  return { calls, dependencies, host };
}

{
  const state = fixture();
  equal(await resolveWorktreesRoot(state.host, " /custom/root ", state.dependencies), "/custom/root");
  equal(state.calls.length, 0);
  equal(await resolveWorktreesRoot(state.host, undefined, state.dependencies), "/workspaces/worktrees");
}

{
  const state = fixture({ dependencies: { processPlatform: "win32" } });
  equal(await resolveWorktreesRoot(state.host, "C:/trees", state.dependencies), "windows:C:/trees");
  state.host.isLocal = false;
  equal(await resolveWorktreesRoot(state.host, "C:/trees", state.dependencies), "C:/trees");
}

{
  const state = fixture({ host: { platformOs: async () => "macos" } });
  await ensureWorktreesRoot(state.host, "/trees", state.dependencies);
  deepEqual(state.calls, [
    ["mkdir", "/trees", { recursive: true }],
    ["write", "/trees/.metadata_never_index", ""],
  ]);
  state.calls.length = 0;
  state.host.platformOs = async () => "linux";
  await ensureWorktreesRoot(state.host, "/trees", state.dependencies);
  deepEqual(state.calls, [["mkdir", "/trees", { recursive: true }]]);
}

{
  const state = fixture();
  let queryOptions;
  const repository = {
    root: "/repo",
    host: state.host,
    queryClient: { fetchQuery(options) { queryOptions = options; return "query-result"; } },
  };
  const signal = new AbortController().signal;
  equal(getRootRelativeCwd(repository, "/repo/packages/app", signal, state.dependencies), "query-result");
  deepEqual(queryOptions.queryKey, ["query", "/repo", state.host, "root-relative-cwd", "/repo/packages/app"]);
  equal(queryOptions.staleTime, Infinity);
  equal(await queryOptions.queryFn(), "packages/app");
  deepEqual(state.calls.at(-1), ["git", "/repo/packages/app", ["rev-parse", "--show-prefix"], state.host, { signal }]);
  state.dependencies.runGit = async () => ({ success: false, stderr: "not a repo", stdout: "" });
  await rejects(queryOptions.queryFn(), /Failed to resolve git-root-relative cwd: not a repo/);
}

function manager(repository) {
  return { getWorktreeRepository: async (...args) => {
    manager.calls.push(args);
    return repository;
  } };
}
manager.calls = [];

{
  const state = fixture({ dependencies: { validateWorktreeName: () => false } });
  const result = await createWorktreePath("/repo", manager(null), "/workspace", state.host, "/trees", "BAD", state.dependencies);
  equal(result.success, false);
  equal(result.error.message, INVALID_WORKTREE_NAME_MESSAGE);
  equal(manager.calls.length, 0);
}

{
  manager.calls = [];
  const state = fixture();
  const result = await createWorktreePath("/repo", manager(null), "/workspace", state.host, "/trees", "topic", state.dependencies);
  equal(result.success, false);
  equal(result.error.message, "Failed to resolve the worktree repository.");
  deepEqual(manager.calls[0], ["cwd:/workspace", state.host]);
  equal(state.calls.at(-1)[0], "error");
}

{
  manager.calls = [];
  const state = fixture();
  const repository = {
    root: "/repo",
    host: state.host,
    queryClient: { fetchQuery: (options) => options.queryFn() },
  };
  const result = await createWorktreePath(
    "/source/my-repo", manager(repository), "/source/my-repo/packages/app", state.host, "/trees", "topic", state.dependencies,
  );
  deepEqual(result, {
    success: true,
    worktreeGitRoot: "root:/trees/topic/my-repo",
    worktreeWorkspaceRoot: "cwd:root:/trees/topic/my-repo/packages/app",
  });
  equal(state.calls.some((call) => call[0] === "git"), true);
}

{
  const state = fixture();
  const repository = {
    root: "/repo",
    host: state.host,
    queryClient: { fetchQuery: (options) => options.queryFn() },
  };
  const result = await createWorktreePath(
    "/source/repo", manager(repository), "/workspace", state.host, "/trees", undefined, state.dependencies,
  );
  equal(result.worktreeGitRoot, "root:/trees/abcd/repo");
}

{
  const state = fixture();
  equal(
    await reserveWorktreeNameDirectory("/trees/topic", state.host, undefined, state.dependencies),
    "/trees/topic",
  );
  deepEqual(state.calls[0], ["mkdir", "/trees/topic", { recursive: false }]);
}

{
  const state = fixture();
  let attempts = 0;
  state.host.createDirectory = async (...args) => {
    state.calls.push(["mkdir", ...args]);
    attempts += 1;
    if (attempts === 1) throw new Error("exists");
  };
  equal(
    await reserveWorktreeNameDirectory("/trees/topic-", state.host, undefined, state.dependencies),
    "/trees/topic-1234",
  );
  deepEqual(state.calls.filter((call) => call[0] === "mkdir").map((call) => call[1]), [
    "/trees/topic-", "/trees/topic-1234",
  ]);
}

{
  const state = fixture();
  const failure = new Error("denied");
  state.host.createDirectory = async () => { throw failure; };
  state.host.stat = async () => { throw new Error("missing"); };
  await rejects(reserveWorktreeNameDirectory("/trees/topic", state.host, undefined, state.dependencies), (value) => value === failure);
}

{
  const state = fixture();
  const controller = new AbortController();
  controller.abort();
  await rejects(
    reserveWorktreeNameDirectory("/trees/topic", state.host, controller.signal, state.dependencies),
    (value) => value?.name === "AbortError",
  );
  equal(state.calls.length, 0);
}

{
  const state = fixture();
  let attempts = 0;
  state.host.createDirectory = async () => { attempts += 1; throw new Error(`exists-${attempts}`); };
  await rejects(reserveWorktreeNameDirectory("/trees/topic", state.host, undefined, state.dependencies), /exists-6/);
  equal(attempts, 6);
}

console.log(`${assertions} worker git worktree path allocation assertions passed`);
