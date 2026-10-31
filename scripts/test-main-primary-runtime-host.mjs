import assert from "node:assert/strict";
import fs from "node:fs";
import { createPrimaryRuntimeHostClass } from "../src/main/main-app/misc/primary-runtime-host.ts";

const calls = [];
let featureReads = 0;
let registrySubscriptionDisposals = 0;
let sharedSubscriptionDisposals = 0;
class FakePoller {
  constructor(options) { this.options = options; }
  getStatus = async () => ({ enabled: true });
  runNow = async (release) => ({ status: "installed", release });
  shouldPoll = () => true;
  pollIfDue = () => calls.push(["poll"]);
  shouldTickForSharedObjectUpdate = () => true;
  requestImmediateCheck = () => calls.push(["immediate"]);
}
const connection = { id: "connection", getConnectionState: () => "disconnected" };
const registry = {
  getConnection: (hostId) => { calls.push(["connection", hostId]); return connection; },
  subscribe: () => () => registrySubscriptionDisposals++,
};
const sharedValues = new Map([["codex_runtimes_config", { runtimes: {} }]]);
const shared = {
  get: (key) => sharedValues.get(key),
  addSubscriber: () => () => sharedSubscriptionDisposals++,
};
const windows = { sendMessageToAllWindows: (message) => calls.push(["window", message]) };
const installRuntime = async (request) => { calls.push(["install", request]); return { status: "installed" }; };
const repairRuntime = async (request) => { calls.push(["repair", request]); return { status: "repaired" }; };
const Host = createPrimaryRuntimeHostClass({
  runtime: {
    Uf: class {},
    Cn: async () => ({ status: "current" }),
    bn: () => ({ platform: "darwin", arch: "arm64" }),
    xn: () => "bundle-1",
  },
  logger: { i: () => () => ({ info: (...args) => calls.push(["info", ...args]), warning: (...args) => calls.push(["warning", ...args]) }) },
  electron: { net: { fetch: async () => ({}) } },
  defaultHostId: "local",
  UpdatePoller: FakePoller,
  installRuntime,
  cancelInstalls: () => true,
  assertLocalHost: (hostId) => { if (hostId !== "local") throw Error("local host"); },
  diagnoseRuntime: async () => ({ artifactToolVersion: "a", bundleVersion: "b", installed: true, libreOfficeVersion: "l", problems: [], ignored: true }),
  executeDependencyTool: async (request, load) => ({ request, loaded: await load() }),
  readFeatureEnabled: async () => { featureReads++; return true; },
  readDependencies: async ({ hostId }) => ({ hostId, installed: true }),
  repairRuntime,
  buildRuntime: { in: { resolve: () => "build" }, i: () => true, a: () => () => calls.push(["resume-dispose"]) },
  restoreRuntime: async () => {},
  retryIntervalMs: 30_000,
});
const host = new Host(registry, {}, new Map(), shared, windows, () => ({ header: "value" }));

assert.equal(host.getInstalledBundleVersion(), "bundle-1");
assert.deepEqual(await host.install({ hostId: "local", release: "release-1" }), { status: "installed" });
assert.equal(calls.find(([kind]) => kind === "install")[1].release, "release-1");
assert.equal(calls.find(([kind]) => kind === "install")[1].trigger, undefined);
assert.deepEqual(host.cancelInstall({ hostId: "local" }), { canceled: true });
assert.throws(() => host.cancelInstall({ hostId: "remote" }), /local host/);

assert.deepEqual(await host.diagnoseDependencies({ hostId: "local", probeExecutables: true }), {
  artifactToolVersion: "a",
  bundleVersion: "b",
  installed: true,
  libreOfficeVersion: "l",
  problems: [],
});
assert.deepEqual(await host.executeLoadDependenciesTool({ hostId: "local" }), {
  request: { hostId: "local" },
  loaded: { hostId: "local", installed: true },
});

assert.equal(await host.isWorkspaceDependenciesFeatureEnabled("local"), true);
assert.equal(await host.isWorkspaceDependenciesFeatureEnabled("local"), true);
assert.equal(featureReads, 2);
assert.deepEqual(await host.getUpdateStatus(), { enabled: true });
assert.deepEqual(await host.runUpdateNow({ release: "manual" }), { status: "installed", release: "manual" });

await host.resetDependencies({ hostId: "local", release: "repair-release" });
assert.equal(calls.find(([kind]) => kind === "repair")[1].release, "repair-release");
const repairProgress = { phase: "ready" };
calls.find(([kind]) => kind === "repair")[1].onProgress(repairProgress);
assert.deepEqual(calls.find(([kind, message]) => kind === "window" && message.progress === repairProgress)[1], {
  type: "primary-runtime-install-progress",
  hostId: "local",
  progress: repairProgress,
});

const stopPolling = host.startUpdatePolling();
assert.equal(calls.some(([kind]) => kind === "poll"), true);
stopPolling();
assert.equal(registrySubscriptionDisposals, 1);
assert.equal(sharedSubscriptionDisposals, 1);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /L6e = createPrimaryRuntimeHostClass\(\{/);
assert.doesNotMatch(main, /L6e = class/);
assert.equal(fs.existsSync(new URL("../src/main/main-app/misc/primary-runtime.ts", import.meta.url)), false);

console.log("primary runtime host assertions: 24");
