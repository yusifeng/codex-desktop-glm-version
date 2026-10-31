import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const declarationSource = async (source, name) => {
  const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
  const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
  const declaration = ast.body.find(
    (node) =>
      (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") &&
      node.id?.name === name,
  );
  assert.ok(declaration, `missing ${name}`);
  assertions += 1;
  return transpiled.code.slice(declaration.start, declaration.end);
};

const nativePipeSource = fs.readFileSync(
  new URL("../src/main/main-app/computer-use/native-pipe-service.ts", import.meta.url),
  "utf8",
);
const clientSource = await declarationSource(nativePipeSource, "createComputerUseNativePipeClient");
const createComputerUseNativePipeClient = Function(
  `let activeComputerUseNativePipeClient = null;
   const pipeClientLogger = () => ({ info() {}, warning() {} });
   ${clientSource}
   return createComputerUseNativePipeClient;`,
)();
let serverStarts = 0;
const client = createComputerUseNativePipeClient({
  codexHome: "/codex",
  codexCliPath: "/codex-cli",
  ensureNotifyConfig: async () => ({ status: "installed" }),
  platform: "linux",
  resourcesPath: "/resources",
  startServer: async () => {
    serverStarts += 1;
    throw new Error("linux must not start a Windows helper");
  },
});
equal(await client.ensureReadyPipePath(), null);
equal(client.hasActiveTurn({ sessionId: "session", turnId: "turn" }), false);
equal(await client.closeActiveTurn({ sessionId: "session", turnId: "turn" }), false);
client.setDesktopFeatureAvailability({ computerUse: true });
await Promise.resolve();
equal(serverStarts, 0);
client.dispose();

const threadConfigSource = fs.readFileSync(
  new URL("../src/main/main-app/browser-use/thread-config.ts", import.meta.url),
  "utf8",
);
const syncerSource = await declarationSource(threadConfigSource, "BrowserUsePluginConfigSyncer");
const syncCalls = [];
const BrowserUsePluginConfigSyncer = Function(
  "syncCalls",
  `class SharedEventEmitter {}
   const getDesktopFeatureAvailability = () => ({ browserUseTinysky: true });
   const syncBrowserUseThreadConfig = async (options) => syncCalls.push(options);
   ${syncerSource}
   return BrowserUsePluginConfigSyncer;`,
)(syncCalls);
const syncer = new BrowserUsePluginConfigSyncer({ appServerConnection: "connection", reloadUserConfig: true });
await syncer.syncAfterPluginChange();
equal(syncCalls, [{ appServerConnection: "connection", reloadUserConfig: false }]);

const automationSource = fs.readFileSync(
  new URL("../src/main/main-app/misc/automation-thread-config.ts", import.meta.url),
  "utf8",
);
const buildOverridesSource = await declarationSource(
  automationSource,
  "buildThreadStartConfigOverrides",
);
const surfaceCalls = [];
const buildThreadStartConfigOverrides = Function(
  "waitForPendingReconcile",
  "getDesktopFeatureAvailability",
  "computeBrowserUseSelection",
  "computeBrowserUseThreadConfig",
  "CUA_REPL_DISABLED_MCP_SERVER_ENTRY",
  "applyCuaReplSurfaceEnv",
  `${buildOverridesSource}; return buildThreadStartConfigOverrides;`,
)(
  async () => ({
    cuaReplEnabled: true,
    selection: { cuaReplSurfaces: ["browser"], source: "reconciled" },
  }),
  () => ({ browserUseTinysky: true }),
  async () => {
    throw new Error("reconciled selection should be reused");
  },
  async ({ selection }) => ({
    "mcp_servers.node_repl": { env: {} },
    selectionSource: selection.source,
  }),
  { "mcp_servers.cua_repl": { enabled: false } },
  (config, surfaces) => surfaceCalls.push([config, surfaces]),
);
const overrides = await buildThreadStartConfigOverrides({
  appServerConnection: { hostConfig: { kind: "local" } },
});
equal(overrides.selectionSource, "reconciled");
equal(surfaceCalls.length, 1);
equal(surfaceCalls[0][1], ["browser"]);

const codexToolsSource = fs.readFileSync(
  new URL("../src/main/main-app/computer-use/codex-app-tools-config.ts", import.meta.url),
  "utf8",
);
const enabledOverrideSource = await declarationSource(
  codexToolsSource,
  "resolveCodexAppEnabledOverride",
);
const resolveCodexAppEnabledOverride = Function(
  "resolveCodexAppServer",
  `${enabledOverrideSource}; return resolveCodexAppEnabledOverride;`,
)(async () => ({ command: "node" }));
equal(
  await resolveCodexAppEnabledOverride({ hostConfig: { kind: "local" }, resourcesPath: "/resources" }),
  ["plugins.codex-app-tools@openai-bundled.mcp_servers.codex_app.enabled=true"],
);
equal(
  await resolveCodexAppEnabledOverride({ hostConfig: { kind: "ssh" }, resourcesPath: "/resources" }),
  [],
);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
for (const owner of [
  "computer-use/native-pipe-service.js",
  "browser-use/thread-config.js",
  "misc/automation-thread-config.js",
  "misc/codex-app-tools-config.js",
  "computer-use/codex-app-tools-config.js",
]) equal(main.includes(`main-app/${owner}`), true);
for (const definition of [
  "var To =",
  "function Oo(",
  "function pie(",
  "var Go =",
  "var wie =",
  "var as =",
  "async function Xie(",
  "async function $o(",
]) equal(main.includes(definition), false);
equal(main.includes("createComputerUseNativePipeClient: pie"), true);
equal(main.includes("BrowserUsePluginConfigSyncer: wie"), true);
equal(main.includes("buildThreadStartConfigOverrides: $o"), true);
equal(main.includes("resolveCodexAppMcpOverrides: os"), true);
equal(main.includes("resolveCodexAppEnabledOverride: Xie"), true);
equal(main.includes("computerUseNativePipeClient = pie({"), true);
equal(main.includes("hasActiveComputerUseTurn: computerUseNativePipeClient.hasActiveTurn"), true);
equal(main.includes("Ee = (e) => !1"), false);

console.log(`${assertions} main computer-use runtime chain owner assertions passed`);
