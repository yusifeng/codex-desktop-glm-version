import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createGitWorktreeWatchRefreshController } = require("../app/.vite/build/worker/git-worktree-watch-refresh-controller.js");
const root = { watchPath: "/repo/worktrees", generation: 1, metadataDirectory: { missing: false }, session: {}, handlers: [] };
const stale = { watchPath: "/repo/worktrees/old", metadataDirectory: { parentPath: "/repo/worktrees" }, session: {}, handlers: [] };
const targets = [root, stale]; const events = [];
const controller = createGitWorktreeWatchRefreshController({
  isDisposed: () => false, getRootTarget: () => root, getGeneration: (target) => target.generation,
  isMissing: (target) => target.metadataDirectory?.missing === true,
  readDirectory: async () => [{ name: "new", isDirectory: () => true }, { name: "file", isDirectory: () => false }],
  join: (base, name) => `${base}/${name}`, isMissingPathError: (error) => error?.code === "ENOENT",
  onDiscoveryFailure: (error) => events.push(["warn", error.code]), scheduleRetry: (target) => events.push(["retry", target.watchPath]),
  disposeSession: async (target) => events.push(["dispose", target.watchPath]),
  markMissing: (target) => { target.metadataDirectory.missing = true; events.push(["missing", target.watchPath]); }, getTargets: () => targets,
  partition: (existing, discovered) => ({ stalePaths: existing.filter((path) => !discovered.includes(path)), newPaths: discovered.filter((path) => !existing.includes(path)) }),
  getGitDir: () => "/repo/.git", removeTarget: (target) => { targets.splice(targets.indexOf(target), 1); events.push(["remove", target.watchPath]); },
  findTarget: (path) => targets.find((target) => target.watchPath === path),
  addTarget: (path) => { const target = { watchPath: path, metadataDirectory: { parentPath: "/repo/worktrees" }, session: null, handlers: [{ changeType: "worktree-topology" }] }; targets.push(target); events.push(["add", path]); return target; },
  hasTopologyHandler: (target) => target?.handlers.some((handler) => handler.changeType === "worktree-topology") === true,
  startSession: async (target) => { target.session = {}; events.push(["start", target.watchPath]); }, updateRecovery: () => events.push(["recovery"]),
});
await controller.refresh("/repo/worktrees", true);
assert.deepEqual(events, [["dispose", "/repo/worktrees/old"], ["remove", "/repo/worktrees/old"], ["add", "/repo/worktrees/new"], ["start", "/repo/worktrees/new"], ["recovery"]]);
const failureEvents = []; const failureRoot = { watchPath: "/repo/worktrees", generation: 1, metadataDirectory: { missing: false }, session: {} };
const failureController = createGitWorktreeWatchRefreshController({
  isDisposed: () => false, getRootTarget: () => failureRoot, getGeneration: (target) => target.generation,
  isMissing: (target) => target.metadataDirectory.missing, readDirectory: async () => { throw Object.assign(new Error("boom"), { code: "EIO" }); },
  join: (base, name) => `${base}/${name}`, isMissingPathError: (error) => error.code === "ENOENT", onDiscoveryFailure: () => failureEvents.push("warn"), scheduleRetry: () => failureEvents.push("retry"), disposeSession: async () => failureEvents.push("dispose"), markMissing: () => failureEvents.push("missing"), getTargets: () => [failureRoot], partition: () => ({ stalePaths: [], newPaths: [] }), getGitDir: () => null, removeTarget: () => {}, findTarget: () => null, addTarget: () => null, hasTopologyHandler: () => false, startSession: async () => {}, updateRecovery: () => failureEvents.push("recovery"),
});
await failureController.refresh("/repo/worktrees", true); assert.deepEqual(failureEvents, ["warn", "dispose", "recovery", "retry"]);
console.log("9 worker git worktree watch refresh controller assertions passed");
