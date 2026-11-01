import assert from "node:assert/strict";
import fs from "node:fs";
import { createWindowRpcServiceAdapters } from "../app/.vite/build/main-app/window/rpc-service-adapters.js";

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

class RpcHandlerBase {}
const calls = [];
const runtimeFeatureUpdates = [];
let releaseCallback = null;
let phase4 = false;
const adapters = createWindowRpcServiceAdapters({
  RpcHandlerBase,
  watchKeyboardRelease(keys, callback) {
    calls.push(["watchKeyboardRelease", keys]);
    if (keys[0] === "alternate") return undefined;
    releaseCallback = callback;
    return { watching: true };
  },
  async listLocalEnvironments(workspaceRoot, executionHost) {
    calls.push(["listLocalEnvironments", workspaceRoot, executionHost]);
    return ["environment-1"];
  },
  async readLocalEnvironment(configPath, executionHost) {
    calls.push(["readLocalEnvironment", configPath, executionHost]);
    return { configPath };
  },
  async saveLocalEnvironment(executionHost, options) {
    calls.push(["saveLocalEnvironment", executionHost, options]);
    return { revision: "revision-2" };
  },
  getUseWslPaths: (hostConfig) => hostConfig.useWslPaths === true,
  isRemoteHostConfig: (hostConfig) => hostConfig.kind === "remote",
  convertPathForDesktopHost: (path, useWslPaths) => `desktop:${useWslPaths}:${path}`,
  convertPathForAgentEnvironment: (path, useWslPaths) => `agent:${useWslPaths}:${path}`,
  app: {
    isRuntimeFeatureEnabled(name) {
      if (name === "unsupported") throw new Error("Unsupported Owl feature: unsupported");
      if (name === "failure") throw new Error("runtime failure");
      return name === "enabled";
    },
    setRuntimeFeatures(features) { runtimeFeatureUpdates.push(structuredClone(features)); },
  },
  runtimeFeatureNames: ["feature-a", "feature-b"],
  getFeatureFlags: () => ({ noPluginListPhase4: phase4 }),
  getCanonicalMarketplaceName: (buildFlavor) => `official-${buildFlavor}`,
  isOfficialMarketplaceName: (name) => name.startsWith("official-"),
  async listMarketplaceGroups(options) {
    calls.push(["listMarketplaceGroups", options]);
    return { groups: options.marketplaces.map((marketplace) => marketplace.name) };
  },
});

const lifecycleCalls = [];
const lifecycleManager = new Proxy(
  {},
  {
    get(_target, property) {
      return (...args) => {
        lifecycleCalls.push([property, ...args]);
        return `result:${String(property)}`;
      };
    },
  },
);
const origin = { id: "origin" };
const hotkey = new adapters.HotkeyWindowService(lifecycleManager, origin);
equal(hotkey instanceof RpcHandlerBase, true);
equal(hotkey.getState(), "result:getState");
equal(hotkey.setEnabled(true), undefined);
equal(hotkey.toggle(), "result:toggle");
equal(hotkey.open({ route: "/home" }), "result:openFromRenderer");
equal(hotkey.collapseToHome(), "result:collapseToHome");
equal(hotkey.dismiss(), undefined);
equal(hotkey.setHotkey("Cmd+K"), "result:setHotkey");
equal(hotkey.setDevOverrideEnabled(false), "result:setDevOverrideEnabled");
equal(hotkey.transitionDone("opened"), undefined);
equal(hotkey.homePointerInteractionChanged("inside"), undefined);
equal(hotkey.homeLayoutChanged({ width: 10 }), undefined);
equal(hotkey.homeDragStart({ x: 1 }), undefined);
equal(hotkey.homeDragMove(), undefined);
equal(hotkey.homeDragEnd(), undefined);
equal(lifecycleCalls.find(([name]) => name === "openFromRenderer"), [
  "openFromRenderer",
  origin,
  { route: "/home" },
]);
equal(lifecycleCalls.find(([name]) => name === "handleDragStart"), undefined);
equal(lifecycleCalls.at(-3), ["handleHomeDragStart", origin, { x: 1 }]);
equal(lifecycleCalls.at(-2), ["handleHomeDragMove", origin]);
equal(lifecycleCalls.at(-1), ["handleHomeDragEnd", origin]);

const keyboard = new adapters.KeyboardModifierService();
let released = false;
const releasePromise = keyboard.watchRelease("meta").then(() => { released = true; });
await Promise.resolve();
equal(released, false);
equal(calls.at(-1), ["watchKeyboardRelease", ["command"]]);
releaseCallback();
await releasePromise;
equal(released, true);
await keyboard.watchRelease("alt");
equal(calls.at(-1), ["watchKeyboardRelease", ["alternate"]]);

const localHost = { hostConfig: { kind: "local", useWslPaths: true } };
const remoteHost = { hostConfig: { kind: "remote", useWslPaths: false } };
const registry = { get: (hostId) => hostId === "local" ? localHost : remoteHost };
const environments = new adapters.LocalEnvironmentsService(registry);
equal(await environments.list({ hostId: "local", workspaceRoot: "/workspace" }), {
  environments: ["environment-1"],
});
equal(calls.at(-1), ["listLocalEnvironments", "/workspace", localHost]);
equal(await environments.read({ configPath: "/config", hostId: "remote" }), {
  environment: { configPath: "/config" },
});
equal(calls.at(-1), ["readLocalEnvironment", "/config", remoteHost]);
equal(
  await environments.saveConfig({
    configPath: "/config",
    expectedRevision: "revision-1",
    hostId: "local",
    raw: "contents",
  }),
  { configPath: "agent:true:desktop:true:/config", revision: "revision-2" },
);
equal(calls.at(-1), [
  "saveLocalEnvironment",
  localHost,
  { configPath: "desktop:true:/config", expectedRevision: "revision-1", raw: "contents" },
]);
equal(
  await environments.saveConfig({
    configPath: "/remote-config",
    expectedRevision: null,
    hostId: "remote",
    raw: "remote",
  }),
  { configPath: "agent:false:/remote-config", revision: "revision-2" },
);

const owl = new adapters.OwlRuntimeFeaturesService();
equal(await owl.isOwlFeatureEnabled("enabled"), true);
equal(await owl.isOwlFeatureEnabled("disabled"), false);
equal(await owl.isOwlFeatureEnabled("unsupported"), false);
await assert.rejects(() => owl.isOwlFeatureEnabled("failure"), /runtime failure/);
assertions += 1;
await owl.setRuntimeFeatures({ "feature-a": true, ignored: true });
equal(runtimeFeatureUpdates, [{ "feature-a": true }]);
await owl.setRuntimeFeatures({ "feature-b": false });
equal(runtimeFeatureUpdates.at(-1), { "feature-a": true, "feature-b": false });
await owl.setRuntimeFeatures({ ignored: false });
equal(runtimeFeatureUpdates.length, 2);
adapters.resetRuntimeFeatures();
equal(runtimeFeatureUpdates.at(-1), {});
await owl.setRuntimeFeatures({ "feature-b": true });
equal(runtimeFeatureUpdates.at(-1), { "feature-b": true });

const performanceCalls = [];
const messageHandler = {
  startPerformanceSpanCpuSampling: (...args) => performanceCalls.push(["start", ...args]),
  cancelPerformanceSpanCpuSampling: (...args) => performanceCalls.push(["cancel", ...args]),
  finishPerformanceSpanCpuSampling: (...args) => {
    performanceCalls.push(["finish", ...args]);
    return { finished: args[0] };
  },
};
const telemetry = new adapters.PerformanceTelemetryService(messageHandler, origin);
equal(telemetry.startSpanCpuSampling({ requestId: "one" }), undefined);
equal(telemetry.cancelSpanCpuSampling("one"), undefined);
equal(telemetry.finishSpanCpuSampling("one"), { finished: "one" });
equal(performanceCalls, [
  ["start", origin, { requestId: "one" }],
  ["cancel", "one"],
  ["finish", "one"],
]);

function createAppServer({ fail = false } = {}) {
  return {
    async sendAppServerRequest(method, params) {
      calls.push(["sendAppServerRequest", method, params]);
      if (fail) throw new Error("listing failed");
      return { marketplaces: [
        { name: "official-prod" },
        { name: "official-beta" },
        { name: "community" },
        { name: "hidden" },
      ] };
    },
    async listPlugins(params) {
      calls.push(["listPlugins", params]);
      if (fail) throw new Error("listing failed");
      return { marketplaces: [
        { name: "official-prod" },
        { name: "official-beta" },
        { name: "community" },
        { name: "hidden" },
      ] };
    },
    async codexHome() { return "/codex-home"; },
    async platformPath() { return { sep: "/" }; },
  };
}

const marketplace = new adapters.PluginMarketplaceListingService(createAppServer());
equal(
  await marketplace.list({
    buildFlavor: "prod",
    cwds: ["/workspace"],
    hiddenMarketplaceNames: ["hidden"],
    marketplaceKinds: ["plugin"],
  }),
  { groups: ["official-prod", "community"] },
);
equal(calls.findLast(([name]) => name === "listPlugins"), [
  "listPlugins",
  { cwds: ["/workspace"], marketplaceKinds: ["plugin"] },
]);
const groupCall = calls.findLast(([name]) => name === "listMarketplaceGroups");
equal(groupCall[1].codexHome, "/codex-home");
equal(groupCall[1].marketplaces.map(({ name }) => name), ["official-prod", "community"]);

phase4 = true;
await marketplace.list({
  buildFlavor: "prod",
  cwds: [],
  hiddenMarketplaceNames: [],
  marketplaceKinds: ["ignored"],
});
equal(calls.findLast(([name]) => name === "sendAppServerRequest"), [
  "sendAppServerRequest",
  "plugin/installed",
  {},
]);
equal(
  await new adapters.PluginMarketplaceListingService(createAppServer({ fail: true })).list({
    buildFlavor: "prod",
    cwds: [],
    hiddenMarketplaceNames: [],
  }),
  { groups: [] },
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createWindowRpcServiceAdapters({"), true);
equal(main.includes("var Y$e = class"), false);
equal(main.includes("var u1e = class"), false);
equal(main.includes("y6e = class"), false);
equal(main.includes("var T6e = class"), false);
equal(windowContext.includes("new HotkeyWindowService("), true);
equal(windowContext.includes("new LocalEnvironmentsService("), true);
equal(windowContext.includes("new PluginMarketplaceListingService("), true);

console.log(`${assertions} main window RPC service-adapter assertions passed`);
