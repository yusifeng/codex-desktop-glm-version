import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/plugins/orchestrator.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const nodeRequire = createRequire(import.meta.url);
const calls = [];
const descriptors = [
  { name: "codex-app-tools", syncToRemoteSshHosts: false, isAvailable: () => true },
  { name: "chrome", syncToRemoteSshHosts: true, isAvailable: () => true },
];
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier.startsWith("node:")) return nodeRequire(specifier);
    if (specifier === "@chunk/shared")
      return {
        Al: "chrome-internal",
        Fl: "computer-use",
        jl: "chrome-dev",
        kl: "browser",
        Ml: "chrome",
        Nl: "codex-app-tools",
        Pl: "computer-history",
        Ul: () => "openai-bundled",
        zl: "user-writing",
      };
    if (specifier === "@chunk/bootstrap")
      return {
        in: {
          Agent: "agent",
          Dev: "dev",
          InternalAlpha: "internal-alpha",
          Nightly: "nightly",
          Prod: "prod",
          PublicBeta: "public-beta",
        },
        R: "electron-chrome-extension-sync-managed-plugin-ids",
      };
    if (specifier === "@chunk/logger")
      return { memoizedTaggedLogger: () => () => ({ info() {}, warning() {} }) };
    if (specifier === "./marketplace")
      return {
        BUNDLED_PLUGIN_DESCRIPTORS: descriptors,
        LOCAL_MARKETPLACE_LIST_FILTER: { marketplaceKinds: ["local"] },
        findBundledPlugin: ({ marketplaces, pluginName }) => {
          for (const marketplace of marketplaces) {
            const plugin = marketplace.plugins.find((candidate) => candidate.name === pluginName);
            if (plugin) return { marketplace, plugin };
          }
          return null;
        },
        readChromeExtensionSyncState: async () => [],
        reconcileBundledPluginsMarketplace: async (options) => calls.push(["reconcile", options]),
        serializeChromeExtensionSyncState: async () => "[]",
        syncMarketplaceToRemoteHost: async () => true,
      };
    if (specifier === "./chrome-native-host-sync")
      return { removeStaleBundledMarketplaces: async () => {} };
    if (specifier === "./browser-runtime-resolution")
      return {
        getBundledPluginsResourcesPath: () => "/resources",
        getForcedReloadPluginNames: () => new Set(),
        getRuntimeMarketplaceRoot: () => "/runtime-marketplace",
      };
    if (specifier === "../browser-use/thread-config")
      return {
        registerPendingReconcile: (_connection, promise) => calls.push(["pending", promise]),
        syncBrowserUseThreadConfig: async () => calls.push(["browser-config"]),
      };
    if (specifier === "../misc/availability")
      return {
        DEFAULT_DESKTOP_FEATURE_AVAILABILITY: {},
        isValidDesktopFeatureAvailability: () => true,
      };
    if (specifier === "../computer-use/codex-app-tools-config")
      return { syncCodexAppToolsMcpConfig: async () => calls.push(["app-tools-config"]) };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);

const connection = {
  listPlugins: async () => ({ marketplaces: [] }),
};
const state = new Map();
const orchestrator = module.exports.createBundledPluginsOrchestrator({
  appVersion: "1.2.3",
  buildFlavor: "dev",
  codexHome: "/codex",
  env: {},
  getLocalAppServerConnection: () => connection,
  globalState: {
    get: (key) => state.get(key),
    set: (key, value) => state.set(key, value),
  },
  trashItem: async () => {},
});
const availability = {
  browserUseTinysky: false,
  computerUse: true,
  externalBrowserUse: false,
  inAppBrowserUse: true,
};
await orchestrator.setDesktopFeatureAvailability(availability);
await orchestrator.setDesktopFeatureAvailability({ ...availability });
await orchestrator.waitForPendingReconcile();
equal(calls.filter(([kind]) => kind === "reconcile").length, 1);
equal(calls.filter(([kind]) => kind === "pending").length, 1);
equal(calls.filter(([kind]) => kind === "app-tools-config").length, 1);
equal(calls.filter(([kind]) => kind === "browser-config").length, 1);
equal(calls.find(([kind]) => kind === "reconcile")[1].marketplacePluginNames, [
  "codex-app-tools",
  "chrome",
]);

const observed = await module.exports.listObservedPluginStates({
  appServerConnection: {
    listPlugins: async () => ({
      marketplaces: [
        {
          name: "openai-bundled",
          path: "/marketplace",
          plugins: [{ name: "chrome", installed: true }],
        },
      ],
    }),
  },
  marketplaceName: "openai-bundled",
});
equal(observed.get("chrome"), { name: "chrome", installed: true });

const directory = await mkdtemp(join(tmpdir(), "codex-chronicle-archive-"));
try {
  const skillDirectory = join(directory, "skills", "chronicle");
  const markerPath = join(directory, ".codex-chronicle-assets-to-install.marker");
  await mkdir(skillDirectory, { recursive: true });
  await writeFile(join(skillDirectory, "SKILL.md"), "chronicle\n");
  await writeFile(markerPath, "install-assets\n");
  const archived = await module.exports.archiveLegacyChronicleSkill({
    codexHome: directory,
    reason: "test-migration",
  });
  equal(archived != null, true);
  equal(fs.existsSync(skillDirectory), false);
  equal(fs.existsSync(markerPath), false);
  equal(await readFile(join(archived.archivePath, "skill", "SKILL.md"), "utf8"), "chronicle\n");
  equal(await readFile(join(archived.archivePath, "marker"), "utf8"), "install-assets\n");
  const metadata = JSON.parse(await readFile(join(archived.archivePath, "metadata.json"), "utf8"));
  equal(metadata.migrationReason, "test-migration");
  equal(metadata.markerExisted, true);
  equal(typeof metadata.contentHash, "string");
  equal(metadata.contentHash.length, 64);
  equal(
    await module.exports.archiveLegacyChronicleSkill({ codexHome: directory, reason: "second" }),
    null,
  );
} finally {
  await rm(directory, { force: true, recursive: true });
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/plugins/orchestrator.js")'), true);
equal(main.includes("createBundledPluginsOrchestrator: ioe"), true);
equal(main.includes("createChromeNativeHostCacheWatcher: aoe"), true);
equal(main.includes("archiveLegacyChronicleSkill: loe"), true);
equal(main.includes("var al = ["), false);
equal(main.includes("function ioe("), false);
equal(main.includes("function aoe("), false);
equal(main.includes("async function loe("), false);
equal(main.includes("let Xe = ioe({"), true);
equal(main.includes("let Ye = aoe({"), true);

console.log(`${assertions} main plugin orchestrator owner assertions passed`);
