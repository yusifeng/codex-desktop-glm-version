import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/plugins/startup-reconciliation-lifecycle.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", "require", output.code)(loaded, loaded.exports, (specifier) => {
  if (specifier.endsWith("/service-manager")) return { SkysightServiceManager: class {} };
  if (specifier.endsWith("/chrome-native-host-sync")) return { createChromeNativeHostCacheWatcher() {} };
  if (specifier.endsWith("/orchestrator"))
    return { archiveLegacyChronicleSkill() {}, createBundledPluginsOrchestrator() {} };
  throw new Error(`unexpected require: ${specifier}`);
});
const { createPluginReconciliationLifecycle } = loaded.exports;

const events = [];
const appListeners = new Map();
const app = {
  on(event, listener) { events.push(["app-on", event]); appListeners.set(event, listener); },
  off(event, listener) { events.push(["app-off", event, listener]); if (appListeners.get(event) === listener) appListeners.delete(event); },
};
const disposers = [];
let registryListener;
const connectedRemote = { hostConfig: { kind: "ssh" }, getConnectionState: () => "connected" };
const disconnectedRemote = { hostConfig: { kind: "ssh" }, getConnectionState: () => "disconnected" };
const local = { hostConfig: { kind: "local" }, getConnectionState: () => "connected" };
const registry = {
  getAllHostIds: () => ["connected", "disconnected", "local"],
  getConnection: (id) => ({ connected: connectedRemote, disconnected: disconnectedRemote, local }[id]),
  subscribe(listener) { registryListener = listener; events.push(["registry-subscribe"]); return () => events.push(["registry-dispose"]); },
};
const orchestrator = {
  reconcileComputerHistoryPluginInstallation: (installed) => events.push(["history-plugin", installed]),
  reconcileExternalPluginState: (reason) => events.push(["external", reason]),
  reconcileRemoteSshHost: (connection) => events.push(["remote", connection]),
  reloadBundledPlugins: async () => { events.push(["reload"]); },
  setDesktopFeatureAvailability: async (...args) => { events.push(["availability", ...args]); },
  waitForPendingReconcile: async () => { events.push(["wait"]); },
};
let orchestratorOptions;
let recorderDependencies;
const recorder = { shouldReconcileAfterServiceRespawn: () => true };
const lifecycle = createPluginReconciliationLifecycle({
  app,
  isMacOS: true,
  registerDispose: (dispose) => disposers.push(dispose),
  createCacheWatcher: (options) => {
    events.push(["watcher", options]);
    return { dispose: () => events.push(["watcher-dispose"]), setPluginInstallState: (...args) => events.push(["install-state", ...args]) };
  },
  createOrchestrator: (options) => { orchestratorOptions = options; events.push(["orchestrator"]); return orchestrator; },
  createRecorder: (dependencies) => { recorderDependencies = dependencies; events.push(["recorder"]); return recorder; },
  archiveLegacySkill: async () => ({ archivePath: "/archive" }),
});

equal(lifecycle.getRecorder(), null);
assert.throws(() => lifecycle.reloadBundledPlugins(), /has not started/);
assertions += 1;
const startOptions = {
  appVersion: "1.0.0",
  buildFlavor: "internal",
  codexHome: "/codex",
  connectionRegistry: registry,
  executionCodexHome: "/execution-codex",
  getLocalAppServerConnection: () => "local-connection",
  globalState: {},
  isPackaged: true,
  isRemoteSshConnection: (connection) => connection.hostConfig.kind === "ssh",
  onInstallStateObserved: (value) => events.push(["observed", value]),
  onPluginsReconciled: () => events.push(["plugins-reconciled"]),
  onSkillsMayHaveChanged: () => events.push(["skills-changed"]),
  repoRoot: "/repo",
  requestComputerUseWorker: async (input) => ({ input }),
  trashItem: async (path) => path,
};
equal(lifecycle.start(startOptions), orchestrator);
equal(lifecycle.start(startOptions), orchestrator, "start is idempotent");
equal(events.slice(0, 5).map(([type]) => type), ["watcher", "orchestrator", "registry-subscribe", "recorder", "app-on"]);
equal(disposers.length, 3);
equal(lifecycle.getRecorder(), recorder);
equal(orchestratorOptions.getConnectedRemoteSshAppServerConnections(), [connectedRemote]);
orchestratorOptions.onChromePluginInstallStateChanged("chrome", true);
equal(events.at(-1), ["install-state", "chrome", true]);

let connectionStateHandler;
const addedRemote = {
  hostConfig: { kind: "ssh" },
  getConnectionState: () => "connected",
  registerInternalConnectionStateHandler(listener) { connectionStateHandler = listener; events.push(["state-handler"]); },
};
registryListener({ type: "added", connection: addedRemote });
equal(events.slice(-2), [["state-handler"], ["remote", addedRemote]]);
connectionStateHandler("disconnected");
equal(events.at(-1), ["remote", addedRemote]);
connectionStateHandler("connected");
equal(events.at(-1), ["remote", addedRemote]);
registryListener({ type: "added", connection: local });
equal(events.at(-1), ["remote", addedRemote], "local connections are ignored");

appListeners.get("browser-window-focus")();
equal(events.at(-1), ["external", "focus"]);
await lifecycle.reloadBundledPlugins();
await lifecycle.setDesktopFeatureAvailability({ computerUse: true }, { reason: "test" });
await lifecycle.waitForPendingReconcile();
equal(events.slice(-3), [
  ["reload"],
  ["availability", { computerUse: true }, { reason: "test" }],
  ["wait"],
]);
recorderDependencies.reconcileComputerHistoryPluginInstallation(true);
equal(events.at(-1), ["history-plugin", true]);
await recorderDependencies.archiveLegacyChronicleSkill();
equal(events.at(-1), ["skills-changed"]);
equal(await recorderDependencies.request({ method: "status" }), { input: { method: "status" } });

const focusListener = appListeners.get("browser-window-focus");
disposers[0]();
disposers[1]();
disposers[2]();
equal(events.slice(-3), [["watcher-dispose"], ["registry-dispose"], ["app-off", "browser-window-focus", focusListener]]);
equal(appListeners.has("browser-window-focus"), false);

{
  let recorderCreates = 0;
  const nonMac = createPluginReconciliationLifecycle({
    app: { on() {}, off() {} },
    isMacOS: false,
    registerDispose() {},
    createCacheWatcher: () => ({ dispose() {}, setPluginInstallState() {} }),
    createOrchestrator: () => orchestrator,
    createRecorder: () => { recorderCreates += 1; return recorder; },
  });
  nonMac.start(startOptions);
  equal(nonMac.getRecorder(), null);
  equal(recorderCreates, 0);
}

console.log(`${assertions} plugin reconciliation lifecycle assertions passed`);
