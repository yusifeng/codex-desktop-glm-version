import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["keyboard-shortcuts-gate", "app-connect-link-navigation", "epic-launch-contracts", "codex-analytics-attribution", "control-group", "outbound-identity-error", "keyboard-shortcut-command-order", "keyboard-shortcuts-search-input"];
const state = globalThis.__shortcutFoundationsTest = {
  commands: new Map(),
  initialized: [],
  jsx: { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) },
};
const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const raw of match[1].split(",")) {
      const specifier = raw.trim().replace(/^type\s+/, "");
      if (specifier) names.add(specifier.split(/\s+as\s+/)[0]);
    }
    importedNamesByModule.set(match[2], names);
  }
}
const marker = name => `() => globalThis.__shortcutFoundationsTest.initialized.push(${JSON.stringify(name)})`;
const overrides = {
  "app-shared": {
    $3: `() => ({})`,
    $en: `{ id: "conversation-scope" }`,
    Dp: `["thread", "navigation", "app"]`,
    Ep: marker("command-registry"),
    FX: marker("signals"),
    Gp: `id => id === "realtimeVoice" || id.startsWith("realtimeVoice.") || id === "composer.startVoiceMode"`,
    I3: `() => globalThis.__shortcutFoundationsTest.jsx`,
    K2: marker("internationalization"),
    Np: `id => globalThis.__shortcutFoundationsTest.commands.get(id) ?? null`,
    Y2: `"FormattedMessage"`,
    e6: `() => ({ useId: () => "search-id" })`,
    h4: marker("class-names"),
    kp: `["focusTab1"]`,
    m4: `(...values) => values.filter(Boolean).join(" ")`,
    n4: `() => ({ formatMessage: descriptor => descriptor.defaultMessage })`,
    sZ: `(scope, factory) => ({ kind: "derived", scope, factory })`,
    zp: `(command, access) => command.requiredAccess === "codexLocal" ? access.codexLocal : command.requiredAccess === "codexOrWorkLocal" ? access.codexLocal || access.workLocal : true`,
  },
  "app-initial": {
    $en: `{ id: "conversation-scope" }`,
    Dft: marker("app-connect-navigation"),
    HZt: marker("conversation-state"),
    itn: marker("route-state"),
    lQt: `{ id: "latest-turn" }`,
    mT: marker("search-input"),
    pT: `"SearchInput"`,
  },
};
function mockModule(name) {
  if (name === "rolldown-runtime") return "export {};";
  const names = importedNamesByModule.get(name) ?? new Set();
  return [...names].map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "undefined"};`).join("\n");
}
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "shortcut-foundation-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
  } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

// keyboard-shortcuts-gate: 3
const gate = await bundle("keyboard-shortcuts-gate");
assert.equal(gate.t, undefined);
gate.n();
assert.equal(gate.t, "1932174607");
assert.deepEqual(Object.keys(gate).sort(), ["n", "t"]);

// app-connect-link-navigation: 4
const appConnect = await bundle("app-connect-link-navigation");
assert.equal(appConnect.n("https://example.com"), false);
assert.equal(appConnect.n("chatgpt://app-connect"), false);
appConnect.t(); appConnect.t();
assert.equal(state.initialized.filter(name => name === "app-connect-navigation").length, 1);
assert.deepEqual(Object.keys(appConnect).sort(), ["n", "t"]);

// epic-launch-contracts: 4
const contracts = await bundle("epic-launch-contracts");
assert.equal(contracts.n, undefined);
contracts.r();
assert.equal(contracts.n, "/epic/launch");
assert.equal(contracts.t, "oai-epic-launch-changed");
assert.deepEqual(Object.keys(contracts).sort(), ["n", "r", "t"]);

// codex-analytics-attribution: 7
const attribution = await bundle("codex-analytics-attribution");
attribution.t();
assert.equal(attribution.n.kind, "derived");
assert.equal(attribution.n.scope.id, "conversation-scope");
const nonThreadContext = { scope: { value: { routeKind: "home", conversationId: "c1" } }, get() { throw new Error("not read"); } };
assert.equal(attribution.n.factory(nonThreadContext), null);
const noTurnContext = { scope: { value: { routeKind: "local-thread", conversationId: "c1" } }, get: () => null };
assert.equal(attribution.n.factory(noTurnContext), null);
const turnContext = { scope: { value: { routeKind: "local-thread", conversationId: "c1" } }, get: (_signal, conversationId) => ({ turnId: `${conversationId}-turn` }) };
assert.deepEqual(attribution.n.factory(turnContext), { threadId: "c1", turnId: "c1-turn" });
assert.equal(state.initialized.includes("conversation-state"), true);
assert.equal(state.initialized.includes("route-state"), true);

// control-group: 5
const controls = await bundle("control-group");
controls.n();
const controlNode = controls.t({ children: "child", className: "extra" });
assert.equal(controlNode.type, "div");
assert.equal(controlNode.props.className, "flex items-center gap-2 extra");
assert.equal(controlNode.props.children, "child");
assert.equal(state.initialized.includes("class-names"), true);
assert.deepEqual(Object.keys(controls).sort(), ["n", "t"]);

// outbound-identity-error: 3
const outbound = await bundle("outbound-identity-error");
outbound.n();
const expectedMessages = [
  [{ status: 403 }, "restricted.environmentSetup.oic.accessError"],
  [{ status: 409 }, "restricted.environmentSetup.oic.conflictError"],
  [{ status: 400 }, "restricted.environmentSetup.oic.configurationError"],
  [{ error: "invalid-request" }, "restricted.environmentSetup.oic.configurationError"],
  [{ status: 401 }, "restricted.environmentSetup.oic.authenticationError"],
  [{ error: "authentication" }, "restricted.environmentSetup.oic.authenticationError"],
  [{ status: 500 }, "restricted.environmentSetup.oic.requestError"],
];
for (const [error, id] of expectedMessages) assert.equal(outbound.t({ error }).props.children.props.id, id);
const outboundNode = outbound.t({ error: { status: 403 } });
assert.equal(outboundNode.props.role, "alert");
assert.equal(outboundNode.props.className, "text-sm text-danger select-none");

// keyboard-shortcut-command-order: 23
const order = await bundle("keyboard-shortcut-command-order");
order.n();
const base = { commandAccess: { codexLocal: true, workLocal: false } };
assert.equal(order.i("ordinary", base), true);
assert.equal(order.i("copyConversationPath", { ...base, platform: "macOS" }), true);
assert.equal(order.i("copyConversationPath", { ...base, platform: "windows" }), false);
assert.equal(order.i("toggleTraceRecording", base), false);
assert.equal(order.i("openBrowserTab", { ...base, browserEnabled: true }), true);
assert.equal(order.i("openBrowserTab", { ...base, browserEnabled: false }), false);
assert.equal(order.i("stepWorkspaceLayout", { ...base, browserEnabled: true }), true);
assert.equal(order.i("focusTab1", { ...base, isUnifiedTabStripEnabled: true }), true);
assert.equal(order.i("focusTab1", { ...base, isUnifiedTabStripEnabled: false }), false);
assert.equal(order.i("toggleDebugModal", { ...base, allowDebugMenu: true }), true);
assert.equal(order.i("toggleDebugModal", { ...base, allowDebugMenu: false }), false);
assert.equal(order.i("file.goToDefinition", { ...base, fileLanguageFeaturesEnabled: false }), false);
assert.equal(order.i("hotkeyWindow", { ...base, isHotkeyWindowEnabled: true }), true);
assert.equal(order.i("manageTasks", { ...base, isAutomationsEnabled: false }), false);
assert.equal(order.i("switchToMode2", { ...base, modeSwitchAvailable: true }), true);
assert.equal(order.i("togglePriorityFilter", { ...base, isPriorityFilterEnabled: false }), false);
assert.equal(order.i("realtimeVoice.mute", { ...base, isRealtimeVoiceCommandEnabled: true }), true);
assert.equal(order.i("composer.startDictation", { ...base, isDictationEnabled: false }), false);
state.commands.set("restricted", { id: "restricted", kind: "webview", requiredAccess: "codexLocal" });
assert.equal(order.i("restricted", { commandAccess: { codexLocal: false, workLocal: true } }), false);
assert.equal(order.a({ id: "personalitySettings", kind: "webview" }, base), false);
assert.equal(order.a({ id: "ordinary", kind: "webview" }, base), true);
const sorted = [{ id: "z", kind: "webview", commandMenuGroupKey: "navigation" }, { id: "quickChat", kind: "webview", commandMenuGroupKey: "thread" }, { id: "newTask", kind: "webview", commandMenuGroupKey: "thread" }].sort(order.t);
assert.deepEqual(sorted.map(command => command.id), ["newTask", "quickChat", "z"]);
assert.equal(state.initialized.filter(name => name === "command-registry").length >= 1, true);

// keyboard-shortcuts-search-input: 13
const search = await bundle("keyboard-shortcuts-search-input");
search.n();
const changes = [];
let searchNode = search.t({ value: "abc", onValueChange: value => changes.push(value) });
assert.equal(searchNode.type, "div");
assert.equal(searchNode.props["data-codex-shortcut-capture"], undefined);
assert.equal(searchNode.props.children.type, "SearchInput");
assert.equal(searchNode.props.children.props.id, "search-id");
assert.equal(searchNode.props.children.props.inputKey, "text");
assert.equal(searchNode.props.children.props.isClearable, true);
assert.equal(searchNode.props.children.props.label, "Search keyboard shortcuts");
const escapeEvent = { defaultPrevented: false, key: "Escape", prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
searchNode.props.children.props.onKeyDown(escapeEvent);
assert.deepEqual(changes, [""]);
assert.equal(escapeEvent.prevented, true);
assert.equal(escapeEvent.stopped, true);
searchNode = search.t({ isSearchingByKeystrokes: true, value: "⌘K", onValueChange() {} });
assert.equal(searchNode.props["data-codex-shortcut-capture"], true);
assert.equal(searchNode.props.children.props.inputKey, "keystrokes");
assert.equal(searchNode.props.children.props.readOnly, true);

console.log("shortcuts/navigation foundations cluster tests passed (62 assertions)");
