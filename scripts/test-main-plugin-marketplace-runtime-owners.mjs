import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path, { join } from "node:path";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const sourceFunction = async (source, name) => {
  const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
  const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
  const declaration = ast.body.find(
    (node) => node.type === "FunctionDeclaration" && node.id?.name === name,
  );
  assert.ok(declaration, `missing ${name}`);
  assertions += 1;
  return transpiled.code.slice(declaration.start, declaration.end);
};

const marketplaceSource = fs.readFileSync(
  new URL("../src/main/main-app/plugins/marketplace.ts", import.meta.url),
  "utf8",
);
const selectSource = await sourceFunction(marketplaceSource, "selectBundledMarketplaces");
const findSource = await sourceFunction(marketplaceSource, "findBundledPlugin");
const { selectBundledMarketplaces, findBundledPlugin } = Function(
  `const DEFAULT_MARKETPLACE_NAME = "openai-bundled";
   ${selectSource}
   ${findSource}
   return { selectBundledMarketplaces, findBundledPlugin };`,
)();
const marketplaces = [
  { name: "custom", path: "/custom", plugins: [{ name: "chrome", installed: true }] },
  { name: "openai-bundled", path: "/default", plugins: [{ name: "computer-use" }] },
  { name: "ignored", path: "/ignored", plugins: [{ name: "chrome" }] },
];
equal(selectBundledMarketplaces({ marketplaceName: "custom", marketplaces }).map((item) => item.name), [
  "custom",
  "openai-bundled",
]);
equal(findBundledPlugin({ marketplaceName: "custom", marketplaces, pluginName: "computer-use" }), {
  marketplace: marketplaces[1],
  plugin: marketplaces[1].plugins[0],
});

const chromeSource = fs.readFileSync(
  new URL("../src/main/main-app/plugins/chrome-native-host-sync.ts", import.meta.url),
  "utf8",
);
const redactSource = await sourceFunction(chromeSource, "redactBundledPluginSourcePath");
const reasonSource = await sourceFunction(chromeSource, "computePluginInstallReason");
const resourcesSource = await sourceFunction(chromeSource, "requireResourcesPathForChromeSync");
const chromeHelpers = Function(
  `${redactSource}
   ${reasonSource}
   ${resourcesSource}
   return { redactBundledPluginSourcePath, computePluginInstallReason, requireResourcesPathForChromeSync };`,
)();
equal(chromeHelpers.redactBundledPluginSourcePath("plugins/chrome"), {
  bundledPluginSourcePath: "plugins/chrome",
  bundledPluginSourcePathKind: "relative",
});
equal(chromeHelpers.redactBundledPluginSourcePath("../private/chrome"), {
  bundledPluginSourcePathKind: "redacted",
});
equal(
  chromeHelpers.computePluginInstallReason({
    forceInstall: false,
    installWhenMissing: true,
    installedPluginStatus: "missing",
  }),
  "missing",
);
equal(
  chromeHelpers.computePluginInstallReason({
    forceInstall: false,
    installWhenMissing: false,
    installedPluginStatus: "missing",
  }),
  null,
);
assert.throws(
  () => chromeHelpers.requireResourcesPathForChromeSync(undefined, "chrome"),
  /Missing resourcesPath/,
);
assertions += 1;

const cuaSource = fs.readFileSync(
  new URL("../src/main/main-app/plugins/cua-repl-config.ts", import.meta.url),
  "utf8",
);
const cuaTranspiled = await transform(cuaSource, { loader: "ts", format: "cjs", target: "es2022" });
const nodeRequire = createRequire(import.meta.url);
const cuaModule = { exports: {} };
const schema = { parse: (input) => input };
Function("require", "module", "exports", cuaTranspiled.code)(
  (specifier) => {
    if (specifier.startsWith("node:")) return nodeRequire(specifier);
    if (specifier === "@chunk/shared")
      return {
        $l: "CODEX_PLUGIN_SERVICES",
        Bo: ({ codexHome }) => join(codexHome, "cache", "cua-repl"),
        Jl: "NODE_REPL_COMMAND",
        Kl: "computer-use",
        ql: "NODE_REPL_MODULE_DIR",
        Rl: "cua-repl",
        xf: () => schema,
      };
    if (specifier === "../browser-use/rpc-client")
      return { BROWSER_USE_AVAILABLE_BACKENDS: "BROWSER_USE_AVAILABLE_BACKENDS" };
    if (specifier === "./marketplace") return { findBundledPlugin };
    if (specifier === "../browser-use/thread-config")
      return {
        NODE_REPL_INSTRUCTIONS_USE_CASE_BROWSER: "USE_BROWSER",
        NODE_REPL_INSTRUCTIONS_USE_CASE_CHROME: "USE_CHROME",
      };
    if (specifier === "../computer-use/app-resolution")
      return { NODE_REPL_INSTRUCTIONS_USE_CASE_COMPUTER_USE: "USE_COMPUTER" };
    throw new Error(`unexpected require ${specifier}`);
  },
  cuaModule,
  cuaModule.exports,
);

const directory = await mkdtemp(join(tmpdir(), "codex-plugin-runtime-"));
try {
  const configDirectory = join(directory, "cache", "cua-repl");
  const configPath = join(configDirectory, ".mcp.json");
  await mkdir(configDirectory, { recursive: true });
  await writeFile(configPath, '{"mcpServers":{"cua_repl":{}}}\n');
  equal(
    await cuaModule.exports.syncCuaReplMcpConfig({
      browserBackends: ["native_pipe", "chrome"],
      codexHome: directory,
      marketplaceName: "custom",
      marketplaces: [
        {
          name: "custom",
          path: "/custom",
          plugins: [{ name: "cua-repl", installed: true, localVersion: "1" }],
        },
      ],
      nodeRepl: {
        command: "node-repl",
        env: { NODE_REPL_COMMAND: "node", NODE_REPL_MODULE_DIR: "/modules" },
        env_vars: ["TOKEN"],
      },
      surfaces: ["browser", "computer"],
    }),
    true,
  );
  const written = JSON.parse(await readFile(configPath, "utf8")).mcpServers.cua_repl;
  equal(written.enabled, true);
  equal(written.command, "node");
  equal(written.args, [path.join("/modules", "@oai/cua-repl/bin/cua-repl.mjs")]);
  equal(written.env.CUA_REPL_ENABLED_SURFACES, "browser,computer");
  equal(written.env.BROWSER_USE_AVAILABLE_BACKENDS, "native_pipe,chrome");
  equal(JSON.parse(written.env.CODEX_PLUGIN_SERVICES), {
    browser: "@oai/browser-desktop/service",
    sky: "@oai/sky/service",
  });
  equal(written.env.USE_BROWSER, undefined);
  const surfaceEnv = { env: {} };
  cuaModule.exports.applyCuaReplSurfaceEnv(surfaceEnv, ["browser", "computer"]);
  equal(surfaceEnv.env, { USE_BROWSER: "", USE_CHROME: "", USE_COMPUTER: "" });
} finally {
  await rm(directory, { force: true, recursive: true });
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
for (const owner of [
  "plugins/marketplace.js",
  "plugins/chrome-native-host-sync.js",
  "plugins/cua-repl-config.js",
  "computer-use/app-resolution.js",
]) equal(main.includes(`main-app/${owner}`), true);
for (const definition of [
  "var wa = [`plugins`]",
  "async function Fa(",
  "async function sre(",
  "function no(",
  "async function wo(",
  "function ki(",
  "function Ai(",
  "async function Sne(",
]) equal(main.includes(definition), false);
equal(main.includes("reconcileBundledPluginsMarketplace: Fa"), true);
equal(main.includes("syncCuaSkillsForPlugins: wo"), true);
equal(main.includes("syncCuaReplMcpConfig: Sne"), true);
equal(main.includes("await Fa({"), true);
equal(main.includes("await wo({"), true);

console.log(`${assertions} main plugin marketplace runtime owner assertions passed`);
