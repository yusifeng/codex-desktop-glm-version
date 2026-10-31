import assert from "node:assert/strict";
import fs from "node:fs";
import { createPrimaryRuntimeUpdatePollerClass } from "../src/main/main-app/misc/primary-runtime-update-poller.ts";

const warnings = [];
const installs = [];
const cacheRequests = [];
const state = new Map([["jitter", 100]]);
const shared = new Map([
  ["codex_runtimes_config", { runtimes: { primary: { channel: "stable" } } }],
  ["statsig_default_enable_features", { enabled: true }],
]);
let cacheStatus = { status: "current", installedBundleVersion: "1.0.0" };
let featureEnabled = true;
const Poller = createPrimaryRuntimeUpdatePollerClass({
  runtime: {
    yn: "primary",
    Ka: { channel: "default" },
    iu: { PRIMARY_RUNTIME_UPDATE_JITTER_MS: "jitter" },
  },
  logger: () => ({ warning: (...args) => warnings.push(args) }),
  updateIntervalMs: 3_600_000,
  isFeatureEnabled: (value) => value?.enabled === true,
  requiresWindowsFramework: (target, release) => target.platform === "win32" && release !== "latest",
  getWindowsRelease: () => "windows-release",
});
const options = {
  appServerConnectionRegistry: { getConnection: (hostId) => ({ hostId }) },
  errorReporter: {},
  getInternalUpdateCdnRequestHeaders: () => ({}),
  getCacheStatus: async (request) => { cacheRequests.push(request); return cacheStatus; },
  getTarget: () => ({ platform: "darwin", arch: "arm64" }),
  globalState: { get: (key) => state.get(key), set: (key, value) => state.set(key, value) },
  hostId: "local",
  installForConnection: async (request) => { installs.push(request); return { bundleVersion: "2.0.0", status: "installed" }; },
  isWorkspaceDependenciesFeatureEnabled: async () => featureEnabled,
  onProgress: () => {},
  sharedObjectRepository: { get: (key) => shared.get(key) },
};

const poller = new Poller(options);
assert.equal(poller.shouldPoll(), true);
assert.equal(poller.shouldTickForSharedObjectUpdate("codex_runtimes_config", null), true);
assert.equal(poller.shouldTickForSharedObjectUpdate("statsig_default_enable_features", { enabled: true }), true);
assert.equal(poller.shouldTickForSharedObjectUpdate("unrelated", null), false);
assert.equal(poller.getJitterMs(), 100);
assert.equal(poller.getNextUpdateAtMs(3_600_050), 3_600_100);

await poller.pollIfDue();
assert.equal(poller.startupChecked, true);
assert.equal(installs.length, 0);
assert.equal(cacheRequests[0].release, "latest");
assert.deepEqual(cacheRequests[0].runtimeInstallConfig, { channel: "stable" });

cacheStatus = { status: "missing" };
const scheduled = new Poller(options);
await scheduled.pollIfDue();
assert.equal(installs.at(-1).trigger, "startup_missing");
assert.equal(installs.at(-1).connection.hostId, "local");

cacheStatus = { status: "current", installedBundleVersion: "2.0.0" };
assert.deepEqual(await poller.runNow("release-2"), {
  bundleVersion: "2.0.0",
  nextRunAt: poller.nextUpdateAtMs,
  reason: "current",
  status: "already-current",
});
cacheStatus = { status: "unsupported" };
assert.equal((await poller.runNow("release-3")).reason, "unsupported-windows-version");
cacheStatus = { status: "outdated" };
const manual = await poller.runNow("release-4");
assert.equal(manual.status, "installed");
assert.equal(manual.bundleVersion, "2.0.0");
assert.equal(installs.at(-1).trigger, "manual_update");
assert.equal(installs.at(-1).release, "release-4");

featureEnabled = false;
assert.equal((await poller.getStatus()).disabledReason, "feature-gate-disabled");
featureEnabled = true;
shared.delete("codex_runtimes_config");
assert.equal(poller.getStaticDisabledReason(), "runtime-config-missing");
shared.set("codex_runtimes_config", { runtimes: {} });
assert.deepEqual(poller.getInstallConfig(), { channel: "default" });

const remote = new Poller({ ...options, hostId: "remote" });
assert.equal(remote.shouldPoll(), false);
assert.equal((await remote.runNow("release")).reason, "not-local-host");

const deferred = Promise.withResolvers();
const busy = new Poller({ ...options, getCacheStatus: () => deferred.promise });
const running = busy.runNow("release-busy");
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal((await busy.runNow("second")).reason, "already-running");
deferred.resolve({ status: "current", installedBundleVersion: "3.0.0" });
assert.equal((await running).status, "already-current");
assert.equal(warnings.length, 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /O6e = createPrimaryRuntimeUpdatePollerClass\(\{/);
assert.doesNotMatch(main, /O6e = class/);

console.log("primary runtime update poller assertions: 28");
