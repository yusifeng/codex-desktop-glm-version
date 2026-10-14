import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await esbuild.build({ bundle: true, entryPoints: [path.join(root, "src/main/worker/git-repo-watcher-state-controller.ts")], format: "esm", logLevel: "silent", platform: "node", target: "node22", write: false });
const { GitRepoWatcherStateController } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
let assertions = 0;
const equal = (a, b) => { assert.equal(a, b); assertions += 1; };
const deepEqual = (a, b) => { assert.deepEqual(a, b); assertions += 1; };

const calls = [];
const pathApi = {
  dirname: (value) => value.slice(0, value.lastIndexOf("/")) || "/",
  isAbsolute: (value) => value.startsWith("/"),
  join: (...parts) => parts.join("/").replaceAll("//", "/"),
  relative: (parent, value) => value.startsWith(`${parent}/`) ? value.slice(parent.length + 1) : value,
  sep: "/",
};
const controller = new GitRepoWatcherStateController({
  addPendingPath: (_api, _root, pending, changed, limit) => {
    if (pending == null) return null;
    pending.add(changed);
    return pending.size > limit ? null : pending;
  },
  createTarget: (input) => ({ ...input, handlers: [input.handler], session: null }),
  emitChange: async (input) => {
    calls.push(["emit", input.getPendingWorkingTreePaths(), input.isHeadRefKnown()]);
    input.setHeadRefState("/next", true);
    input.resetPendingWorkingTreePaths();
  },
  isWithinPath: (_api, parent, value) => value === parent || value.startsWith(`${parent}/`),
  maxPendingPaths: 2,
  reconcileIgnoreSources: async (context, discovered) => {
    calls.push(["reconcile", context.watchTargets.length, discovered.size]);
    return discovered.size > 0;
  },
  requiresRecovery: (targets, ignoreRecovery) => ignoreRecovery || targets.some((target) => target.session == null),
  retryDelayMs: 1000,
});
controller.configure({ disposeSession: async (target) => calls.push(["dispose", target.watchPath]), pathApi, root: "/repo", tryStartWatchSession: async (target, recovering) => calls.push(["start", target.watchPath, recovering]) });

equal(controller.watchTargets.length, 0);
const head = controller.addWatchTarget(pathApi, "/repo/.git/HEAD", "head");
equal(head.watchPath, "/repo/.git");
equal(head.recursive, false);
equal(head.retryDelayMs, 1000);
equal(controller.addWatchTarget(pathApi, null, "head"), undefined);
const same = controller.addWatchTarget(pathApi, "/repo/.git/config", "config");
equal(same, head);
equal(head.handlers.length, 2);
const working = controller.addDirectoryWatchTarget("/repo", "working-tree", () => true);
equal(working.recursive, true);
equal(controller.watchTargets.length, 2);
equal(controller.requiresRecovery(false), true);
working.session = {};
head.session = {};
equal(controller.requiresRecovery(false), false);
equal(controller.requiresRecovery(true), true);

head.session = null;
working.metadataDirectory = { missing: true };
await controller.retryInactive((target, recovering) => calls.push(["retry", target.watchPath, recovering]));
deepEqual(calls.pop(), ["retry", "/repo/.git", true]);

controller.setHeadRefState("/repo/.git/refs/heads/main", true);
const cache = new Map();
equal(controller.isHeadRefPath(pathApi, "/repo/.git/refs/heads", "/repo/.git/refs/heads/main", cache), true);
equal(controller.isHeadRefPath(pathApi, "/repo/.git/refs/heads", "/repo/.git/refs/heads/other", cache), false);
equal(controller.isHeadRefPath(pathApi, "/repo/.git/refs/heads", "/repo/.git/refs/heads/feature", new Map(), (ref) => ref === "feature"), true);
controller.setHeadRefKnown(false);
equal(controller.headRefKnown, false);

controller.recordFileEvent("working-tree", ["/repo/a", "/repo/b"], (kind) => calls.push(["record", kind]));
controller.setHeadRefKnown(true);
await controller.emitRepoChanged({ changeType: "working-tree" });
equal(calls.at(-1)[0], "emit");
deepEqual([...calls.at(-1)[1]], ["/repo/a", "/repo/b"]);
equal(calls.at(-1)[2], true);
controller.recordFileEvent("working-tree", ["/repo/a", "/repo/b", "/repo/c"], () => {});
await controller.emitRepoChanged({});
equal(calls.at(-1)[1], null);
controller.recordFileEvent("head", ["/ignored"], (kind) => calls.push(["record", kind]));
deepEqual(calls.at(-1), ["record", "head"]);

const discovered = new Map([["/ignore", new Set(["/repo/tmp"])]]);
equal(await controller.reconcileIgnoreSources(discovered), true);
deepEqual(calls.at(-1), ["reconcile", 2, 1]);
let discoveries = 0;
const ignored = await controller.readIgnoredDirectories({
  discover: async () => ({ configFiles: ["/config"], ignoreFile: "/ignore" }),
  getEnvironment: async () => "env",
  getWatchTargets: async () => { discoveries += 1; return discoveries === 1 ? discovered : new Map(); },
  isDisposed: () => false,
  readDirectories: async () => ["node_modules"],
});
deepEqual(ignored, ["node_modules"]);
equal(discoveries, 2);

let policyInput;
controller.setIgnoredDirectories(["old"]);
await controller.refreshWorkingTreePolicy({
  getAction: () => "apply",
  getPolicy: () => ({ read: async () => "snapshot", isCurrent: () => true, didApply: () => {} }),
  isDisposed: () => false,
  onApplied: () => calls.push("applied"),
  refresh: async (input) => { policyInput = input; input.setPreviousDirectories(["new"]); input.onApplied(); },
  startSession: async () => {},
});
deepEqual(policyInput.getPreviousDirectories(), ["new"]);
equal(calls.at(-1), "applied");
equal(policyInput.getTarget(), working);

controller.setGitDir("/repo/.git");
const state = await controller.getGitOperationState({
  createMarkerPaths: () => ["a", "b", "c", "d", "e", "f"],
  createState: (value) => value,
  isMissingPathError: (error) => error?.code === "ENOENT",
  stat: async (marker) => { if (marker === "b") throw Object.assign(new Error(), { code: "ENOENT" }); if (marker === "c") throw new Error("denied"); },
});
equal(state.cherryPickInProgress, true);
equal(state.mergeInProgress, false);
equal(state.rebaseHead, null);
equal(state.revertInProgress, true);

controller.ignoreSourceWatches.set("x", {});
controller.changedIgnoreSourcePaths.add("x");
controller.clear();
equal(controller.watchTargets.length, 0);
equal(controller.ignoreSourceWatches.size, 0);
equal(controller.changedIgnoreSourcePaths.size, 0);

const source = fs.readFileSync(path.join(root, ".reference/originals/main/worker.ts"), "utf8");
equal(source.includes('require("./worker/git-repo-watcher-state-controller")'), true);
equal(source.includes("watchTargets = []"), false);
equal(source.includes("pendingWorkingTreePaths = new Set()"), false);
equal(source.includes("ignoreSourceWatches = new Map()"), false);
equal(source.includes("this.stateController.emitRepoChanged"), true);

console.log(`${assertions} worker git repo watcher state controller assertions passed`);
