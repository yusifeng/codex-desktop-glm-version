import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { transform } from "esbuild";

const require = createRequire(import.meta.url);

let assertions = 0;
const equal = (actual, expected, message) => {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
};

async function load(relativePath, requireStub = (specifier) => require(specifier)) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const module = { exports: {} };
  Function("require", "module", "exports", output.code)(requireStub, module, module.exports);
  return module.exports;
}

let wslDistro = null;
const resolutions = [];
const runtimePathsModule = await load("../src/main/main-app/artifact-session/runtime-paths.ts", (specifier) => {
  if (specifier === "@chunk/electron-resources-path") {
    return { resolveElectronResourcesPath: () => "/resources" };
  }
  if (specifier === "@chunk/shared") {
    return {
      Ni: () => wslDistro,
      In: () => "/bundled/codex",
      Ln: () => "/bundled/node",
      Mn: (root) => `${root}/node_modules`,
      On: () => "/primary/bin/runtime",
      Rn: () => "/bundled/repl",
      Vn: (value) => resolutions.push(value),
    };
  }
  return require(specifier);
});
const threadConfigModule = await load("../src/main/main-app/artifact-session/thread-config.ts");
const availabilityModule = await load("../src/main/main-app/browser-use/desktop-feature-availability.ts");

equal(runtimePathsModule.resolveRuntimePaths({
  env: {
    CODEX_CLI_PATH: " /override/codex ",
    CODEX_BROWSER_USE_NODE_PATH: "/override/node",
    CODEX_NODE_REPL_PATH: "/override/repl",
  },
  platform: "linux",
  resourcesPath: "/r",
}), {
  codexCliPath: "/override/codex",
  codexCliPathSource: "env-override",
  nodeModuleDirs: "/r/node_modules",
  nodePath: "/override/node",
  nodePathSource: "env-override",
  nodeReplPath: "/override/repl",
  nodeReplPathSource: "env-override",
  platform: "linux",
});

const relocated = runtimePathsModule.resolveRuntimePaths({
  env: { CODEX_CLI_PATH: "C:/Program Files/WindowsApps/pkg/codex.exe" },
  platform: "win32",
  resourcesPath: "C:/resources",
  resolveCodexPath: (root) => root.includes("WindowsApps") ? "C:/relocated/codex.exe" : null,
  resolveNodePath: () => null,
  resolveNodeReplPath: () => null,
  resolvePrimaryRuntimeNodePath: () => "C:/primary/node.exe",
});
equal(relocated.codexCliPath, "C:/relocated/codex.exe");
equal(relocated.codexCliPathSource, "env-override-relocated");
equal(relocated.nodePath, "C:/primary/node.exe");
equal(relocated.nodePathSource, "primary-runtime");
equal(resolutions.map(({ component, source }) => [component, source]), [
  ["codex", "override"],
  ["node", "primary-runtime"],
  ["node-repl", undefined],
]);

wslDistro = "Ubuntu";
const wsl = runtimePathsModule.resolveRuntimePaths({
  env: {},
  platform: "win32",
  resourcesPath: "C:/resources",
  resolveCodexPath: () => null,
  resolveNodePath: () => null,
  resolveNodeReplPath: () => null,
  resolvePrimaryRuntimeNodePath: () => "must-not-be-used",
});
equal(wsl.nodePath, null, "WSL skips primary Windows runtime fallback");
wslDistro = null;

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "artifact-runtime-paths-"));
const devCodex = path.join(temporaryRoot, "extension", "bin", "codex");
fs.mkdirSync(path.dirname(devCodex), { recursive: true });
fs.writeFileSync(devCodex, "#!/bin/sh\n");
fs.chmodSync(devCodex, 0o755);
const dev = runtimePathsModule.resolveRuntimePaths({
  env: {},
  isPackaged: false,
  platform: "linux",
  repoRoot: temporaryRoot,
  resourcesPath: "/r",
  resolveCodexPath: () => null,
  resolveNodePath: () => null,
  resolveNodeReplPath: () => null,
  resolvePrimaryRuntimeNodePath: () => null,
});
equal(dev.codexCliPath, devCodex);
equal(dev.codexCliPathSource, "bundled-or-dev");
fs.rmSync(temporaryRoot, { recursive: true, force: true });

const logs = [];
const buildInputs = [];
let localStdio = true;
let eligibleSource = true;
const dependencies = {
  logger: {
    info: (...args) => logs.push(["info", ...args]),
    warning: (...args) => logs.push(["warning", ...args]),
  },
  resolveRuntimePaths: () => ({ codexCliPath: "/codex", nodeReplPath: "/repl", platform: "darwin" }),
  buildNodeReplMcpConfig: (input) => {
    buildInputs.push(input);
    return { "mcp_servers.node_repl": { command: "/repl", env: { ORIGINAL: "yes" } } };
  },
  resolveCodexHome: () => "/codex-home",
  resolveRequestMetadata: () => "Dev",
  developmentBuildFlavor: "Dev",
  isInternalBuild: () => true,
  isNodeReplSandboxPlatform: (platform) => platform === "darwin",
  isEligibleThreadSource: () => eligibleSource,
  nodeModulesPathEnvKey: "NODE_MODULES",
  mcpServicesEnvKey: "MCP_SERVICES",
  requestMetaEnvKey: "REQUEST_META",
  nodeReplBannerEnvKey: "BANNER",
  nodeReplToolOverridesEnvKey: "TOOL_OVERRIDES",
  cwd: () => "/repo",
  env: { REQUEST_META: "request-meta", NODE_REPL_TRACE_META: "0" },
};
const runtime = threadConfigModule.createArtifactSessionThreadConfigRuntime(dependencies);
const lifecycle = {
  isViewerAvailable: () => true,
  getPrimaryRuntimePaths: () => ({ nodeModulesPath: "/primary/modules", nodePath: "/primary/node" }),
  getTrustedServiceEnv: () => ({ TRUSTED: "yes", ORIGINAL: "trusted" }),
};

equal(runtime.createExpectedArtifactSessionThreadConfig({ enabled: false, hostLifecycle: lifecycle, shouldUseWslPaths: false }), null);
equal(runtime.createExpectedArtifactSessionThreadConfig({ enabled: true, hostLifecycle: lifecycle, shouldUseWslPaths: true }), null);
equal(logs.at(-1)[0], "info");
equal(runtime.createExpectedArtifactSessionThreadConfig({
  enabled: true,
  hostLifecycle: lifecycle,
  shouldUseWslPaths: false,
  runtimePaths: { codexCliPath: null, nodeReplPath: "/repl", platform: "darwin" },
}), null);
equal(logs.at(-1)[0], "warning");

const expectedConfig = runtime.createExpectedArtifactSessionThreadConfig({
  enabled: true,
  hostLifecycle: lifecycle,
  shouldUseWslPaths: false,
});
equal(expectedConfig, {
  "mcp_servers.artifact_session": { command: "/repl", env: { ORIGINAL: "yes" } },
});
equal(buildInputs.at(-1).codexCliPath, "/codex");
equal(buildInputs.at(-1).nodeModuleDirs, "/primary/modules");
equal(buildInputs.at(-1).requestMeta, "request-meta");
equal(buildInputs.at(-1).traceMeta, true);
equal(buildInputs.at(-1).extraEnv.NODE_MODULES, "/primary/modules");
equal(JSON.parse(buildInputs.at(-1).extraEnv.MCP_SERVICES), {
  artifact_session: "@oai/artifact-tool/artifact-session/service",
});
equal(buildInputs.at(-1).extraEnv.BANNER.includes("artifactSession"), true);
equal(JSON.parse(buildInputs.at(-1).extraEnv.TOOL_OVERRIDES).tools.js.description.length > 0, true);

const getExpectedThreadConfig = () => expectedConfig;
const interceptor = runtime.installArtifactSessionThreadConfigInterceptor({
  getHostLifecycle: () => lifecycle,
  getExpectedThreadConfig,
  isLocalStdio: () => localStdio,
});
equal(typeof interceptor, "function");
const baseRequest = {
  id: 1,
  method: "thread/start",
  params: {
    config: {
      mcp_servers: { artifact_session: { stale: true }, other: { keep: true } },
      "mcp_servers.artifact_session.env.OLD": "remove",
      "mcp_servers.artifact_session": { caller: true },
      keep: 1,
    },
  },
};
const applied = interceptor(baseRequest);
equal(applied.params.config, {
  mcp_servers: { other: { keep: true } },
  keep: 1,
  "mcp_servers.artifact_session": {
    command: "/repl",
    env: { ORIGINAL: "trusted", TRUSTED: "yes" },
  },
});
equal(baseRequest.params.config["mcp_servers.artifact_session"], { caller: true }, "input remains immutable");

eligibleSource = false;
const blocked = interceptor({ ...baseRequest, params: { ...baseRequest.params, threadSource: "cloud" } });
equal(blocked.params.config["mcp_servers.artifact_session"], { command: "", enabled: false });
eligibleSource = true;
localStdio = false;
equal(interceptor(baseRequest), baseRequest, "runtime transport change bypasses injection");
equal(runtime.installArtifactSessionThreadConfigInterceptor({
  getHostLifecycle: () => lifecycle,
  getExpectedThreadConfig,
  isLocalStdio: () => false,
}), undefined);

const toggles = [];
const availability = new availabilityModule.BrowserUseDesktopFeatureAvailability({
  setBrowserUseNativePipeEnabled: (enabled) => toggles.push(enabled),
});
availability.setDesktopFeatureAvailability({});
availability.setDesktopFeatureAvailability({ inAppBrowserUse: true });
availability.dispose();
equal(toggles, [true, false]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/artifact-session/runtime-paths.js")'), true);
equal(main.includes('require("./main-app/artifact-session/thread-config.js")'), true);
equal(main.includes('require("./main-app/browser-use/desktop-feature-availability.js")'), true);
equal(main.includes("createArtifactSessionThreadConfigRuntime({"), true);
for (const generatedName of ["fi", "pi", "mi", "tne", "hi", "nne", "vi", "lne", "une", "xi", "Si", "Ci", "dne", "wi", "fne", "Ti", "Ei"]) {
  equal(new RegExp(`^function ${generatedName}\\(`, "m").test(main), false);
}
equal(/^var pne = class/m.test(main), false);

console.log(`${assertions} artifact session thread-config assertions passed`);
