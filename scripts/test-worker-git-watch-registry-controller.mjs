import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/worker/git-watch-registry-controller.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { GitWatchRegistryController } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.equal(actual, expected);
  assertions += 1;
};
const deepEqual = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const calls = [];
let scheduledInput;
let recoveryHandledWatchers;
let refreshMap;
const controller = new GitWatchRegistryController({
  applyInitMetadata: async (input) => {
    calls.push(["apply", input.key, input.getDesiredWatchKey()]);
    input.setDesiredWatchKey("applied");
    input.disposeActiveWatcher();
    return "applied-result";
  },
  ensureInitDesired: async (input) => {
    calls.push(["ensure", input.key, input.getDesiredWatchKey()]);
    input.disposeWatcher();
    input.setDesiredWatchKey(input.key);
    return input.startWatcher();
  },
  getHostKey: (host) => host.id,
  getInitWatchKey: (hostKey, cwd) => `init:${hostKey}:${cwd}`,
  getWatchKey: (hostKey, watchRoot) => `watch:${hostKey}:${watchRoot}`,
  handleInitRecovery: async (input) => {
    recoveryHandledWatchers = input.handledWatchers;
    const duplicate = input.handledWatchers.has(input.watcher);
    if (!duplicate) input.handledWatchers.add(input.watcher);
    calls.push(["recover", input.getWatchKey(input.cwd, input.host), duplicate]);
    input.setDesiredWatchKey("recovered");
    input.clearActiveWatch();
    return duplicate ? "duplicate" : input.refreshMetadata(input.cwd, input.host);
  },
  refreshInitMetadata: async (input) => {
    refreshMap = input.refreshes;
    calls.push(["refresh", input.key, input.refreshes.size]);
    input.invalidateStableMetadata();
    const pending = input.refreshOnce();
    input.refreshes.set(input.key, pending);
    try {
      return await pending;
    } finally {
      input.refreshes.delete(input.key);
    }
  },
  scheduleSetup: async (activeSetup, input) => {
    calls.push(["schedule", activeSetup, input.hostKey, input.watchKey]);
    scheduledInput = input;
    const setup = { id: input.watchKey };
    input.setActiveSetup(setup);
    return setup;
  },
  startInitWatcher: async (input) => {
    calls.push(["start", input.key, input.getActiveWatcher()]);
    input.disposeActiveWatcher();
    const active = { key: input.key, watcher: input.createWatcher() };
    input.setActiveWatcher(active);
    return active;
  },
});

const local = { id: "local", isLocal: true };
const remote = { id: "remote", isLocal: false };
const watchA = { refCount: 1, root: "/a" };
const watchB = { refCount: 1, root: "/b" };
equal(controller.watchCount, 0);
equal(controller.getWatchKey("/a", local), "watch:local:/a");
controller.registerWatch("watch:local:/a", watchA);
controller.registerWatch("watch:remote:/b", watchB);
equal(controller.watchCount, 2);
equal(controller.getWatch("/a", local), watchA);
equal(controller.getWatchByKey("watch:remote:/b"), watchB);
equal(controller.isCurrentWatch("watch:local:/a", watchA), true);
equal(controller.isCurrentWatch("watch:local:/a", watchB), false);
deepEqual(Array.from(controller.getWatches()), [watchA, watchB]);
controller.removeWatch("watch:remote:/b");
equal(controller.watchCount, 1);
equal(controller.getWatch("/b", remote), undefined);

const setup = await controller.scheduleWatchSetup({
  bucketIndexSize: (size) => calls.push(["bucket", size]),
  clearOriginQueries: () => calls.push("clear-origin"),
  closeWatch: () => calls.push("close"),
  commonDir: "/common",
  getTrace: () => "trace",
  host: local,
  indexPath: (commonDir) => `${commonDir}/index`,
  markReady: () => calls.push("ready"),
  setStartTrace: (trace) => calls.push(["trace", trace]),
  startWatcher: async () => calls.push("started"),
  statIndex: async () => ({ size: 12 }),
  watch: watchA,
});
equal(setup.id, "watch:local:/a");
equal(scheduledInput.hostKey, "local");
equal(scheduledInput.watchKey, "watch:local:/a");
equal(scheduledInput.hostIsLocal, true);
equal(scheduledInput.isCurrent(), true);
scheduledInput.bucketIndexSize(12);
deepEqual(calls.pop(), ["bucket", 12]);
watchA.refCount = 0;
equal(scheduledInput.isCurrent(), false);
watchA.refCount = 1;
controller.removeWatch("watch:local:/a");
scheduledInput.bucketIndexSize(20);
equal(calls.some((call) => Array.isArray(call) && call[0] === "bucket" && call[1] === 20), false);
equal(scheduledInput.getActiveSetup(), setup);
scheduledInput.clearActiveSetup({ id: "other" });
equal(scheduledInput.getActiveSetup(), setup);
scheduledInput.clearActiveSetup(setup);
equal(scheduledInput.getActiveSetup(), undefined);
controller.registerWatch("watch:local:/a", watchA);

let disposed = 0;
const firstWatcher = { dispose: () => { disposed += 1; } };
const firstActive = await controller.startGitInitWatch({
  cwd: "/cwd",
  host: local,
  createWatcher: () => firstWatcher,
});
equal(firstActive.watcher, firstWatcher);
equal(controller.activeGitInitWatch, firstActive);
equal(disposed, 0);
const secondWatcher = { dispose: () => { disposed += 10; } };
const secondActive = await controller.startGitInitWatch({
  cwd: "/next",
  host: local,
  createWatcher: () => secondWatcher,
});
equal(disposed, 1);
equal(controller.activeGitInitWatch, secondActive);

const ensured = await controller.ensureGitInitWatch("/desired", local, async () => "started-init");
equal(ensured, "started-init");
equal(disposed, 11);
equal(controller.desiredGitInitWatchKey, "init:local:/desired");
equal(controller.activeGitInitWatch, null);

let refreshCount = 0;
const initWatcher = {};
const recovered = await controller.handleGitInit({
  cwd: "/desired",
  host: local,
  refreshMetadata: async () => {
    refreshCount += 1;
    return "refreshed";
  },
  startWatcher: async () => "restarted",
  watcher: initWatcher,
});
equal(recovered, "refreshed");
equal(refreshCount, 1);
equal(controller.desiredGitInitWatchKey, "recovered");
equal(controller.activeGitInitWatch, null);
const duplicate = await controller.handleGitInit({
  cwd: "/desired",
  host: local,
  refreshMetadata: async () => "unexpected",
  startWatcher: async () => "unexpected",
  watcher: initWatcher,
});
equal(duplicate, "duplicate");
equal(refreshCount, 1);
equal(recoveryHandledWatchers instanceof WeakSet, true);

let invalidations = 0;
const refreshed = await controller.refreshGitInitMetadata({
  cwd: "/desired",
  host: local,
  invalidateStableMetadata: () => { invalidations += 1; },
  refreshOnce: async () => "metadata",
});
equal(refreshed, "metadata");
equal(invalidations, 1);
equal(refreshMap.size, 0);

await controller.startGitInitWatch({
  cwd: "/apply",
  host: remote,
  createWatcher: () => ({ dispose: () => { disposed += 100; } }),
});
const applied = await controller.applyGitInitMetadata({
  cwd: "/apply",
  host: remote,
  getStableMetadata: async () => null,
  ensureWatching: async () => null,
  disposeGitInitWatcher: () => {},
  unwatchRepo: () => {},
  emitHeadChange: () => {},
});
equal(applied, "applied-result");
equal(controller.desiredGitInitWatchKey, "applied");
equal(controller.activeGitInitWatch, null);
equal(disposed, 111);

await controller.startGitInitWatch({
  cwd: "/kept",
  host: local,
  createWatcher: () => ({ dispose: () => { disposed += 1000; } }),
});
await controller.ensureGitInitWatch("/kept", local, async () => "kept");
await controller.startGitInitWatch({
  cwd: "/kept",
  host: local,
  createWatcher: () => ({ dispose: () => { disposed += 1000; } }),
});
controller.disposeGitInitWatcher("/other", local);
equal(controller.activeGitInitWatch != null, true);
equal(controller.desiredGitInitWatchKey, "init:local:/kept");
controller.disposeGitInitWatcher("/kept", local);
equal(controller.activeGitInitWatch, null);
equal(controller.desiredGitInitWatchKey, null);

const workerSource = fs.readFileSync(
  path.join(root, ".reference/originals/main/worker.ts"),
  "utf8",
);
equal(workerSource.includes('require("./worker/git-watch-registry-controller")'), true);
equal(workerSource.includes("watchesByKey = new Map()"), false);
equal(workerSource.includes("watchSetupByHost = new Map()"), false);
equal(workerSource.includes("desiredGitInitWatchKey = null"), false);
equal(workerSource.includes("gitInitMetadataRefreshes = new Map()"), false);
equal(workerSource.includes("this.watchRegistry.scheduleWatchSetup"), true);
equal(workerSource.includes("this.watchRegistry.applyGitInitMetadata"), true);

console.log(`${assertions} worker git watch registry controller assertions passed`);
