import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  combineOptionalBooleans,
  createGitRepoChangedEvent,
  addPendingWorkingTreePath,
  getAffectedWorkingTreePath,
  isGitInternalPath,
  isMissingPathError,
  isWithinPath,
  isWatchedRefPath,
  isWorktreeTopologyPath,
  nextGitWatcherRetryDelay,
  requiresGitWatcherRecovery,
} = require("../app/.vite/build/worker/git-watch-paths.js");

const pathApi = {
  sep: "/",
  relative(from, to) {
    if (to === from) return "";
    if (to.startsWith(`${from}/`)) return to.slice(from.length + 1);
    return to === "/other" ? "../other" : to;
  },
  isAbsolute(value) {
    return value.startsWith("/");
  },
  join(...parts) {
    return parts.join("/").replaceAll("//", "/");
  },
};

assert.equal(isWithinPath(pathApi, "/repo", "/repo"), true);
assert.equal(isWithinPath(pathApi, "/repo", "/repo/src/file"), true);
assert.equal(isWithinPath(pathApi, "/repo", "/other"), false);
assert.equal(isWatchedRefPath(pathApi, "/repo/refs", "/repo/refs/heads/main"), true);
assert.equal(isWatchedRefPath(pathApi, "/repo/refs", "/repo/refs/heads/main.lock"), false);
const markers = new Set(["HEAD", "commondir", "gitdir", "locked"]);
assert.equal(isWorktreeTopologyPath(pathApi, "/repo/worktrees", "/repo/worktrees/a", markers), true);
assert.equal(isWorktreeTopologyPath(pathApi, "/repo/worktrees", "/repo/worktrees/a/HEAD", markers), true);
assert.equal(isWorktreeTopologyPath(pathApi, "/repo/worktrees", "/repo/worktrees/a/other", markers), false);
assert.equal(combineOptionalBooleans([false, undefined]), null);
assert.equal(combineOptionalBooleans([false, null]), null);
assert.equal(combineOptionalBooleans([false, false]), false);
assert.equal(combineOptionalBooleans([null, true]), true);
assert.equal(isMissingPathError({ code: "ENOENT" }), true);
assert.equal(isMissingPathError({ code: "ENOTDIR" }), true);
assert.equal(isMissingPathError({ code: "EACCES" }), false);
assert.equal(isMissingPathError(null), false);
assert.equal(getAffectedWorkingTreePath(pathApi, "/repo", "/repo/src/.git/HEAD"), "/repo/src");
assert.equal(getAffectedWorkingTreePath(pathApi, "/repo", "/repo/src/.git/config"), null);
assert.equal(isGitInternalPath(pathApi, "/repo/.git", "/repo", "/repo/.git/HEAD"), true);
assert.equal(isGitInternalPath(pathApi, "/repo/.git", "/repo", "/repo/src/file"), false);
let pending = new Set(["/repo/src"]);
assert.equal(addPendingWorkingTreePath(pathApi, "/repo", pending, "/repo/src/file.ts", 4), pending);
pending = new Set(["/repo/src/file.ts"]);
assert.deepEqual([...addPendingWorkingTreePath(pathApi, "/repo", pending, "/repo/src", 4)], ["/repo/src"]);
assert.equal(addPendingWorkingTreePath(pathApi, "/repo", new Set(["/repo/a", "/repo/b", "/repo/c"]), "/repo/d", 2), null);
assert.equal(requiresGitWatcherRecovery([], false), false);
assert.equal(requiresGitWatcherRecovery([{ recursive: true, session: null }], false), true);
assert.equal(requiresGitWatcherRecovery([{ recursive: true, metadataDirectory: { missing: true }, session: null }], false), false);
assert.equal(requiresGitWatcherRecovery([{ recursive: true, session: { coverage: { recursive: true } } }], false), false);
assert.equal(requiresGitWatcherRecovery([], true), true);
assert.deepEqual(createGitRepoChangedEvent({ changeType: "working-tree", commonDir: "/repo/.git", hostId: "local", rebaseInProgress: false, root: "/repo", changedPaths: ["/repo/a"] }), { type: "git-repo-changed", changeType: "working-tree", commonDir: "/repo/.git", hostId: "local", rebaseInProgress: false, root: "/repo", changedPaths: ["/repo/a"] });
assert.deepEqual(createGitRepoChangedEvent({ changeType: "head", commonDir: "/repo/.git", hostId: "local", rebaseInProgress: null, root: "/repo" }), { type: "git-repo-changed", changeType: "head", commonDir: "/repo/.git", hostId: "local", rebaseInProgress: null, root: "/repo" });
assert.equal(nextGitWatcherRetryDelay(1000, 60000), 2000);
assert.equal(nextGitWatcherRetryDelay(50000, 60000), 60000);

console.log("31 worker git watch path assertions passed");
