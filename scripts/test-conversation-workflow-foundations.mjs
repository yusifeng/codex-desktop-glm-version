import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "thread-pin-shortcut-bridge",
  "thread-emoji",
  "local-conversation-plan-model",
  "open-local-conversation-background-terminal-tab",
  "local-conversation-webmcp-tools-model",
  "local-environment-workflow-messages",
  "thread-bridge",
  "open-local-conversation-background-agent",
  "artifact-originating-turn",
  "conversation-start",
  "local-conversation-sources-signals",
  "use-local-conversation-sources",
  "plan-side-panel",
  "local-conversation-external-resource-icon",
  "local-conversation-stream-role-product-event",
  "environment-labels",
  "document-title",
  "use-git-config-value",
  "use-git-submodule-paths",
  "generated-image-output-visibility",
  "permissions-mode-visibility",
  "open-target",
  "remote-connection-editor-draft",
  "middle-truncated-text",
  "creation-target-query",
];

const state = (globalThis.__conversationWorkflowTest = {
  calls: [],
  cleanups: [],
  initialized: [],
  scopedFactories: [],
  shortcutHandler: null,
  signalReads: [],
  scope: {
    value: { pathname: "/tasks", routeKind: "local-thread", search: "?q=1" },
    get(signal) {
      if (signal?.__value !== undefined) return signal.__value;
      return null;
    },
    set() {},
    watch() {
      return () => {};
    },
  },
});

globalThis.document = {
  title: "Before",
  createElement: () => ({
    getContext: () => ({
      font: "",
      measureText: (text) => ({ width: text.length * 8 }),
    }),
  }),
};

const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(
    path.join(ROOT, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  for (const match of source.matchAll(
    /import\s*{([^;]*?)}\s*from\s*"@rchunk\/([^"]+)";/g,
  )) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const specifier of match[1].split(",")) {
      const name = specifier.trim().split(/\s+as\s+/)[0];
      if (name) names.add(name);
    }
    importedNamesByModule.set(match[2], names);
  }
}

const generic = (chunk, name) => `(...args) => {
  globalThis.__conversationWorkflowTest.calls.push({ chunk: ${JSON.stringify(chunk)}, name: ${JSON.stringify(name)}, args });
  if (${JSON.stringify(name)}.match(/^(initialize|[A-Z]?[a-z]*t)$/)) globalThis.__conversationWorkflowTest.initialized.push(${JSON.stringify(`${chunk}:${name}`)});
  return { chunk: ${JSON.stringify(chunk)}, name: ${JSON.stringify(name)}, args };
}`;

const jsxRuntime = `() => ({
  Fragment: Symbol.for("fragment"),
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
})`;

const reactRuntime = `() => ({
  createElement: (type, props) => ({ type, props }),
  useEffect: effect => { const cleanup = effect(); if (typeof cleanup === "function") globalThis.__conversationWorkflowTest.cleanups.push(cleanup); },
  useLayoutEffect: effect => { const cleanup = effect(); if (typeof cleanup === "function") globalThis.__conversationWorkflowTest.cleanups.push(cleanup); },
  useRef: value => ({ current: value }),
  useState: value => [value, next => globalThis.__conversationWorkflowTest.calls.push({ name: "set-state", args: [next] })],
})`;

const overrides = {
  "app-shared": {
    "$O": `{ ONE_MINUTE: 60000 }`,
    BX: `(signal, parameter, options) => {
      const state = globalThis.__conversationWorkflowTest;
      state.signalReads.push({ signal, parameter, options });
      return signal?.__value ?? { signal, parameter, options };
    }`,
    G2: `messages => messages`,
    HI: `value => String(value).replaceAll("\\\\", "/")`,
    HX: `signal => signal?.__value ?? signal`,
    I3: jsxRuntime,
    IK: `(left, right) => left === right`,
    K3: `(type, handler) => { globalThis.__conversationWorkflowTest.shortcutHandler = handler; }`,
    LX: `() => globalThis.__conversationWorkflowTest.scope`,
    NU: `alias => "remote-ssh-discovered:" + alias`,
    Q3: `{ warning: (...args) => globalThis.__conversationWorkflowTest.calls.push({ name: "warning", args }) }`,
    QX: `(scope, factory) => { const value = { scope, factory }; globalThis.__conversationWorkflowTest.scopedFactories.push(value); return value; }`,
    RI: `(...segments) => segments.length === 0 ? undefined : segments.join("/").replaceAll("//", "/")`,
    VI: `value => String(value).replaceAll("\\\\", "/")`,
    WK: `(...segments) => segments.join("/").replaceAll("//", "/")`,
    _H: `value => { const match = String(value).match(/gitlab\\.com[/:]([^/]+)\\/([^/.]+)(?:\\.git)?$/); return match ? { host: "gitlab.com", owner: match[1], repo: match[2] } : null; }`,
    e6: reactRuntime,
    hq: `server => server === "web"`,
    lZ: `(scope, factory, options, familyOptions) => { const value = { scope, factory, options, familyOptions }; globalThis.__conversationWorkflowTest.scopedFactories.push(value); return value; }`,
    m4: `(...values) => values.filter(Boolean).join(" ")`,
    n4: `() => ({ id: "account" })`,
    o_: `(props) => ({ type: "Tooltip", props })`,
    rZ: `(scope, factory, options) => { const value = { scope, factory, options }; globalThis.__conversationWorkflowTest.scopedFactories.push(value); return value; }`,
    zU: `() => false`,
    zX: `(signal, parameter) => signal?.__value ?? { signal, parameter }`,
  },
  "app-initial": {
    "$4t": `() => {}`,
    "$b": `{ __value: "Route title" }`,
    "$en": `{ id: "conversation-scope" }`,
    Ag: `"background-agent"`,
    Cg: `() => {}`,
    Dg: `() => {}`,
    Dlt: `(props) => ({ type: "AppLogo", props })`,
    Dyt: `{ __value: "local" }`,
    Eg: `(conversationId, terminalId) => conversationId + ":" + terminalId`,
    GEt: `() => ({ data: [] })`,
    Gvt: `(scope, definition, options) => ({ scope, definition, options })`,
    Lin: `conversation => conversation?.historyComplete === true`,
    J9t: `value => String(value).split(".").at(-1)?.toLowerCase()`,
    L9t: `mime => mime === "application/pdf" ? "pdf" : null`,
    PQt: `{ id: "parent-conversation" }`,
    Pin: `conversation => conversation?.messages ?? []`,
    Pnn: `path => Array.isArray(path) ? path.at(-1) : null`,
    ROt: `async () => ({ conversationId: "client-1", serverConversationId: "server-1" })`,
    RQt: `{ __value: [] }`,
    Tg: `"background-terminal"`,
    Thn: `source => source ?? null`,
    Ugn: `() => ({ hydrateBackgroundThreads: async () => {}, loadOlderConversationHistoryPage: async () => {} })`,
    Vst: `"EditablePlanPanel"`,
    X4: `{ id: "queued-items" }`,
    X4t: `value => String(value).includes("drive") ? value : null`,
    Zen: `{ PLAN: "plan", SOURCES: "sources" }`,
    _Qt: `{ __value: [] }`,
    bg: `definition => definition`,
    dun: `(key, fallback) => ({ key, fallback })`,
    fon: `(options, staleTime) => ({ staleTime, ...(options ?? {}) })`,
    gZ: `(props) => ({ type: "ProvidedResourceIcon", props })`,
    h_t: `{ __value: "🚀" }`,
    jXt: `options => ({ fromTarget$: { __value: [], options } })`,
    jg: `conversationId => "agent:" + conversationId`,
    kg: `definition => definition`,
    oct: `{ __value: new Map() }`,
    pnt: `{ workspaceFiles: {} }`,
    sjt: `title => title.toUpperCase()`,
    t0: `(props) => ({ type: "LinkIcon", props })`,
    vat: `14`,
    w$t: `items => items`,
    wg: `definition => definition`,
    xat: `() => ({ setTextMeasurementRef: "measure-ref", textMeasurement: null })`,
    z9t: `url => String(url).includes("docs.google.com") ? "document" : null`,
  },
  "app-primary": {
    Bl: `(props) => ({ type: "ThreadAvatar", props })`,
    Ur: `async () => true`,
    pn: `{ __value: [] }`,
  },
  "webmcp-tool-calls": {
    t: `metadata => Array.isArray(metadata) ? metadata : []`,
  },
  "google-drive-resource-icon": {
    t: `(props) => ({ type: "GoogleDriveResourceIcon", props })`,
  },
  "local-conversation-external-resources": {
    a: `() => true`,
    n: `() => []`,
  },
  "local-conversation-summary-panel-sources-model": {
    i: `() => ({ externalSources: [], webSearchSource: null })`,
    n: `() => []`,
    r: `() => null`,
    t: `() => []`,
  },
  "text-file-storage": {
    r: `async () => ({ content: "saved" })`,
  },
  "editable-plan-tab": {
    n: `() => true`,
    r: `{ __value: null }`,
  },
  layout: {
    n: `() => ({ lineCount: 1 })`,
    r: `(text, font, options) => ({ text, font, options })`,
  },
  "open-target": {
    r: `() => {}`,
  },
};

function mockChunk(name) {
  if (name === "rolldown-runtime") return "export {};";
  const names = importedNamesByModule.get(name) ?? new Set();
  return [...names]
    .map((exportName) => {
      const expression = overrides[name]?.[exportName] ?? generic(name, exportName);
      return `export const ${exportName} = ${expression};`;
    })
    .join("\n");
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "conversation-workflow-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice("@rchunk/".length),
            namespace: "mock",
          }));
          build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
            contents: mockChunk(importPath),
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

const pinBridge = await bundle("thread-pin-shortcut-bridge");
let toggles = 0;
assert.equal(pinBridge.t({ enabled: false, onToggle: () => toggles++ }), null);
state.shortcutHandler();
assert.equal(toggles, 0);
pinBridge.t({ enabled: true, onToggle: () => toggles++ });
state.shortcutHandler();
assert.equal(toggles, 1);

const emoji = await bundle("thread-emoji");
assert.equal(emoji.t({ threadId: "thread-1" }).type, "span");
assert.deepEqual(emoji.t({ threadId: "thread-1" }).props.children, ["🚀", " "]);

const planModel = await bundle("local-conversation-plan-model");
const plan = planModel.t([
  { status: "completed", turnId: "turn-1", items: [{ id: "item", type: "plan", text: "# Build it\nBody" }] },
]);
assert.equal(plan.key, "turn-1");
assert.equal(plan.title, "BUILD IT");
assert.equal(plan.content.includes("Body"), true);
assert.equal(planModel.t([{ status: "inProgress", items: [] }]), null);

const terminal = await bundle("open-local-conversation-background-terminal-tab");
const terminalTab = terminal.n({
  scope: state.scope,
  backgroundTerminal: { command: "npm test", id: "term-1" },
  conversationId: "thread-1",
  fallbackTitle: "Terminal",
});
assert.equal(terminalTab.options.id, "thread-1:term-1");
assert.equal(terminalTab.options.title, "npm test");
assert.equal(terminalTab.options.durableRoute.kind, "background-terminal");

const webMcp = await bundle("local-conversation-webmcp-tools-model");
const calls = webMcp.n([{ items: [{ type: "mcpToolCall", status: "completed", server: "node_repl", result: { _meta: [{ name: "search", id: 1 }, { name: "search", id: 2 }] } }] }]);
assert.equal(calls.length, 2);
assert.equal(calls[0].id, 2);
assert.equal(webMcp.r(calls)[0].calls.length, 2);
assert.equal(webMcp.t("https://example.com/path"), "example.com");
assert.equal(webMcp.t("not a url"), undefined);

const environmentMessages = await bundle("local-environment-workflow-messages");
assert.equal(environmentMessages.n.retry.defaultMessage, "Retry");
assert.equal(environmentMessages.n.setup.id, "threadPage.runAction.environment.setup");

const threadBridge = await bundle("thread-bridge");
state.scope.get = () => [];
assert.equal(threadBridge.t(), null);
assert.equal(typeof threadBridge.n, "function");

const backgroundAgent = await bundle("open-local-conversation-background-agent");
state.scope.get = () => {
  return { activateThreadSummary: () => {}, getConversation: () => null };
};
assert.equal(await backgroundAgent.r(state.scope, { backgroundAgent: { canInteract: true, conversationId: "child", displayName: "Worker" }, hostId: "local" }), null);
assert.equal(typeof backgroundAgent.n, "function");

const artifactOrigin = await bundle("artifact-originating-turn");
state.scope.value = { routeKind: "home" };
assert.deepEqual(artifactOrigin.t(state.scope, { hostId: "local", path: "/tmp/a", threadId: "thread" }), {
  threadId: null,
  turnId: null,
  inputMessageId: null,
  messageId: null,
});
assert.equal(artifactOrigin.r(state.scope, { conversationId: "thread", hostId: "local", path: "/tmp/a" }), undefined);

const conversationStart = await bundle("conversation-start");
const aborted = new AbortController();
aborted.abort();
assert.equal(await conversationStart.n(state.scope, { accountId: "account", prompt: "hello", signal: aborted.signal }), null);
assert.equal(typeof conversationStart.t, "function");

const sourceSignals = await bundle("local-conversation-sources-signals");
sourceSignals.n();
assert.equal(state.scopedFactories.length >= 4, true);
assert.equal(sourceSignals.i != null, true);
assert.equal(sourceSignals.r != null, true);

const useSources = await bundle("use-local-conversation-sources");
assert.equal(typeof useSources.n, "function");
assert.doesNotThrow(() => useSources.t());

const planPanel = await bundle("plan-side-panel");
planPanel.t();
state.scope.value = { routeKind: "local-thread" };
const readonlyPlan = planPanel.r(state.scope, { content: "Plan", conversationId: "thread", key: "turn", title: "Plan" });
assert.equal(readonlyPlan.options.id, "plan");
assert.equal(readonlyPlan.options.props.content, "Plan");

const resourceIcon = await bundle("local-conversation-external-resource-icon");
assert.equal(resourceIcon.r({ id: "drive", name: "Drive", pluginDisplayNames: [] }), "drive");
assert.equal(resourceIcon.r({ id: "other", name: "Other", pluginDisplayNames: [] }), null);
assert.equal(resourceIcon.t({ resource: { activities: ["provided"], url: "https://example.com" } }).props.className, "icon-sm");

const streamRole = await bundle("local-conversation-stream-role-product-event");
assert.doesNotThrow(() => streamRole.i());
assert.doesNotThrow(() => streamRole.n());

const environmentLabels = await bundle("environment-labels");
assert.equal(environmentLabels.t({ configPath: "/tmp/dev.json", type: "error" }), "dev.json");
assert.equal(environmentLabels.t({ configPath: "/tmp/dev.json", type: "success", environment: { name: " Local " } }), "Local");
assert.equal(environmentLabels.t({ configPath: "C:\\env\\prod.json", type: "success", environment: { name: "" } }), "prod.json");

const documentTitle = await bundle("document-title");
assert.equal(documentTitle.t({ title: "Task" }), null);
assert.equal(globalThis.document.title, "Task");

const gitConfig = await bundle("use-git-config-value");
const gitValue = gitConfig.n("/repo", { id: "host" }, "user.email", "local", "test", { enabled: true });
assert.equal(gitValue.parameter.key, "user.email");
assert.equal(gitValue.parameter.lookup.cwd, "/repo");

const submodules = await bundle("use-git-submodule-paths");
submodules.t();
submodules.n("/repo", { id: "host" }, "test", { enabled: true });
assert.equal(state.signalReads.at(-1).parameter.lookup.cwd, "/repo");
assert.equal(state.signalReads.at(-1).parameter.staleTime, 60000);

const images = await bundle("generated-image-output-visibility");
const imageState = images.t({ items: [{ type: "generated-image", status: "in_progress" }, { type: "generated-image", src: "done.png" }], interruptedByThisClient: false, isTurnInProgress: true });
assert.equal(imageState.completedImages.length, 1);
assert.equal(imageState.pendingPlaceholderCount, 1);
assert.equal(images.i(["deck.pptx"]), true);
assert.equal(images.n({ completedImages: imageState.completedImages, endResourcePaths: ["deck.pptx"], pendingPlaceholderCount: 0 }), null);
assert.equal(images.a([{ type: "generated-image", failure: { type: "usageLimitExceeded", limitId: "image_gen" } }]), false);
assert.equal(images.a([{ type: "generated-image" }]), true);

const permissions = await bundle("permissions-mode-visibility");
assert.equal(permissions.r(undefined), true);
assert.equal(permissions.r({ "full-access": false }), false);
assert.deepEqual(permissions.i({ availableAgentModes: ["full-access", "custom", "read-only"], showFullAccessInComposer: false }), ["read-only"]);
assert.deepEqual(permissions.n({ availableAgentModes: ["custom"], visibleAgentModes: ["read-only"] }), ["read-only", "custom"]);
const visibility = permissions.t({ canShowDefaultPermissions: true, canSelectGuardianMode: true, canShowConfigCustom: true, canShowConfigFullAccess: true, canShowGuardianOption: true, selectionAgentModes: ["custom"], visibleAgentModes: ["full-access"] });
assert.equal(visibility.canShowCustom, true);
assert.equal(visibility.canShowFullAccess, true);
assert.equal(visibility.optionCount, 4);

const openTarget = await bundle("open-target");
const known = { canInteract: true, conversationId: "child", displayName: "Worker" };
state.scope.get = () => [known];
assert.deepEqual(openTarget.t(state.scope, "parent", "local", "child"), known);
state.scope.get = () => [];
assert.equal(openTarget.n(state.scope, "parent", "missing"), null);
assert.equal(typeof openTarget.r, "function");

const remoteDraft = await bundle("remote-connection-editor-draft");
const draft = remoteDraft.t();
assert.equal(draft.targetKind, "hostname");
assert.equal(draft.hostId.startsWith("remote-ssh-codex-managed:"), true);
assert.equal(remoteDraft.a({ hostId: "h", displayName: "A", source: "codex-managed", sshAlias: "prod", sshPort: 22 }).targetKind, "alias");
assert.equal(remoteDraft.i({ ...draft, displayName: " Prod ", targetKind: "alias", sshHost: " server " }).source, "discovered");
assert.deepEqual(remoteDraft.n({ draft: { ...draft, displayName: "", sshHost: "", sshPort: "abc" }, existingConnections: [] }), ["displayNameRequired", "sshHostRequired", "sshPortInteger"]);
assert.deepEqual(remoteDraft.n({ draft: { ...draft, displayName: "Prod", sshHost: "host", sshPort: "70000", authMode: "identity", identity: "" }, existingConnections: [] }), ["sshPortRange", "identityRequired"]);

const middleText = await bundle("middle-truncated-text");
const renderedText = middleText.t({ text: "hello", className: "extra" });
assert.equal(renderedText.props.disabled, true);
assert.equal(renderedText.props.children.props.children, "hello");

const creationTarget = await bundle("creation-target-query");
creationTarget.n();
assert.equal(creationTarget.t != null, true);
assert.equal(typeof creationTarget.t.factory, "function");

console.log("conversation workflow foundations assertions passed");
