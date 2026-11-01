import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/plugins/chrome-native-host-service.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "esm", target: "node22" });
const runtime = await import(`data:text/javascript;base64,${Buffer.from(output.code).toString("base64")}`);

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

equal(runtime.parseChromeNativeHostInstallRequest(null), null);
equal(runtime.parseChromeNativeHostInstallRequest({ hostId: " ", marketplacePath: null, pluginName: "plugin" }), null);
equal(runtime.parseChromeNativeHostInstallRequest({ hostId: " host ", marketplacePath: undefined, pluginName: "plugin" }), null);
equal(runtime.parseChromeNativeHostInstallRequest({ hostId: " host ", marketplacePath: null, pluginName: " plugin " }), {
  hostId: "host",
  marketplacePath: null,
  pluginName: "plugin",
});
equal(runtime.parseChromeNativeHostUninstallRequest({ hostId: "host", marketplaceName: " ", pluginName: "plugin" }), null);
equal(runtime.parseChromeNativeHostUninstallRequest({ hostId: " host ", marketplaceName: " market ", pluginName: " plugin " }), {
  hostId: "host",
  marketplaceName: "market",
  pluginName: "plugin",
});

class RpcHandlerBase {}
const calls = [];
let resourcesPath = "/resources";
const localHost = { hostConfig: { type: "local" }, codexHome: async () => "/codex" };
const remoteHost = { hostConfig: { type: "remote" }, codexHome: async () => "/remote" };
let hosts = { local: localHost, remote: remoteHost };
const ChromeNativeHostService = runtime.createChromeNativeHostServiceClass({
  RpcHandlerBase,
  resolveResourcesPath: (options) => { calls.push(["resolve", options]); return resourcesPath; },
  reconcileChromeNativeHost: async (options) => { calls.push(["install", options]); },
  uninstallChromePluginRuntime: async (options) => { calls.push(["uninstall", options]); },
  env: { APP_ENV: "test" },
  resourcesPath: "/electron-resources",
  isRemoteHostConfig: (config) => config.type === "remote",
});
const service = new ChromeNativeHostService({ getMaybe: (id) => hosts[id] }, "/repo");

await service.install({ hostId: "local", marketplacePath: "/market", pluginName: "plugin" });
equal(calls[0], ["resolve", { env: { APP_ENV: "test" }, resourcesPath: "/electron-resources" }]);
equal(calls[1], ["install", {
  codexHome: "/codex",
  devRuntimeRepoRoot: "/repo",
  marketplacePath: "/market",
  pluginName: "plugin",
  resourcesPath: "/resources",
}]);
await service.uninstall({ hostId: "local", marketplaceName: "market", pluginName: "plugin" });
equal(calls[2], ["uninstall", { codexHome: "/codex", marketplaceName: "market", pluginName: "plugin" }]);
const callCount = calls.length;
await service.install({ hostId: "missing", marketplacePath: null, pluginName: "plugin" });
await service.install({ hostId: "remote", marketplacePath: null, pluginName: "plugin" });
await service.uninstall({ hostId: "remote", marketplaceName: "market", pluginName: "plugin" });
equal(calls.length, callCount, "missing and remote hosts must not resolve resources or mutate plugins");
resourcesPath = null;
await assert.rejects(
  service.install({ hostId: "local", marketplacePath: null, pluginName: "plugin" }),
  /resource sync requires resourcesPath/,
);
assertions += 1;
await assert.rejects(service.install({ hostId: "local", marketplacePath: null, pluginName: " " }), /Invalid Chrome native host install request/);
assertions += 1;
await assert.rejects(service.uninstall({ hostId: "local", marketplaceName: null, pluginName: "plugin" }), /Invalid Chrome native host uninstall request/);
assertions += 1;

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/plugins/chrome-native-host-service.js")'), true);
equal(main.includes("OAe = createChromeNativeHostServiceClass({"), true);
equal(windowContext.includes("chromeNativeHost: new OAe("), true);
equal(/^var OAe = class/m.test(main), false);
for (const generatedName of ["kAe", "AAe"]) {
  equal(new RegExp(`^function ${generatedName}\\(`, "m").test(main), false);
}

console.log(`${assertions} main Chrome native host service assertions passed`);
