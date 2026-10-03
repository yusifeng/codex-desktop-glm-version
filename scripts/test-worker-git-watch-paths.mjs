import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  collectGitWatchHandlerPaths,
  combineOptionalBooleans,
  createGitOperationMarkerPaths,
  createGitRepoChangedEvent,
  createGitOperationState,
  createGitWatchTarget,
  addPendingWorkingTreePath,
  getGitWorkingTreeWatchRefreshAction,
  getGitWatchSessionClosePolicy,
  getAffectedWorkingTreePath,
  isGitInternalPath,
  isMissingPathError,
  isWithinPath,
  isWatchedRefPath,
  isWorktreeTopologyPath,
  nextGitWatcherRetryDelay,
  partitionGitWorktreeWatchPaths,
  shouldScheduleGitRepoChange,
  requiresGitWatcherRecovery,
  selectGitMetadataRefreshPaths,
  shouldRetryGitWatchTargetAfterStart,
  shouldScheduleGitWatchSessionRetry,
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
  dirname(value) {
    const index = value.lastIndexOf("/");
    return index <= 0 ? "/" : value.slice(0, index);
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
assert.equal(shouldScheduleGitRepoChange(false, "head", new Set(), new Map()), true);
assert.equal(shouldScheduleGitRepoChange(true, "head", new Set(), new Map()), false);
assert.equal(shouldScheduleGitRepoChange(false, "head", new Set(["head"]), new Map()), false);
assert.equal(shouldScheduleGitRepoChange(false, "head", new Set(), new Map([["head", 1]])), false);
assert.equal(getGitWorkingTreeWatchRefreshAction({ disposed: true, retryScheduled: false, policyCurrent: true, sessionActive: true, nextDirectories: [], previousDirectories: [] }), "skip");
assert.equal(getGitWorkingTreeWatchRefreshAction({ disposed: false, retryScheduled: true, policyCurrent: true, sessionActive: true, nextDirectories: [], previousDirectories: [] }), "skip");
assert.equal(getGitWorkingTreeWatchRefreshAction({ disposed: false, retryScheduled: false, policyCurrent: false, sessionActive: true, nextDirectories: [], previousDirectories: [] }), "skip");
assert.equal(getGitWorkingTreeWatchRefreshAction({ disposed: false, retryScheduled: false, policyCurrent: true, sessionActive: true, nextDirectories: ["/repo/.git/info/exclude"], previousDirectories: ["/repo/.git/info/exclude"] }), "apply");
assert.equal(getGitWorkingTreeWatchRefreshAction({ disposed: false, retryScheduled: false, policyCurrent: true, sessionActive: true, nextDirectories: ["/repo/.git/info/exclude"], previousDirectories: [] }), "restart");
assert.equal(getGitWorkingTreeWatchRefreshAction({ disposed: false, retryScheduled: false, policyCurrent: true, sessionActive: false, nextDirectories: [], previousDirectories: [] }), "restart");
assert.equal(shouldRetryGitWatchTargetAfterStart({ recovering: true, disposed: false, generationUnchanged: true, hasSession: false, metadataMissing: false }), true);
assert.equal(shouldRetryGitWatchTargetAfterStart({ recovering: false, disposed: false, generationUnchanged: true, hasSession: false, metadataMissing: false }), false);
assert.equal(shouldRetryGitWatchTargetAfterStart({ recovering: true, disposed: false, generationUnchanged: false, hasSession: false, metadataMissing: false }), false);
assert.equal(shouldRetryGitWatchTargetAfterStart({ recovering: true, disposed: false, generationUnchanged: true, hasSession: true, metadataMissing: false }), false);
const pathCache = new Map();
assert.deepEqual(collectGitWatchHandlerPaths(pathApi, "/repo", { changeType: "head", shouldHandleChangedPath: (path) => path.endsWith("HEAD") }, ["/repo/.git/HEAD", "/repo/.git/config"], pathCache), ["/repo/.git/HEAD"]);
assert.deepEqual(collectGitWatchHandlerPaths(pathApi, "/repo", { changeType: "working-tree", shouldHandleChangedPath: () => true }, ["/repo/src/.git/HEAD", "/repo/src/.git/config", "/repo/src/file"], pathCache), ["/repo/src", "/repo/src/file"]);
assert.deepEqual(collectGitWatchHandlerPaths(null, "/repo", { changeType: "working-tree", shouldHandleChangedPath: () => true }, ["/repo/file"], pathCache), ["/repo/file"]);
assert.deepEqual(collectGitWatchHandlerPaths(pathApi, "/repo", { changeType: "working-tree", shouldHandleChangedPath: () => false }, ["/repo/file"], pathCache), []);
assert.equal(shouldScheduleGitWatchSessionRetry({ disposed: false, targetRegistered: true, hasRetryTimer: false }), true);
assert.equal(shouldScheduleGitWatchSessionRetry({ disposed: true, targetRegistered: true, hasRetryTimer: false }), false);
assert.equal(shouldScheduleGitWatchSessionRetry({ disposed: false, targetRegistered: false, hasRetryTimer: false }), false);
assert.equal(shouldScheduleGitWatchSessionRetry({ disposed: false, targetRegistered: true, hasRetryTimer: true }), false);
assert.deepEqual(getGitWatchSessionClosePolicy({ disposed: false, sessionMatches: true, elapsedMs: 30_000, stableThresholdMs: 30_000 }), { active: true, resetRetryDelay: true });
assert.deepEqual(getGitWatchSessionClosePolicy({ disposed: false, sessionMatches: false, elapsedMs: 60_000, stableThresholdMs: 30_000 }), { active: false, resetRetryDelay: true });
assert.deepEqual(getGitWatchSessionClosePolicy({ disposed: true, sessionMatches: true, elapsedMs: 1, stableThresholdMs: 30_000 }), { active: false, resetRetryDelay: false });
assert.deepEqual(getGitWatchSessionClosePolicy({ disposed: false, sessionMatches: true, elapsedMs: 1, stableThresholdMs: 30_000 }), { active: true, resetRetryDelay: false });
assert.deepEqual(createGitOperationState({ cherryPickInProgress: false, mergeInProgress: null, rebaseHead: false, rebaseMerge: false, rebaseApply: false, revertInProgress: true }), { cherryPickInProgress: false, mergeInProgress: null, rebaseInProgress: false, revertInProgress: true });
assert.equal(createGitOperationState({ cherryPickInProgress: null, mergeInProgress: null, rebaseHead: false, rebaseMerge: null, rebaseApply: false, revertInProgress: null }).rebaseInProgress, null);
assert.deepEqual(createGitOperationMarkerPaths(pathApi, "/repo/.git"), [
  "/repo/.git/CHERRY_PICK_HEAD",
  "/repo/.git/MERGE_HEAD",
  "/repo/.git/REBASE_HEAD",
  "/repo/.git/rebase-merge",
  "/repo/.git/rebase-apply",
  "/repo/.git/REVERT_HEAD",
]);
assert.deepEqual(selectGitMetadataRefreshPaths(pathApi, "/repo/.git", []), ["/repo/.git"]);
assert.deepEqual(selectGitMetadataRefreshPaths(pathApi, "/repo/.git", [
  "/repo/.git/refs",
  "/repo/.git/refs/heads",
  "/repo/.git/refs/remotes",
  "/repo/.git/info",
  "/repo/.git/worktrees",
  "/repo/.git/worktrees/feature",
  "/repo/.git/config",
]), [
  "/repo/.git/refs",
  "/repo/.git/refs/heads",
  "/repo/.git/refs/remotes",
  "/repo/.git/info",
  "/repo/.git/worktrees",
  "/repo/.git/worktrees/feature",
]);
assert.deepEqual(selectGitMetadataRefreshPaths(pathApi, "/repo/.git", ["/repo/.git/worktrees/feature/HEAD"]), []);
assert.deepEqual(partitionGitWorktreeWatchPaths(
  ["/repo/.git/worktrees/a", "/repo/.git/worktrees/b"],
  ["/repo/.git/worktrees/b", "/repo/.git/worktrees/c"],
), {
  stalePaths: ["/repo/.git/worktrees/a"],
  newPaths: ["/repo/.git/worktrees/c"],
});
assert.deepEqual(partitionGitWorktreeWatchPaths([], ["/repo/.git/worktrees/a"]), {
  stalePaths: [],
  newPaths: ["/repo/.git/worktrees/a"],
});
assert.deepEqual(partitionGitWorktreeWatchPaths(["/repo/.git/worktrees/a"], []), {
  stalePaths: ["/repo/.git/worktrees/a"],
  newPaths: [],
});
const handler = { changeType: "head", shouldHandleChangedPath: () => true };
const target = createGitWatchTarget({ watchPath: "/repo/.git/HEAD", recursive: false, handler, metadataDirectory: null, retryDelayMs: 1000 });
assert.equal(target.generation, 0);
assert.deepEqual(target.handlers, [handler]);
assert.equal(target.retryDelayMs, 1000);
assert.equal(target.session, null);

console.log("70 worker git watch path assertions passed");
