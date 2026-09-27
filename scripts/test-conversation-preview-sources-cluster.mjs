import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "latest-turn-preview",
  "local-conversation-sources-side-panel-tab-core",
  "registered-conversation-thumbnail",
];
const state = globalThis.__conversationPreviewSourcesTest = {
  externalOpens: [],
  initialized: [],
  lazyComponents: [],
  sources: null,
  webMcpEnabled: true,
};
state.jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) {
    if (typeof type === "function") return type(props ?? {});
    return { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    if (typeof type === "function") return type(props ?? {});
    return { type, props: props ?? {}, key };
  },
};
globalThis.Element = class Element {
  constructor({ closest = false, matches = false } = {}) { this.closestResult = closest; this.matchesResult = matches; }
  closest() { return this.closestResult ? this : null; }
  matches() { return this.matchesResult; }
};

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

const marker = (name) => `() => globalThis.__conversationPreviewSourcesTest.initialized.push(${JSON.stringify(name)})`;
const component = (name) => JSON.stringify(name);
const overrides = {
  "app-shared": {
    $d: component("CodeBlock"), A_: component("GlobeIcon"), Cf: component("PopoverContent"),
    FX: marker("signals"), HF: `{ event: "analytics" }`, HX: `() => globalThis.__conversationPreviewSourcesTest.webMcpEnabled`,
    I3: `() => globalThis.__conversationPreviewSourcesTest.jsx`, Ih: component("Dialog"),
    Jm: `loader => { const name = "Lazy" + globalThis.__conversationPreviewSourcesTest.lazyComponents.length; globalThis.__conversationPreviewSourcesTest.lazyComponents.push(loader); return name; }`,
    LX: `() => globalThis.__conversationPreviewSourcesTest.scope`, S_: component("IconAsset"),
    Tf: component("PopoverTrigger"), UF: `{ CODEX_SOURCES_SECTION_TYPE_MCP_TOOL_CALLS: "mcp", CODEX_SOURCES_SECTION_TYPE_WEB_PAGES: "pages", CODEX_SOURCES_SECTION_TYPE_WEB_SEARCHES: "search" }`,
    Y2: component("FormattedMessage"), Yh: component("Button"), ZI: `{ id: "app" }`,
    fI: marker("intl"), m4: `(...values) => values.filter(Boolean).join(" ")`,
    n4: `() => ({ formatMessage: descriptor => descriptor.defaultMessage })`, qT: `{ name: "external-link" }`,
    xf: component("Popover"),
  },
  "app-initial": {
    $en: `{ id: "route" }`, Dbt: `{ id: "keyed-expanded" }`, Ebt: marker("preview-state"),
    Fbt: `{ id: "default-expanded" }`, G3: `{}`, Oft: `input => globalThis.__conversationPreviewSourcesTest.externalOpens.push(input)`,
    W3: component("DefaultAppIcon"), bS: `{ SourcesSidePanel: "SourcesSidePanel", SourcesSidePanelList: "SourcesSidePanelList", SourceDetails: "SourceDetails" }`,
    bbt: `(key, expanded) => ({ [key]: expanded })`, mmn: `source => source.id ?? source.label`,
    n0: marker("favicon"), t0: component("Favicon"), tn: `{ id: "web-mcp-enabled" }`,
    wbt: `(value, key) => typeof key === "boolean" ? Boolean(value) : Boolean(value?.[key])`,
    xpn: `(...args) => { globalThis.__conversationPreviewSourcesTest.lastExpansion = args; }`,
  },
  "app-primary": { Io: `{ Item: "DisclosureItem", DisclosureRow: "DisclosureRow", DisclosureBody: "DisclosureBody", Body: "DisclosureBodyContent" }` },
  "virtualized-turn-list": { u: `{ id: "panel-mode" }` },
  "conversation-blocks": { v: component("ConversationBlocks") },
  "open-pending-site-preview": { OpenPendingSitePreview: component("OpenPendingSitePreview") },
  "site-preview-persistence-bridge": { SitePreviewPersistenceBridge: component("SitePreviewPersistenceBridge") },
  "artifact-file-preview-icon": { n: marker("file-preview"), t: component("FilePreviewIcon") },
  "local-conversation-webmcp-tools-model": {
    i: marker("webmcp-model"),
    r: `calls => { const groups = new Map(); for (const call of calls) { const name = call.toolName ?? "tool"; groups.set(name, [...(groups.get(name) ?? []), call]); } return [...groups].map(([name, grouped]) => ({ name, calls: grouped })); }`,
    t: `url => { try { return new URL(url).hostname; } catch { return null; } }`,
  },
  "local-conversation-external-resource-icon": {
    i: marker("external-resource"), n: marker("known-app"), r: `source => source.knownAppId`, t: component("ExternalResourceIcon"),
  },
  "use-local-conversation-sources": { n: `() => globalThis.__conversationPreviewSourcesTest.sources`, t: marker("sources-hook") },
  "tool-activity-disclosure": { n: marker("disclosure"), t: component("ToolActivityDisclosure") },
  "mcp-tool-item-content": { n: marker("mcp-content"), t: component("McpToolItemContent") },
  "registered-conversation-thumbnail-core": { n: marker("thumbnail"), t: component("ConversationThumbnail") },
};

function mockModule(name) {
  if (name === "rolldown-runtime") return "export {};";
  const names = imports.get(name) ?? new Set();
  return [...names].map((exportName) => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "undefined"};`).join("\n");
}

let bundleIndex = 0;
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "conversation-cluster-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${bundleIndex++}`);
}

function walk(node, visit) {
  if (node == null || typeof node !== "object") return;
  visit(node);
  const children = node.props?.children;
  if (Array.isArray(children)) children.flat(Infinity).forEach((child) => walk(child, visit));
  else walk(children, visit);
}
function findAll(node, predicate) { const result = []; walk(node, (candidate) => { if (predicate(candidate)) result.push(candidate); }); return result; }
function find(node, predicate) { return findAll(node, predicate)[0]; }

// latest-turn-preview: state transitions, floating interaction, and lazy boundaries.
const preview = await bundle("latest-turn-preview");
assert.deepEqual(Object.keys(preview).sort(), ["a", "c", "i", "l", "n", "o", "r", "s", "t", "u"]);
preview.r(); preview.r();
assert.equal(state.initialized.filter((name) => name === "preview-state").length, 1);
assert.equal(state.initialized.filter((name) => name === "signals").length, 1);

const defaultSignal = { id: "default-expanded" };
const keyedSignal = { id: "keyed-expanded" };
const panelSignal = { id: "panel-mode" };
const writes = [];
let panel = { displayMode: "shift", isPopoverOpen: false };
state.scope = {
  get(signal, key) {
    if (signal?.id === panelSignal.id) return panel;
    if (signal?.id === defaultSignal.id) return true;
    if (signal?.id === keyedSignal.id) return { [key]: true };
    return undefined;
  },
  set(...args) { writes.push(args); if (args[0]?.id === panelSignal.id) panel = args[1]; },
};
preview.i(state.scope);
assert.equal(writes[0][0].id, "default-expanded");
assert.equal(writes[0][1], false);
writes.length = 0;
preview.i(state.scope, "thread-1");
assert.equal(writes[0][0].id, "keyed-expanded");
assert.equal(writes[0][1], "thread-1");
assert.deepEqual(writes[0][2], { "thread-1": false });
writes.length = 0;
panel = { displayMode: "overlay", isPopoverOpen: false };
state.scope.get = (signal) => signal?.id === panelSignal.id ? panel : {};
preview.i(state.scope, "thread-2");
assert.equal(writes.length, 2);
assert.deepEqual(writes[1][1], { displayMode: "overlay", isPopoverOpen: true });

const expandedChanges = [];
let view = preview.t({ expanded: false, isTurnInProgress: true, onExpandedChange: (value) => expandedChanges.push(value), presentation: "inline", threadPreview: "turn" });
assert.equal(view.type, "DisclosureItem");
assert.equal(view.props.overlap, true);
assert.equal(find(view, (node) => node.type === "DisclosureRow").props.title.props.defaultMessage, "Working");
assert.deepEqual(find(view, (node) => node.type === "ConversationBlocks").props.items, [{ key: "latest-turn-preview", node: "turn" }]);
assert.equal(find(view, (node) => node.type === "DisclosureBody").props.maxHeight, "22.5rem");
view = preview.t({ expanded: false, isTurnInProgress: false, onExpandedChange: (value) => expandedChanges.push(value), presentation: "floating-visible", threadPreview: "turn" });
assert.equal(view.type, "div");
assert.equal(view.props.inert, false);
let stopped = false;
find(view, (node) => node.type === "DisclosureRow").props.onWheel({ deltaX: 1, deltaY: 5, stopPropagation() { stopped = true; } });
assert.equal(stopped, true);
assert.deepEqual(expandedChanges, [true]);
view = preview.t({ expanded: true, isTurnInProgress: false, onExpandedChange() {}, presentation: "floating-hidden", threadPreview: "turn" });
assert.equal(view.props["aria-hidden"], true);
assert.match(view.props.className, /pointer-events-none/);

let prevented = 0;
const popover = preview.a({ children: "body", isOpen: true, onOpenChange() {}, shouldPreventAutoFocus: true, trigger: "trigger" });
assert.equal(popover.type, "Popover");
assert.equal(find(popover, (node) => node.type === "PopoverTrigger").props.children, "trigger");
const content = find(popover, (node) => node.type === "PopoverContent");
content.props.onOpenAutoFocus({ preventDefault() { prevented++; } });
content.props.onPointerDownOutside({ target: new Element({ closest: true }), preventDefault() { prevented++; } });
assert.equal(prevented, 2);
preview.c(); preview.c();
assert.equal(state.lazyComponents.length, 2);
assert.equal(preview.s().type, "Fragment");
assert.equal(preview.l({ hostId: "h", visible: false }), null);
assert.equal(preview.l({ hostId: "h" }).type, "Button");

// local-conversation-sources-side-panel-tab-core: grouping and all open paths.
state.sources = {
  fileSources: [{ id: "file-1", label: "image.png", path: "/tmp/image.png" }],
  externalSources: [{ activities: ["read"], key: "external-1", title: "example.com", url: "https://example.com/page" }],
  toolSources: [{ activities: [{ label: "search", calls: [{ callId: "call-1" }, { callId: "call-2" }] }], id: "tool-1", mcpAppId: "app-1", name: "  ", pluginDisplayNames: ["Search App"] }],
  webMcpCalls: [{ kind: "invokeTool", inputJson: '{"q":1}', outputJson: '{"ok":true}', sourceHostname: "example.com", toolName: "lookup" }, { kind: "result", outputJson: "raw", sourceHostname: "unclaimed.test", toolName: "other" }],
  webSearchSource: { queryCount: 1, queries: ["question"], viewedLinks: [{ label: "Page", url: "https://page.test" }] },
};
const sourcePanel = await bundle("local-conversation-sources-side-panel-tab-core");
assert.deepEqual(Object.keys(sourcePanel), ["LocalConversationSourcesSidePanelTab"]);
assert.equal(state.initialized.filter((name) => name === "sources-hook").length, 1);
assert.equal(state.initialized.includes("file-preview"), true);
assert.equal(state.initialized.includes("webmcp-model"), true);
assert.equal(state.initialized.includes("mcp-content"), true);
const openedFiles = [];
const openedImages = [];
const openedApps = [];
const panelTree = sourcePanel.LocalConversationSourcesSidePanelTab({
  conversationId: "conversation-1", hostId: "local",
  getImagePreviewSrc: () => "preview://image", onOpenFile: (source) => openedFiles.push(source),
  onOpenImage: (...args) => openedImages.push(args), onOpenMcpApp: (id) => openedApps.push(id),
});
assert.equal(panelTree.type, "SourcesSidePanel");
assert.equal(find(panelTree, (node) => node.type === "SourcesSidePanelList").props.label, "Sources");
const detailNodes = findAll(panelTree, (node) => node.type === "SourceDetails");
assert.equal(detailNodes.length, 5);
assert.equal(detailNodes[0].props.label, "image.png");
detailNodes[0].props.onOpen();
assert.equal(openedImages.length, 1);
assert.equal(openedFiles.length, 0);
assert.equal(detailNodes[1].props.label, "example.com");
detailNodes[1].props.onOpen({ type: "click" });
assert.equal(state.externalOpens[0].href, "https://example.com/page");
assert.equal(findAll(detailNodes[1], (node) => node.type === "CodeBlock").length, 2);
assert.equal(find(detailNodes[1], (node) => node.type === "CodeBlock").props.content, '{\n  "q": 1\n}');
assert.equal(detailNodes[2].props.label, "unclaimed.test");
assert.equal(detailNodes[3].props.label, "Search App");
detailNodes[3].props.onOpen();
assert.deepEqual(openedApps, ["app-1"]);
assert.equal(findAll(detailNodes[3], (node) => node.type === "McpToolItemContent").length, 2);
assert.equal(detailNodes[4].props.label, "Web search");
const pageButton = find(detailNodes[4], (node) => node.type === "button");
pageButton.props.onClick({ type: "click" });
assert.equal(state.externalOpens.at(-1).href, "https://page.test");
assert.equal(state.externalOpens.at(-1).initiator, "open_in_browser_bridge");

// registered-conversation-thumbnail: eager registration plus semantic re-export.
const thumbnail = await bundle("registered-conversation-thumbnail");
assert.deepEqual(Object.keys(thumbnail), ["RegisteredConversationThumbnail"]);
assert.equal(state.initialized.filter((name) => name === "thumbnail").length, 1);
assert.equal(thumbnail.RegisteredConversationThumbnail, "ConversationThumbnail");

console.log("conversation preview and sources cluster tests passed");
