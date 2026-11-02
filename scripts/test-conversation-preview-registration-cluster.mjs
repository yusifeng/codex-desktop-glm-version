import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["open-pending-site-preview", "site-preview-persistence-bridge", "registered-conversation-thumbnail-core", "registered-sources", "automation-side-panel-tab-core"];
const state = globalThis.__conversationRegistrationTest = {
  effects: [], initialized: [], openTabs: [], persisted: [], signalValue: null,
};
state.jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
state.react = { useEffect(effect) { state.effects.push(effect); } };

const imports = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = imports.get(match[2]) ?? new Set();
    for (const item of match[1].split(",")) {
      const name = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
      if (name) names.add(name);
    }
    imports.set(match[2], names);
  }
}
const marker = (name) => `() => globalThis.__conversationRegistrationTest.initialized.push(${JSON.stringify(name)})`;
const component = (name) => JSON.stringify(name);
const overrides = {
  "app-shared": {
    BX: `() => globalThis.__conversationRegistrationTest.signalValue`, FX: marker("signals"), I3: `() => globalThis.__conversationRegistrationTest.jsx`,
    Ib: component("SourcesIcon"), LX: `() => globalThis.__conversationRegistrationTest.scope`, Qh: component("LoadingSpinner"),
    Y2: component("FormattedMessage"), Yh: component("Button"), ZI: `{ id: "app" }`, e6: `globalThis.__conversationRegistrationTest.react`,
    mg: `path => "FileIcon:" + path`, oZ: `(scope, factory) => ({ scope, factory })`, wy: component("AutomationIcon"),
  },
  "app-initial": {
    $en: `{ id: "route" }`, HZt: marker("conversation-model"), Hl: `{ id: "project" }`, Lbt: `{ id: "enabled" }`,
    Rl: `(scope, tab) => { globalThis.__conversationRegistrationTest.openTabs.push(tab); return true; }`,
    Vl: `(...args) => globalThis.__conversationRegistrationTest.persisted.push(args)`,
    Xd: component("TabThumbnail"), _Bt: `() => globalThis.__conversationRegistrationTest.alreadyOpen ?? false`,
    qvt: `{ activeTab$: { id: "active-tab" }, closeTab: id => { globalThis.__conversationRegistrationTest.closedTab = id; }, updateTab: (id, update) => { globalThis.__conversationRegistrationTest.updatedTab = [id, update]; } }`,
    vbt: `{ id: "revision" }`, zl: `projectId => projectId == null ? null : ({ isOpen: true, projectId })`,
  },
  "app-primary": { pf: `{ id: "current-conversation" }` },
  "appgen-query": { appgenProjectQuery$: `{ id: "project-query" }` },
  "conversation-thumbnail-ui": { n: marker("thumbnail-ui"), t: component("ConversationThumbnail") },
  "local-conversation-webmcp-tools-model": { t: `url => new URL(url).hostname` },
  "cloud-automation-detail-panel": { t: component("AutomationEditorPanel") },
};

function mockModule(name) {
  if (name === "rolldown-runtime") return "export {};";
  return [...(imports.get(name) ?? [])].filter((name) => name !== "ScopedSignalFamily").map((exportName) => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "undefined"};`).join("\n");
}
let bundleIndex = 0;
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "conversation-registration-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${bundleIndex++}`);
}
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach((child) => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, (candidate) => { if (result == null && predicate(candidate)) result = candidate; }); return result; }

// OpenPendingSitePreview
state.effects = [];
const pendingWatchers = [];
const pending = { projectId: "project-1", title: "Site", url: "https://site.test" };
state.scope = { watch(callback) { pendingWatchers.push(callback); return () => {}; } };
const pendingModule = await bundle("open-pending-site-preview");
assert.deepEqual(Object.keys(pendingModule), ["OpenPendingSitePreview"]);
assert.equal(pendingModule.OpenPendingSitePreview({ pending }), null);
assert.equal(state.effects.length, 1);
state.effects[0]();
assert.equal(pendingWatchers.length, 1);
const pendingSets = [];
pendingWatchers[0]({ get: () => pending, set: (...args) => pendingSets.push(args), value: { conversationId: "c1", routeKind: "chatgpt-thread" } });
assert.equal(state.openTabs.at(-1).projectId, "project-1");
assert.equal(pendingSets[0][1], null);

// SitePreviewPersistenceBridge
state.effects = []; state.openTabs = []; state.persisted = [];
const siteWatchers = [];
const values = new Map([["project", "project-2"], ["enabled", true], ["current-conversation", { conversationId: "c2" }], ["revision", 1], ["active-tab", { tabId: "site-preview:preview-7" }]]);
state.scope = {
  get(signal) { return values.get(signal?.id); },
  query: { fetch: async () => ({ current_live_url: "https://live.test", id: "project-2", status: "active", title: "Live" }) },
  value: { conversationId: "c2", routeKind: "chatgpt-thread" },
  watch(callback) { siteWatchers.push(callback); return () => {}; },
};
const persistence = await bundle("site-preview-persistence-bridge");
assert.deepEqual(Object.keys(persistence), ["SitePreviewPersistenceBridge"]);
assert.equal(persistence.SitePreviewPersistenceBridge(), null);
assert.equal(state.effects.length, 2);
state.effects.forEach((effect) => effect());
assert.equal(siteWatchers.length, 2);
siteWatchers[0](state.scope);
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(state.openTabs[0].url, "https://live.test");
values.set("revision", 2);
siteWatchers[1](state.scope);
assert.deepEqual(state.persisted[0], ["project-2", "preview-7", 2]);

// Registered conversation thumbnail core
state.signalValue = { requestExcerpt: "Question", responseExcerpt: "Answer", statusState: { type: "idle", unread: true } };
const conversationThumbnail = await bundle("registered-conversation-thumbnail-core");
assert.deepEqual(Object.keys(conversationThumbnail).sort(), ["n", "t"]);
assert.equal(state.initialized.filter((name) => name === "thumbnail-ui").length, 1);
const conversationNode = conversationThumbnail.t({ conversationId: "c1", draft: "draft", hostId: "local", title: "Chat" });
assert.equal(conversationNode.type, "ConversationThumbnail");
assert.equal(conversationNode.props.title, "Chat");
assert.equal(conversationNode.props.draft, "draft");
state.signalValue = null;
assert.equal(conversationThumbnail.t({ conversationId: "c1", title: "Chat" }), null);

// Registered sources thumbnail
state.signalValue = { totalCount: 7, sources: [
  { kind: "file", label: "report.md", path: "/repo/report.md" },
  { activity: "read", kind: "external", label: "Docs" },
  { callCount: 2, kind: "webmcp", label: "example.com" },
  { kind: "web", pageCount: 1, searchCount: 3 },
] };
const sourcesThumbnail = await bundle("registered-sources");
assert.deepEqual(Object.keys(sourcesThumbnail), ["RegisteredLocalSourcesThumbnail"]);
const sourcesNode = sourcesThumbnail.RegisteredLocalSourcesThumbnail({ conversationId: "c1", title: "Sources" });
assert.equal(sourcesNode.type, "TabThumbnail");
assert.equal(sourcesNode.props.subtitle, "7 sources");
assert.equal(sourcesNode.props.sections.length, 4);
assert.equal(sourcesNode.props.sections[0].content.props.children[1].props.children, "report.md");
assert.equal(sourcesNode.props.sections[1].content.props.children[2].props.children, "Read");
assert.equal(sourcesNode.props.sections[2].content.props.children[2].props.children, "2 calls");
assert.equal(sourcesNode.props.sections[3].content.props.children[2].props.children, "3 searches");
state.signalValue = { totalCount: 0, sources: [] };
assert.equal(sourcesThumbnail.RegisteredLocalSourcesThumbnail({ conversationId: "c1", title: "Sources" }), null);

// Automation side-panel routing and mutations
const automation = await bundle("automation-side-panel-tab-core");
assert.deepEqual(Object.keys(automation).sort(), ["AutomationSidePanelTabContent", "AutomationSidePanelTabIcon"]);
assert.equal(automation.AutomationSidePanelTabIcon().type, "AutomationIcon");
let tabState = { draftInstanceId: "draft-1" };
const setTabState = (update) => { tabState = update(tabState); };
let automationNode = automation.AutomationSidePanelTabContent({ request: { isLoading: true, type: "automation" }, setTabState, tabId: "tab-1", tabState });
assert.equal(find(automationNode, (node) => node.type === "LoadingSpinner").type, "LoadingSpinner");
automationNode = automation.AutomationSidePanelTabContent({ request: { type: "automation" }, setTabState, tabId: "tab-1", tabState });
assert.equal(find(automationNode, (node) => node.type === "FormattedMessage").props.defaultMessage, "Scheduled task unavailable");
automationNode = automation.AutomationSidePanelTabContent({ request: { error: new Error("offline"), type: "automation" }, setTabState, tabId: "tab-1", tabState });
assert.equal(find(automationNode, (node) => node.props?.role === "alert") != null, true);
assert.equal(find(automationNode, (node) => node.type === "FormattedMessage").props.defaultMessage, "Cloud scheduled tasks could not be loaded");
automationNode = automation.AutomationSidePanelTabContent({ request: { proposal: { projectId: "p1", prompt: "Build", title: "Nightly" }, type: "site" }, setTabState, tabId: "tab-1", tabState });
assert.equal(automationNode.type, "section");
find(automationNode, (node) => node.type === "Button").props.onClick();
assert.equal(tabState.savedAutomationId, "site:p1");
automationNode = automation.AutomationSidePanelTabContent({ request: { automation: { id: "a1", name: "Daily" }, type: "automation" }, setTabState, tabId: "tab-1", tabState });
assert.equal(automationNode.type, "AutomationEditorPanel");
automationNode.props.onClose();
assert.equal(state.closedTab, "tab-1");
automationNode.props.onSaved({ id: "a2", name: "Weekly" });
assert.equal(tabState.savedAutomationId, "a2");
assert.deepEqual(state.updatedTab, ["tab-1", { title: "Weekly", tooltip: "Weekly" }]);
automationNode = automation.AutomationSidePanelTabContent({ request: { seed: { directiveKey: "weekly", prompt: "Summarize", title: "Weekly digest" }, type: "suggestion" }, setTabState, tabId: "tab-1", tabState });
assert.equal(automationNode.type, "AutomationEditorPanel");
assert.equal(automationNode.props.item.automation.id, "suggestion:weekly");

console.log("conversation preview registration cluster tests passed");
