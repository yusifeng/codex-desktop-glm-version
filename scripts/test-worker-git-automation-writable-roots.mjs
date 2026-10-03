import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveAutomationWritableRoots } = require(
  "../app/.vite/build/worker/git-automation-writable-roots.js",
);

let count = 0;
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

const host = { id: "local" };
function fixture({ worktree = null, source = null, commonDir = null, indexPath = null } = {}) {
  const calls = [];
  return {
    calls,
    deps: {
      host,
      path: path.posix,
      gitManager: {
        async getWorktreeRepository(cwd, requestHost) {
          calls.push(["worktree", cwd, requestHost]);
          return cwd === "/worktree/nested" ? worktree : source;
        },
        async getRepoRepository(cwd, requestHost) {
          calls.push(["repo", cwd, requestHost]);
          return commonDir == null ? null : { getCommonDir: () => commonDir };
        },
      },
      async getIndexPath(repository) {
        calls.push(["index", repository]);
        return indexPath;
      },
    },
  };
}

const params = { sourceCwd: "/source/nested", worktreeCwd: "/worktree/nested" };

let state = fixture({
  worktree: { root: "/worktree" },
  source: { root: "/source" },
  commonDir: "/common/.git",
});
deepEqual(await resolveAutomationWritableRoots(params, state.deps), [
  "/worktree",
  "/source",
  "/common/.git",
]);
deepEqual(state.calls.at(2), ["repo", "/worktree", host]);

state = fixture({
  worktree: { root: "/worktree/nested" },
  source: { root: "/source" },
  commonDir: "../shared.git",
});
deepEqual(await resolveAutomationWritableRoots(params, state.deps), [
  "/source",
  "/shared.git",
]);

state = fixture({
  source: { root: "/source" },
  commonDir: "relative.git",
});
deepEqual(await resolveAutomationWritableRoots(params, state.deps), [
  "/source",
  "/source/relative.git",
]);
deepEqual(state.calls.at(2), ["repo", "/source/nested", host]);

state = fixture({
  worktree: { root: "/worktree" },
  source: { root: "/worktree" },
  indexPath: "/metadata/worktrees/id/index",
});
deepEqual(await resolveAutomationWritableRoots(params, state.deps), [
  "/worktree",
  "/metadata/worktrees/id",
]);

state = fixture({ source: { root: "/source" } });
deepEqual(await resolveAutomationWritableRoots(params, state.deps), [
  "/source",
  "/source/.git",
]);

state = fixture();
deepEqual(await resolveAutomationWritableRoots(params, state.deps), []);
deepEqual(
  state.calls.filter(([kind]) => kind === "index"),
  [],
);

console.log(`${count} worker git automation writable-roots assertions passed`);
