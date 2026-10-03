import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  deleteWorktreeWithSnapshot,
  inspectWorktreePath,
  resolveManagedWorktreeState,
  resolveWorktreeSnapshot,
} = require("../app/.vite/build/worker/git-worktree-snapshot.js");

function deleteFixture({ snapshotError } = {}) {
  const events = [];
  const dependencies = {
    captureWorktreeSnapshot: async (...args) => {
      events.push(["snapshot", ...args]);
      if (snapshotError) throw snapshotError;
    },
    deleteWorktree: async (...args) => events.push(["delete", ...args]),
    getWorktreeId: async (worktree) => `id:${worktree}`,
    logSnapshotFailure: (params) => events.push(["warning", params]),
  };
  return { dependencies, events };
}

const deleteManager = { id: "git" };
const deleteHost = { id: "host" };
let deleteState = deleteFixture();
assert.equal(
  await deleteWorktreeWithSnapshot(
    deleteManager,
    "/worktree",
    deleteHost,
    "user-delete",
    true,
    deleteState.dependencies,
  ),
  undefined,
);
assert.deepEqual(deleteState.events, [
  ["snapshot", deleteManager, "/worktree", deleteHost, "user-delete"],
  ["delete", "/worktree", deleteHost, true],
]);

const snapshotError = Error("snapshot failed");
deleteState = deleteFixture({ snapshotError });
await assert.rejects(
  deleteWorktreeWithSnapshot(
    deleteManager,
    "/worktree",
    deleteHost,
    "user-delete",
    false,
    deleteState.dependencies,
  ),
  snapshotError,
);
assert.equal(deleteState.events[1][1].reason, "user-delete");
assert.equal(deleteState.events[1][1].error, snapshotError);
assert.equal(deleteState.events[1][1].worktreeId instanceof Promise, true);
assert.equal(await deleteState.events[1][1].worktreeId, "id:/worktree");
assert.equal(deleteState.events.some((event) => event[0] === "delete"), false);

deleteState = deleteFixture({ snapshotError });
assert.equal(
  await deleteWorktreeWithSnapshot(
    deleteManager,
    "/worktree",
    deleteHost,
    "settings-delete-targeted",
    false,
    deleteState.dependencies,
  ),
  undefined,
);
assert.deepEqual(deleteState.events.at(-1), ["delete", "/worktree", deleteHost, false]);

const missing = () => Object.assign(new Error("missing"), { code: "ENOENT" });
const states = new Map();
const commits = new Map();
const host = {
  id: "local",
  stat: async (path) => {
    const state = states.get(path);
    if (state === "missing" || state == null) throw missing();
    if (state === "error") throw new Error("stat failed");
    return { isDirectory: () => state === "directory" };
  },
};
const deps = {
  gitManager: {
    getStableMetadata: async (root) => root === "/invalid" ? null : { root, commonDir: `${root}/.git` },
    getWorktreeRepositoryForRoot: (root) => ({ root }),
  },
  host,
  signal: new AbortController().signal,
  getWorktreeId: async (path) => `id:${path}`,
  normalizeWorktreePath: (path) => `normalized:${path}`,
  getSnapshotRef: (id) => `refs/${id}`,
  normalizeRoot: (path) => path,
  getCommitSha: async (repo) => commits.get(repo.root) ?? null,
  isMissingError: (error) => error?.code === "ENOENT",
};

states.set("/repo", "directory");
commits.set("/repo", "abc");
assert.deepEqual(await resolveWorktreeSnapshot(["/repo"], "/worktree", deps), { snapshotRef: "refs/id:normalized:/worktree", worktreeId: "id:normalized:/worktree", repoRoot: "/repo", commonDir: "/repo/.git", exists: true, commitSha: "abc" });
commits.clear();
assert.deepEqual(await resolveWorktreeSnapshot(["/repo"], "/worktree", deps), { snapshotRef: "refs/id:normalized:/worktree", worktreeId: "id:normalized:/worktree", exists: false, commitSha: null });
await assert.rejects(resolveWorktreeSnapshot(["/missing"], "/worktree", deps), /No candidate workspace roots exist/);
states.set("/invalid", "directory");
await assert.rejects(resolveWorktreeSnapshot(["/invalid"], "/worktree", deps), /No candidate workspace roots are valid/);

assert.equal(await inspectWorktreePath(host, "/repo", deps.isMissingError), "available");
assert.equal(await inspectWorktreePath(host, "/missing", deps.isMissingError), "missing");
states.set("/file", "file");
assert.equal(await inspectWorktreePath(host, "/file", deps.isMissingError), "unavailable");

assert.deepEqual(await resolveManagedWorktreeState([], "/repo", "/worktree", deps), { kind: "available" });
states.set("/repo", "missing");
states.set("/worktree", "directory");
assert.deepEqual(await resolveManagedWorktreeState([], "/repo", "/worktree", deps), { kind: "gone" });
states.set("/worktree", "missing");
assert.deepEqual(await resolveManagedWorktreeState([], "/repo", "/worktree", deps), { kind: "unavailable", reason: "no-candidate-roots" });
states.set("/repo", "directory");
commits.set("/repo", "abc");
assert.deepEqual((await resolveManagedWorktreeState(["/repo"], "/cwd-missing", "/worktree-missing", deps)).kind, "restorable");
states.set("/broken", "error");
assert.deepEqual(await resolveManagedWorktreeState([], "/broken", "/worktree", deps), { kind: "unavailable", reason: "inspection-failed" });

console.log("22 worker git worktree snapshot assertions passed");
