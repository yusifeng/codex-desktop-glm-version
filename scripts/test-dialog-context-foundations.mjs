import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__dialogContextFoundationsTest = {
  analytics: [],
  initialized: [],
  mutations: [],
  openedModals: [],
  queries: [],
  scopeSets: [],
  signalValues: new Map(),
  startedImages: [],
});

const localStorageValues = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => localStorageValues.get(key) ?? null,
    removeItem: (key) => localStorageValues.delete(key),
    setItem: (key, value) => localStorageValues.set(key, value),
  },
};

const React = {
  useId: () => "bridge-id",
  useState(initialValue) {
    const slot = { value: initialValue };
    return [slot.value, (next) => {
      slot.value = typeof next === "function" ? next(slot.value) : next;
      state.lastState = slot.value;
    }];
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
const appScope = { id: "app-scope" };
const scope = {
  value: {},
  get(signal, parameter) {
    if (parameter !== undefined && signal === state.conversationNodes)
      return state.conversationRecords?.[parameter];
    return state.signalValues.get(signal);
  },
  set(signal, update) {
    const current = state.signalValues.get(signal);
    const next = typeof update === "function" ? update(current) : update;
    state.signalValues.set(signal, next);
    state.scopeSets.push({ signal, next });
  },
  query: {
    snapshot(query) {
      return {
        cancel: async () => state.cancelledQuery = query,
        setData: (data) => state.savedQueryData = data,
      };
    },
  },
};

function appSharedMock() {
  return `
    const state = globalThis.__dialogContextFoundationsTest;
    export const $3 = () => {};
    export const $O = { ONE_MINUTE: 60000 };
    export const FX = () => state.initialized.push("signals");
    export const QI = () => state.initialized.push("scope");
    export const g4 = () => state.initialized.push("dialog-runtime");
    export const ek = () => state.initialized.push("query-hooks");
    export const I3 = () => globalThis.__dialogContextJsx;
    export const e6 = () => globalThis.__dialogContextReact;
    export const LX = () => globalThis.__dialogContextScope;
    export const ZI = globalThis.__dialogContextAppScope;
    export const eZ = (appScope, factory) => { const value = { appScope, factory }; state.queries.push(value); return value; };
    export const YX = (appScope, factory) => { const value = { appScope, factory }; state.mutations.push(value); return value; };
    export const rZ = (appScope, factory, options) => ({ appScope, factory, options });
    export const l3 = (left, right) => JSON.stringify(left) === JSON.stringify(right);
    export const H4 = shape => ({ safeParse(value) { if (value == null || typeof value !== "object") return { success: false }; const queries = value.rewritten_queries; return Array.isArray(queries) ? { success: true, data: { rewritten_queries: queries.filter(item => typeof item === "string" && item !== "") } } : { success: false }; } });
    export const E4 = schema => ({ transform: transformer => ({ safeParse(value) { if (!Array.isArray(value)) return { success: false }; return { success: true, data: transformer(value) }; } }) });
    export const Z4 = () => ({ safeParse: value => typeof value === "string" ? { success: true, data: value } : { success: false } });
    export const BX = family => family === state.workspacesQuery ? { data: state.workspaceDiscovery } : state.signalValues.get(family);
    export const Y2 = "FormattedMessage";
    export const bS = "BuildingIcon";
    export const qv = "SearchIcon";
    export const jf = { Item: "MenuItem" };
    export const n4 = () => ({ formatMessage: descriptor => descriptor.defaultMessage });
    export const HX = signal => state.signalValues.get(signal);
    export const Ih = "Dialog";
    export const Rh = "DialogTitle";
    export const Yh = "Button";
    export const Zh = () => state.initialized.push("button");
    export const c_ = () => state.initialized.push("tooltip");
    export const o_ = "Tooltip";
    export const tU = () => "mcp-app-id";
    export const zh = () => state.initialized.push("dialog");
  `;
}

function appInitialMock() {
  return `
    const state = globalThis.__dialogContextFoundationsTest;
    ${["FX","QI","Vzt","Sun","cJt","ek","Sqt","uHt","fnn","d2","u2","Ir","lW","Gdt","RR","kk","M6t"].map(name => `export const ${name} = () => state.initialized.push("${name}");`).join("\n")}
    export const Bzt = { id: "has-any" }; export const Gzt = () => true;
    export const Hzt = () => false; export const Kzt = () => false;
    export const Rzt = scope => state.closedAll = scope;
    export const Uzt = (scope, component, props) => state.openedModals.push({ scope, component, props });
    export const Wzt = (scope, blocking) => state.blocking = { scope, blocking };
    export const qzt = () => ({ open: true }); export const zzt = () => state.closedOne = true;
    export const U6t = { id: "account" }; export const _un = { id: "user" }; export const xun = { id: "personalization" };
    export const rJt = {
      safeGet: async (path, options) => ({ path, signal: options.signal }),
      safePatch: async (path, options) => ({ path, body: options.requestBody }),
    };
    export const RVt = globalThis.__dialogContextConversationNodes;
    export const mnn = (turn, requests, options) => ({ ...turn, projected: true, requests, options });
    export const h2 = () => input => state.startedImages.push(input);
    export const l2 = "AnnouncementModal";
    export const uW = { id: "pending-connect" };
    export const Lr = () => ({
      isAppConnectPending: (...args) => { state.pendingArgs = args; return true; },
      markAppConnectOAuthPending: event => { state.oauthEvent = event; return state.oauthReturn; },
    });
    export const cW = (scope, id, result) => state.connectResults = [...(state.connectResults ?? []), { scope, id, result }];
    export const LR = "McpActionIcon"; export const Wdt = action => action.icon;
    export const Mk = (scope, fields) => state.analytics.push({ scope, fields });
    export const N6t = () => state.auth;
    export const Ox = response => response?.normalized ?? [];
    export const Wln = plan => plan === "enterprise";
    export const iht = () => ({ data: state.accountsResponse });
    export const mC = globalThis.__dialogContextWorkspacesQuery;
    export const xpn = (scope, event, fields) => state.analytics.push({ scope, event, fields });
  `;
}

function mockChunk(name) {
  if (name === "app-shared") return appSharedMock();
  if (name === "app-initial") return appInitialMock();
  if (name === "app-primary") return `
    export const Qp = globalThis.__dialogContextAnnouncementSources;
    export const em = () => globalThis.__dialogContextFoundationsTest.initialized.push("announcement-sources");
  `;
  if (name === "workspace-discovery") return `
    export const c = value => value?.eligible === true;
    export const i = () => {}; export const l = () => {}; export const n = () => {};
    export const r = { id: "workspace-opened" }; export const t = "WorkspaceDiscoveryDialog";
  `;
  if (name === "conversation-markdown") return `
    export class a {
      constructor(limit) { this.limit = limit; this.value = ""; this.truncated = false; }
      append(value) { const next = this.value + value; if (next.length > this.limit.maxChars) { this.value = next.slice(0, this.limit.maxChars - this.limit.truncationMarker.length) + this.limit.truncationMarker; this.truncated = true; } else this.value = next; }
      toString() { return this.value; }
    }
    export const i = ({ turn }) => turn.text ?? null;
    export const o = () => {}; export const r = title => "# " + title; export const t = () => {};
  `;
  if (name === "app-connect-modal-by-id") return `export const n = "AppConnectModalById"; export const r = () => {};`;
  if (name === "view-frame") return `export const n = () => {}; export const t = "ViewFrame";`;
  return "export const sideEffect = true;";
}

globalThis.__dialogContextJsx = jsx;
globalThis.__dialogContextReact = React;
globalThis.__dialogContextScope = scope;
globalThis.__dialogContextAppScope = appScope;
globalThis.__dialogContextAnnouncementSources = { id: "announcement-sources" };
globalThis.__dialogContextConversationNodes = { id: "conversation-nodes" };
globalThis.__dialogContextWorkspacesQuery = { id: "workspaces-query" };
state.conversationNodes = globalThis.__dialogContextConversationNodes;
state.workspacesQuery = globalThis.__dialogContextWorkspacesQuery;
state.signalValues.set(globalThis.__dialogContextAnnouncementSources, new Map());

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "mock-renderer-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockChunk(importPath), loader: "js" }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

const modalState = await bundle("modal-controller-state");
assert.equal(modalState.hasAnyModalOpen$.id, "has-any");
assert.equal(modalState.useHasAnyModalOpen(), true);
assert.equal(modalState.isModalOpen(), false);
assert.deepEqual(modalState.useModalState(), { open: true });
modalState.closeAllModals(scope);
assert.equal(state.closedAll, scope);
modalState.setModalBlocking(scope, true);
assert.deepEqual(state.blocking, { scope, blocking: true });

const bridge = await bundle("announcement-modal-source-bridge");
bridge.n();
const bridgeElement = bridge.t({ source: "home", candidate: { id: "candidate" } });
bridgeElement.props.ref({});
assert.deepEqual(state.signalValues.get(globalThis.__dialogContextAnnouncementSources).get("bridge-id"), { source: "home", candidate: { id: "candidate" } });
bridgeElement.props.ref(null);
assert.equal(state.signalValues.get(globalThis.__dialogContextAnnouncementSources).size, 0);

state.signalValues.set({ id: "unused" }, null);
const userContext = await bundle("chatgpt-user-context");
userContext.n();
state.signalValues.set(globalThis.__dialogContextAccountSignal, "account-1");
state.signalValues.set(globalThis.__dialogContextUserSignal, "user-1");
// Resolve the mock signal identities exported by the bundled initializer.
const query = state.queries.at(-1);
const accountSignal = [...state.signalValues.keys()].find((key) => key?.id === "account") ?? { id: "account" };
const userSignal = [...state.signalValues.keys()].find((key) => key?.id === "user") ?? { id: "user" };
const personalizationSignal = { id: "personalization" };
state.signalValues.set(accountSignal, "account-1");
state.signalValues.set(userSignal, "user-1");
state.signalValues.set(personalizationSignal, true);
// The mock exports fresh literals; make scope.get recognize their ids.
const originalGet = scope.get.bind(scope);
scope.get = (signal, parameter) => {
  if (signal?.id === "account") return "account-1";
  if (signal?.id === "user") return "user-1";
  if (signal?.id === "personalization") return true;
  return originalGet(signal, parameter);
};
const queryOptions = query.factory({ scope });
assert.equal(queryOptions.enabled, true);
assert.deepEqual(queryOptions.queryKey, ["chatgpt-user-context", "account-1", "user-1"]);
assert.equal(queryOptions.staleTime, 60000);
assert.deepEqual(await queryOptions.queryFn({ signal: "abort" }), { path: "/user_system_messages", signal: "abort" });
const mutationOptions = state.mutations.at(-1).factory({ scope });
assert.deepEqual(await mutationOptions.mutationFn({ about: "me" }), { path: "/user_system_messages", body: { about: "me" } });
assert.deepEqual(state.savedQueryData, { path: "/user_system_messages", body: { about: "me" } });

const requestContext = await bundle("request-context");
state.conversationRecords = {
  conversation: {
    child: { parent: "assistant", message: { author: { role: "user" }, metadata: { business_agent_context: { id: 1 } } } },
    assistant: { parent: "root", message: { author: { role: "assistant" }, metadata: { shopping: { rewritten_queries: [" shoes ", "", 7] } } } },
    root: { parent: null, message: { author: { role: "user" }, metadata: {} } },
  },
};
assert.deepEqual(requestContext.t(scope, { conversationId: "conversation", messageId: "child" }, { cite: true }), { rewrittenQueries: [" shoes "], isSourceCatalog: true });
assert.deepEqual(requestContext.t(scope, { conversationId: "missing", messageId: "none" }, { cite: false }), { rewrittenQueries: undefined, isSourceCatalog: false });

const promo = await bundle("promo-funnel-context");
const originalNow = Date.now;
Date.now = () => 1_000;
promo.r({ location: "checkout", promoCode: "SAVE" });
assert.equal(localStorageValues.size, 1);
const storedPromo = JSON.parse([...localStorageValues.values()][0]);
assert.equal(storedPromo.expiresAt, 86_401_000);
assert.deepEqual(promo.t(), { accountId: undefined, location: "checkout", organizationId: undefined, promoCampaignId: undefined, promoCode: "SAVE", referralCode: undefined });
assert.equal(localStorageValues.size, 0);
localStorageValues.set("oai/apps/promoFunnelCheckoutContext", JSON.stringify({ ...storedPromo, expiresAt: 999 }));
assert.equal(promo.t(), null);
Date.now = originalNow;

state.auth = { userId: "user", accountId: "account", authMethod: "chatgpt" };
state.workspaceDiscovery = { eligible: true };
state.accountsResponse = { normalized: [{ isPersonalWorkspace: true }], accounts: [] };
const workspaceMenu = await bundle("workspace-discovery-menu-item");
const menuItem = workspaceMenu.WorkspaceDiscoveryMenuItem({ placement: "profile" });
assert.equal(menuItem.type, "MenuItem");
assert.equal(menuItem.props.leftIcon.type, "SearchIcon");
menuItem.props.onSelect();
assert.equal(state.openedModals.at(-1).component, "WorkspaceDiscoveryDialog");
assert.equal(state.analytics.at(-1).fields.location, "expanded_sidebar");

const imageModal = await bundle("imagegen-announcement-modal");
let shown = 0;
let dismissed = 0;
const imageElement = imageModal.ImageGen25AnnouncementModal({ dismissAnnouncement: () => dismissed++, imageUrl: "image.png", onShown: () => shown++ });
assert.equal(imageElement.type, "AnnouncementModal");
imageElement.props.body.props.ref({});
assert.equal(shown, 1);
imageElement.props.onPrimaryAction();
assert.equal(dismissed, 1);
assert.deepEqual(state.startedImages.at(-1), { prefillPrompt: "Create an image of " });

const contextRenderer = await bundle("conversation-context-renderer");
const renderedContext = contextRenderer.renderConversationContext({ cwd: "/repo", isBackgroundSubagentsEnabled: true, markdownLimit: { maxChars: 200, truncationMarker: "..." }, projectlessOutputDirectory: null, title: "Task", visibleTurnEntries: [{ turn: { text: "first" }, requests: [] }, { turn: { text: "second" }, requests: [] }] });
assert.equal(renderedContext, "# Task\n\nfirst\n\nsecond\n");
assert.equal(renderedContext.endsWith("\n"), true);

state.signalValues.set({ id: "pending-connect" }, null);
scope.get = originalGet;
const pendingConnectSignal = { id: "pending-connect" };
state.signalValues.set(pendingConnectSignal, { id: "request-1", connectorId: "github", hostId: "local", requireAuth: true, githubRepositoryAccess: { linkId: "link-1" } });
const previousSignalGet = state.signalValues.get.bind(state.signalValues);
state.signalValues.get = (key) => key?.id === "pending-connect" ? previousSignalGet(pendingConnectSignal) : previousSignalGet(key);
const connectModal = await bundle("mcp-connect-sheet-modal");
const connectElement = connectModal.McpConnectSheetModal({ onClose: () => state.closedConnect = true });
assert.equal(connectElement.type, "AppConnectModalById");
assert.equal(connectElement.props.authTypeOverride, "OAUTH");
assert.equal(connectElement.props.isCompletingConnection, true);
connectElement.props.onConnected("link-2");
assert.deepEqual(state.connectResults.at(-1).result, { didConnect: true, linkId: "link-2" });
connectElement.props.onOpenChange(false);
assert.equal(state.closedConnect, true);

const quickAction = await bundle("mcp-quick-action-dialog");
let opened = 0;
const quickElement = quickAction.t({ action: { title: "Run", icon: "spark", target: { arguments: { value: 1 } } }, pending: false, quickActionView: { id: "view" }, onOpen: async () => { opened++; return { toolResult: { ok: true } }; }, view: { tool: { _meta: { "openai/iconStyle": "monochrome" } } } });
assert.equal(quickElement.type, "Fragment");
const dialog = quickElement.props.children[0];
assert.equal(dialog.type, "Dialog");
assert.equal(dialog.props.open, false);
dialog.props.onOpenChange(true);
await Promise.resolve();
assert.equal(opened, 1);
assert.equal(state.analytics.at(-1).fields.view.id, "view");
assert.equal(state.lastState.toolResult.ok, true);

console.log("dialog and context foundation assertions passed");
