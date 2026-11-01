import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(root, "src/renderer/use-imported-setup-opportunity/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "mock-release-edges",
    setup(build) {
      build.onResolve({ filter: /^@(rchunk|exact-chunk)\// }, ({ path: importPath }) => ({ path: importPath, namespace: "release-edge" }));
      build.onLoad({ filter: /.*/, namespace: "release-edge" }, () => ({ contents: "export {};", loader: "js" }));
    },
  }],
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
const imported = await import(moduleUrl);
let assertions = 0;
const check = (value, message) => { assert.ok(value, message); assertions += 1; };

const intl = { formatMessage: (message, values = {}) => {
  let text = message.defaultMessage;
  for (const [key, value] of Object.entries(values)) text = text.replaceAll(`{${key}}`, String(value));
  return text;
} };

check(imported.ft({ message: "Create an analysis" }, intl) === "Create an analysis", "keeps literal labels");
check(imported.ft({ message: { defaultMessage: "Connect {app}" } }, { formatMessage: (message) => message.defaultMessage }, intl) === "Connect {app}", "formats descriptor labels");

const items = imported.pt({
  items: [
    { id: "create_project", snapshot: { type: "sidebar_project", label: "Make a workspace" } },
    { id: "claude_import" },
    { id: "enable_notifications" },
    { id: "finance_review" },
    { id: "missing" },
  ],
  locale: "en-US",
  taskDefinitions: {
    finance_review: {
      instructions: "Use {finance}",
      is_auto_submit_enabled: true,
      label: { defaultMessage: "Review finances" },
      origin: "remote",
      pluginSlots: { finance: "chatgpt-for-finance" },
      prependPluginMentions: true,
      prompt: "Summarize {finance}",
    },
  },
});
check(items.length === 4, "drops unknown tasks without snapshots");
check(items[0].message === "Make a workspace", "restores stored project label");
check(items[1].action === "import_claude", "projects Claude import action");
check(items[2].action === "enable_notifications", "projects notification action");
check(items[3].action === "start_prompt", "projects prompt action");
check(items[3].isAutoSubmitEnabled === true, "keeps remote auto-submit policy");
check(items[3].pluginMentions[0].pluginId === "chatgpt-for-finance@latest", "normalizes unversioned plugin id");
check(items[3].pluginMentions[0].label === "@ChatGPT Financial Services", "uses product plugin display name");
check(items[3].promptValues.finance === "@ChatGPT Financial Services", "creates prompt substitution values");
check(imported.ht(items[3], intl) === "@ChatGPT Financial Services Summarize @ChatGPT Financial Services", "renders mention-prefixed prompt");
check(imported.ut(items[3]) === "Use @ChatGPT Financial Services", "renders instruction substitutions");
const snapshot = imported.ct(items[3], intl);
check(snapshot.type === "sidebar", "creates sidebar snapshot");
check(snapshot.pluginSlots.finance === "chatgpt-for-finance", "snapshot keeps plugin slot source");
check(snapshot.prompt === "Summarize {finance}", "snapshot keeps portable prompt placeholder");

const histories = [
  { completedAtMs: 90, providerId: "claude-code", successes: [{ itemType: "PLUGINS", source: "github@latest" }] },
  { completedAtMs: 110, providerId: "claude-code", successes: [{ itemType: "MCP_SERVER_CONFIG", title: "GitHub" }, { itemType: "HOOKS" }] },
  { completedAtMs: 120, providerId: "claude-cowork", successes: [{ itemType: "SESSIONS" }] },
];
const state = imported.$({
  appsRequiringConnection: [
    { id: "github", name: "GitHub", pluginDisplayNames: [] },
    { id: "slack", name: "Slack", pluginDisplayNames: [] },
  ],
  connectors: [{ codexAppId: "github", name: "GitHub" }],
  foregroundImport: { providerIds: ["claude-code"], startedAtMs: 100 },
  histories,
  importedPlugins: [
    { app: { id: "github", name: "GitHub", pluginDisplayNames: [] }, plugin: { plugin: { id: "github", name: "GitHub" } } },
    { app: { id: "slack", name: "Slack", pluginDisplayNames: [] }, plugin: { plugin: { id: "slack", name: "Slack" } } },
  ],
  mcpServerStatuses: [
    { name: "github", status: "authentication_required" },
    { name: "local", status: "ready" },
  ],
});
check(state.histories.length === 1, "limits setup to foreground time and provider window");
check(state.appsRequiringConnection.length === 1 && state.appsRequiringConnection[0].id === "github", "correlates imported apps by normalized name");
check(state.importedPlugins.length === 1 && state.importedPlugins[0].app.id === "github", "correlates imported plugins");
check(state.hasImportedConnectorSetup === true, "detects imported connector setup");
check(state.hasImportedMcpServers === true, "detects imported MCP configuration");
check(state.hasImportedHooks === true, "detects imported hooks");
check(state.mcpServerNamesRequiringAuthentication[0] === "github", "reports only MCP servers requiring authentication");
check(state.initialTab === "apps", "prioritizes app setup tab");
check(state.isLoading === false, "settled data is ready");
check(state.tabStatus.apps === "ready" && state.tabStatus.mcps === "ready", "derives per-tab ready status");

const loading = imported.n({ historiesLoading: true });
check(loading.isLoading === true, "hook surface exposes loading state");
check(loading.initialTab === null, "does not select a tab while loading");
const failed = imported.$({ appsError: new Error("catalog") });
check(failed.tabStatus.apps === "error", "surfaces app catalog error");
check(failed.initialTab === "apps", "selects failed app tab for retry");

const remoteIds = imported.mt({
  items,
  remotePluginIdsByName: { "chatgpt-for-finance": "remote-finance" },
  additionalPluginNames: ["chatgpt-for-finance"],
});
check(remoteIds.get("chatgpt-for-finance@latest") === "remote-finance", "maps prompt mentions to remote plugin ids");
check(imported.lt({ disabledRemotePluginIds: new Set(["remote-finance"]), enabled: true, items, remotePluginIds: remoteIds }).length === 3, "filters tasks whose remote plugin is disabled");
check(imported.dt(items[3]) === "chatgpt-for-finance", "finds a task's single plugin name");
check(imported.K(["custom"], [], 2).join(",") === "custom,desktop_note", "fills task selection to minimum with defaults");
check(imported.K(["a", "b", "c"], ["b"], 2).join(",") === "a,c", "removes declined tasks before limiting");
check(imported.it(histories[1], 100) === true && imported.it(histories[0], 100) === false, "compares import completion time");
check(imported.ot("claude-code") === true && imported.ot("claude-cowork") === false, "applies provider unknown-name policy");
check(imported.bt({ itemType: "SESSIONS" }) === true, "recognizes session imports");
check(imported._({ itemType: "PLUGINS" }) === true, "recognizes imported configuration");

console.log(`${assertions} imported setup opportunity contract assertions passed`);
