import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import * as esbuild from "esbuild";

const map = JSON.parse(await fs.readFile(new URL("../docs/shared-export-map.json", import.meta.url), "utf8"));
const declarations = await fs.readFile(new URL("../src/main/types/chunk-modules.d.ts", import.meta.url), "utf8");

const expectedOwners = {
  Ls: ["iT", 20047, "hosts-runtime", "FILE_CONTENT_SNIFF_BYTES"],
  Uc: ["hS", 18511, "browser-tab-mentions", "browserTabMentionSchema"],
  at: ["Sie", 59531, "structured-generation", "EPHEMERAL_GENERATION_TIMEOUT_MS"],
  co: ["nk", 21969, "app-constants", "HOTKEY_WINDOW_ROUTE"],
  it: ["bie", 59524, "structured-generation", "EPHEMERAL_THREAD_TIMEOUT_MS"],
  ot: ["H8", 59528, "structured-generation", "PULL_REQUEST_GENERATION_TIMEOUT_MS"],
  rl: ["vx", 18065, "app-constants", "BROWSER_APP_PARTITION"],
  yu: ["Hy", 17465, "browser-context", "MAX_ANNOTATION_SELECTION_RECTS"],
  Ed: ["j_", 16535, "sandbox-permissions", "permissionProfileSchema"],
  kl: ["Db", 17860, "app-constants", "BROWSER_PLUGIN_NAME"],
  pu: ["$y", 17584, "hosts-runtime", "MAX_DIRECT_TRANSFER_BYTES"],
  sr: ["FW", 35990, "elicitation-protocol", "parseElicitationUrl"],
  Jc: ["oS", 18467, "browser-tab-mentions", "parseFaviconDataUrl"],
  qc: ["sS", 18477, "browser-tab-mentions", "matchesBrowserTabQuery"],
  lu: ["tb", 17588, "browser-tab-mentions", "BROWSER_TAB_TYPES"],
  wc: ["bC", 19262, "app-config", "DYNAMIC_TOOL_NAMESPACES"],
  Oc: ["TC", 19275, "app-config", "serializeDynamicTools"],
  ic: ["Aw", 19874, "app-config", "versionedFeatureOverrides"],
  nc: ["jw", 19906, "app-config", "applyFeatureOverrides"],
  Wa: ["PA", 22408, "hosts-runtime", "resolveModelServiceTier"],
  Yo: ["$E", 20860, "hosts-runtime", "buildBaseThreadConfig"],
  Za: ["rA", 22261, "hosts-runtime", "isPathWithinWorktrees"],
  wa: ["Rne", 23158, "hosts-runtime", "prependThreadToProject"],
  cr: ["EW", 35938, "elicitation-protocol", "sameConnectorAuth"],
  ur: ["cW", 35683, "elicitation-protocol", "isElicitationApprovalSafe"],
};

for (const [exportName, [internal, line, owner, symbol]] of Object.entries(expectedOwners)) {
  assert.equal(map[exportName].internal, internal, `${exportName} preserves the original internal symbol`);
  assert.equal(map[exportName].line, line, `${exportName} records the original source line`);
  assert.notEqual(map[exportName].zone, "unlocated", `${exportName} records a source zone`);
  assert.match(declarations, new RegExp(`export \\{ ${symbol} as ${exportName} \\} from "\\.\\.\\/\\.\\.\\/shared\\/${owner}"`));
}

const incomplete = Object.entries(map).filter(([, entry]) =>
  !Number.isInteger(entry.line) || entry.line <= 0 || entry.zone === "unlocated" || !entry.zone || !entry.signature
);
assert.deepEqual(incomplete, [], "every shared export has line, zone, and signature evidence");

async function loadSharedModule(name) {
  const result = await esbuild.build({
    bundle: true,
    entryPoints: [path.resolve(new URL("../src/main/shared/", import.meta.url).pathname, `${name}.ts`)],
    format: "esm",
    logLevel: "silent",
    platform: "node",
    plugins: [{
      name: "shared-test-stubs",
      setup(build) {
        build.onResolve({ filter: /^@chunk\/logger$/ }, () => ({ path: "logger", namespace: "shared-test-stub" }));
        build.onLoad({ filter: /.*/, namespace: "shared-test-stub" }, () => ({
          contents: "export const memoizedTaggedLogger = () => ({ debug() {}, error() {}, info() {}, warning() {} });",
          loader: "js",
        }));
      },
    }],
    target: "node22",
    write: false,
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

const browser = await loadSharedModule("browser-tab-mentions");
assert.equal(browser.parseFaviconDataUrl("data:image/png;base64,AAAA"), "data:image/png;base64,AAAA");
assert.equal(browser.parseFaviconDataUrl("https://example.com/icon.png"), null);
assert.equal(browser.matchesBrowserTabQuery({ title: "OpenAI Docs", url: "https://example.com/api" }, "docs API"), true);
assert.equal(browser.BROWSER_TAB_TYPES.NEW_TAB_PAGE, "new-tab-page");

const config = await loadSharedModule("app-config");
assert.deepEqual(config.serializeDynamicTools([
  { type: "function", name: "create_thread" },
  { type: "function", name: "keep" },
  { type: "namespace", name: "codex_app", tools: [{ name: "handoff_thread" }, { name: "keep_nested" }] },
]), [
  { type: "function", name: "keep" },
  { type: "namespace", name: "codex_app", tools: [{ name: "keep_nested" }] },
]);
assert.deepEqual(config.applyFeatureOverrides({ config: { "features.kept": false } }, { kept: true, new_flag: true }), {
  config: { "features.kept": false, "features.new_flag": true },
});
assert.deepEqual(config.DYNAMIC_TOOL_NAMESPACES, ["codex_app", "openai_settings", "plugin_management"]);

const hosts = await loadSharedModule("hosts-runtime");
assert.equal(hosts.resolveModelServiceTier(null, "default"), null);
assert.equal(hosts.isPathWithinWorktrees({ cwd: "/repo/worktrees/a", worktreesRoot: "/repo/worktrees" }), true);
assert.deepEqual(hosts.prependThreadToProject({ p: { threadIds: ["old", "new"] } }, "p", "new"), { p: { threadIds: ["new", "old"] } });
assert.deepEqual(await hosts.buildBaseThreadConfig("model", "fast", null, "/repo", null, null), {
  cwd: "/repo", model: "model", modelProvider: null, serviceTier: "fast", config: {},
});

const elicitation = await loadSharedModule("elicitation-protocol");
assert.equal(elicitation.sameConnectorAuth(
  { connector_id: "c", link_id: "l", auth_reason: "r", requested_scopes: ["b", "a"] },
  { connector_id: "c", link_id: "l", auth_reason: "r", requested_scopes: ["a", "b"] },
), true);
assert.equal(elicitation.isElicitationApprovalSafe({ mode: "url" }, {}), true);
assert.equal(elicitation.isElicitationApprovalSafe({
  mode: "form",
  serverName: "codex_apps",
  _meta: { codex_approval_kind: "mcp_tool_call", tool_name: "sites.execute_database_update", tool_params: {} },
}, {}), false);

console.log(`${Object.keys(expectedOwners).length * 4 + 15} shared export evidence and runtime assertions passed; 0 unlocated or consumed-unsemantic exports`);
