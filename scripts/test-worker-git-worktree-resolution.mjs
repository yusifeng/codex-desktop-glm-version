import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getWorktreeSortTimestamp,
  hasUncommittedWorktreeChanges,
  isPathWithinManagedRoot,
  resolveWorktreeForThread,
} = require("../app/.vite/build/worker/git-worktree-resolution.js");

const normalize = (path) => path.replaceAll("\\", "/").toLowerCase();
assert.equal(isPathWithinManagedRoot("/wt/repo", "/wt", normalize), true);
assert.equal(isPathWithinManagedRoot("/wt2/repo", "/wt", normalize), false);
assert.equal(isPathWithinManagedRoot("C:\\WT\\repo", "c:/wt/", normalize), true);
assert.equal(isPathWithinManagedRoot("/repo", "/", normalize), true);
assert.equal(isPathWithinManagedRoot("/", "/", normalize), true);

const timestampHost = {
  stat: async (root) => {
    if (root === "/missing") throw new Error("missing");
    if (root === "/mtime") return { birthtimeMs: 0, mtimeMs: 8 };
    return { birthtimeMs: 10, mtimeMs: 20 };
  },
};
assert.equal(await getWorktreeSortTimestamp("/birth", timestampHost), 10);
assert.equal(await getWorktreeSortTimestamp("/mtime", timestampHost), 8);
assert.equal(await getWorktreeSortTimestamp("/missing", timestampHost), 0);

function dirtyDeps(status, untracked) {
  let untrackedSignal;
  return {
    deps: {
      getTrackedStatus: async () => status,
      getUntrackedPaths: async (_repository, signal) => {
        untrackedSignal = signal;
        return untracked;
      },
    },
    signal: () => untrackedSignal,
  };
}

let dirty = dirtyDeps({ type: "success", stagedCount: 1, unstagedCount: 0 }, { success: true, paths: [] });
assert.equal(await hasUncommittedWorktreeChanges({}, dirty.deps), true);
assert.equal(dirty.signal().aborted, true);
dirty = dirtyDeps({ type: "success", stagedCount: 0, unstagedCount: 0 }, { success: true, paths: ["new"] });
assert.equal(await hasUncommittedWorktreeChanges({}, dirty.deps), true);
assert.equal(dirty.signal().aborted, false);
dirty = dirtyDeps({ type: "error" }, { success: true, paths: ["new"] });
assert.equal(await hasUncommittedWorktreeChanges({}, dirty.deps), false);
assert.equal(dirty.signal().aborted, true);
await assert.rejects(hasUncommittedWorktreeChanges({}, {
  getTrackedStatus: async () => { throw new Error("status failed"); },
  getUntrackedPaths: async () => ({ success: true, paths: [] }),
}), /status failed/);

const configs = new Map();
const metadata = new Map();
const times = new Map();
let worktrees = [];
let sourceRepository = { root: "/source" };
let listed = 0;
const deps = {
  gitManager: {
    getWorktreeRepository: async () => sourceRepository,
    getStableMetadata: async (root) => metadata.get(root) ?? null,
    getWorktreeRepositoryForRoot: (root) => ({ root }),
  },
  host: {
    platformPath: async () => ({ join: (...parts) => parts.join("/") }),
    stat: async (root) => {
      if (!times.has(root)) throw new Error("missing");
      const value = times.get(root);
      return { birthtimeMs: value.birth ?? 0, mtimeMs: value.mtime ?? 0 };
    },
  },
  signal: new AbortController().signal,
  getManagedWorktreeLocations: async () => [{ path: "/managed" }],
  getRootRelativeCwd: async () => "packages/app",
  listWorktrees: async () => { listed += 1; return worktrees; },
  readThreadConfig: async (repository) => configs.get(repository.root) ?? null,
  getTrackedStatus: async () => ({ type: "success", stagedCount: 0, unstagedCount: 0 }),
  getUntrackedPaths: async () => ({ success: true, paths: [] }),
  normalizeWorkspaceRoot: (path) => `normalized:${path}`,
  normalizeComparisonPath: normalize,
};
const params = { cwd: "/source/packages/app", conversationId: "thread" };

sourceRepository = null;
assert.deepEqual(await resolveWorktreeForThread(params, deps), {
  worktreeGitRoot: null,
  worktreeWorkspaceRoot: null,
  hasUncommittedChanges: false,
});
sourceRepository = { root: "/source" };

metadata.set(params.cwd, { root: "/source", commonDir: "/common/" });
metadata.set("/managed/candidate", { root: "/managed/candidate", commonDir: "/common" });
listed = 0;
assert.deepEqual(await resolveWorktreeForThread({ ...params, threadCwd: "/managed/candidate" }, deps), {
  worktreeGitRoot: "/managed/candidate",
  worktreeWorkspaceRoot: "normalized:/managed/candidate/packages/app",
  hasUncommittedChanges: false,
});
assert.equal(listed, 0);

metadata.set("/outside", { root: "/outside", commonDir: "/common" });
configs.set("/outside", { ownerThreadId: "thread" });
assert.equal((await resolveWorktreeForThread({ ...params, threadCwd: "/outside" }, deps)).worktreeGitRoot, "/outside");
metadata.set("/other-repo", { root: "/other-repo", commonDir: "/other" });
configs.set("/other-repo", { ownerThreadId: "thread" });
worktrees = [];
assert.equal((await resolveWorktreeForThread({ ...params, threadCwd: "/other-repo" }, deps)).worktreeGitRoot, null);

worktrees = [{ root: "/older" }, { root: "/newer" }, { root: "/same-z" }, { root: "/same-a" }];
for (const worktree of worktrees) configs.set(worktree.root, { ownerThreadId: "thread" });
times.set("/older", { birth: 1 });
times.set("/newer", { birth: 20 });
times.set("/same-z", { mtime: 20 });
times.set("/same-a", { birth: 20 });
assert.equal((await resolveWorktreeForThread(params, deps)).worktreeGitRoot, "/same-z");
configs.set("/same-z", { ownerThreadId: "other" });
assert.equal((await resolveWorktreeForThread(params, deps)).worktreeGitRoot, "/same-a");

console.log("22 worker git worktree resolution assertions passed");
