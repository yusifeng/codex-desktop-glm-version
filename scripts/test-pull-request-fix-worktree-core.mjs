import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__pullRequestFixWorktreeTest = {
  automationCalls: [],
  derivedFamilies: [],
  initialized: [],
  invalidations: [],
  localWrites: [],
  openedTabs: [],
  queryOptions: null,
  rpcCalls: [],
  signalConfig: { worktreesRoot: "/worktrees" },
});

function appSharedMock() {
  return `
    export const e6 = () => ({ createElement: (type, props) => ({ type, props }) });
    export const lw = () => globalThis.__pullRequestFixWorktreeTest.initialized.push("browser-icons");
    export const wy = "AutomationIcon";
    export const IH = value => value instanceof Error ? value.message : String(value);
    export const lY = value => "conversation:" + value;
    export const wL = () => globalThis.__pullRequestFixWorktreeTest.initialized.push("automation-runtime");
    export const zY = value => value != null && typeof value === "object" && typeof value.id === "string";
    export const $3 = () => {};
    export const $O = { INFINITE: Infinity };
    export const BX = () => globalThis.__pullRequestFixWorktreeTest.signalConfig;
    export const EU = { worktreeRoot: { key: "worktreesRoot" } };
    export const FX = () => globalThis.__pullRequestFixWorktreeTest.initialized.push("signals");
    export const QI = () => globalThis.__pullRequestFixWorktreeTest.initialized.push("scope");
    export const SU = values => values == null ? null : ({ worktreesRoot: values.worktreesRoot ?? "", autoCleanupEnabled: values.autoCleanupEnabled ?? false, keepCount: values.keepCount ?? 0 });
    export const TU = { autoCleanupEnabled: { key: "autoCleanupEnabled" }, keepCount: { key: "keepCount" } };
    export const ZI = { id: "app-scope" };
    export const _L = options => { globalThis.__pullRequestFixWorktreeTest.queryOptions = options; return { options }; };
    export const ek = () => globalThis.__pullRequestFixWorktreeTest.initialized.push("query-hooks");
    export const gL = () => globalThis.__pullRequestFixWorktreeTest.initialized.push("react-query");
    export const rZ = (scope, factory) => { const value = { scope, factory }; globalThis.__pullRequestFixWorktreeTest.derivedFamilies.push(value); return value; };
  `;
}

function appInitialMock() {
  return `
    export const FCt = () => globalThis.__pullRequestFixWorktreeTest.initialized.push("automation-model");
    export const Gvt = (scope, definition, options) => { globalThis.__pullRequestFixWorktreeTest.openedTabs.push({ scope, definition, options }); return options.id; };
    export const HZt = () => {}; export const ICt = value => value?.kind === "heartbeat"; export const QCt = { id: "automations" };
    export const Ugn = (scope, account) => ({
      hydrateBackgroundThreads: async ids => { globalThis.__pullRequestFixWorktreeTest.hydrated = { account, ids }; scope.threadReady = true; },
      sendRequest: async (method, parameters) => { globalThis.__pullRequestFixWorktreeTest.remoteWrite = { method, parameters }; if (globalThis.__pullRequestFixWorktreeTest.failRemoteWrite) throw new Error("write failed"); },
    });
    ${["Wgn", "Wvt", "ZCt", "_vt", "dg", "mg", "msn", "GYt", "nun", "$sn", "Con", "Vcn", "_cn", "aun", "qht", "Bfn"].map(name => `export const ${name} = () => globalThis.__pullRequestFixWorktreeTest.initialized.push("${name}");`).join("\n")}
    export const fg = definition => { globalThis.__pullRequestFixWorktreeTest.panelDefinition = definition; return definition; };
    export const gvt = (scope, id) => scope.savedTarget?.[id]; export const hsn = value => value?.kind === "account";
    export const pg = "pull-request-fix"; export const wQt = { id: "conversation-account" }; export const zZt = { id: "thread-exists" };
    export const LYt = value => ({ rule: value }); export const PCt = "## Pull request fix automation:";
    export const Qln = async (event, payload) => globalThis.__pullRequestFixWorktreeTest.automationHandler(event, payload);
    export const zYt = () => ({ intervalHours: 0, intervalMinutes: 0 });
    export const Bcn = (get, setting) => get(setting); export const Gcn = { id: "local-config" };
    export const Gsn = ["host"]; export const Jsn = ["config"]; export const Ksn = ["settings"];
    export const Jht = host => ["root", host]; export const Kht = (...parts) => ["worktrees", ...parts];
    export const Ucn = async (scope, setting, value) => globalThis.__pullRequestFixWorktreeTest.localWrites.push({ scope, setting, value });
    export const _on = host => typeof host === "string" ? host : host.hostId;
    export const lcn = { id: "remote-config" }; export const mcn = { id: "worktrees-query" };
    export const oun = async (client, key) => globalThis.__pullRequestFixWorktreeTest.invalidations.push({ client, key });
    export const won = service => ({ request: async input => { globalThis.__pullRequestFixWorktreeTest.rpcCalls.push({ service, input }); return { worktrees: ["one"] }; } });
  `;
}

function mockChunk(name) {
  if (name === "app-shared") return appSharedMock();
  if (name === "app-initial") return appInitialMock();
  return "export const sideEffect = true;";
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

const panel = await bundle("open-pull-request-fix-automation-panel-core");
panel.t();
assert.equal(typeof state.panelDefinition.open, "function");
assert.equal(typeof state.panelDefinition.restore, "function");
const panelScope = { savedTarget: { "pull-request-auto-fix:thread-2": "bottom" } };
const openedId = panel.n(panelScope, { automationId: "auto-1", targetConversationId: "thread-2", title: "Fix PR" });
assert.equal(openedId, "pull-request-auto-fix:thread-2");
let opened = state.openedTabs.at(-1).options;
assert.equal(opened.target, "bottom");
assert.equal(opened.revealAndFocus, true);
assert.deepEqual(opened.durableRoute, { kind: "pull-request-fix", params: { automationId: "auto-1", targetConversationId: "thread-2" }, payloadVersion: 1 });
assert.equal(opened.icon.type, "AutomationIcon");
panel.n(panelScope, { automationId: "", targetConversationId: "thread-2", title: "Draft" }, { tabId: "custom" });
assert.equal(state.openedTabs.at(-1).options.durableRoute, undefined);
const wrongRouteScope = { value: { routeKind: "settings", conversationId: "thread-1" } };
assert.equal(await panel.r(wrongRouteScope, { automationId: "auto-1", targetConversationId: "thread-2" }, {}), false);
const restoreAccount = { kind: "account", id: "acct" };
const restoreScope = {
  value: { routeKind: "local-thread", conversationId: "thread-1" },
  threadReady: false,
  get(signal, parameter) {
    if (signal.id === "conversation-account") return restoreAccount;
    if (signal.id === "thread-exists") return this.threadReady;
    return null;
  },
  query: { getOrFetch: async () => ({ items: [{ id: "auto-1", kind: "heartbeat", name: "Fix PR", status: "ACTIVE", targetThreadId: "thread-2" }] }) },
};
assert.equal(await panel.r(restoreScope, { automationId: "auto-1", targetConversationId: "thread-2" }, { tabId: "restored" }), true);
assert.deepEqual(state.hydrated.ids, ["thread-2"]);
assert.equal(state.openedTabs.at(-1).options.title, "Fix PR");

const automation = await bundle("pull-request-fix-automation");
automation.n();
const item = { baseBranch: "main", headBranch: "feature", number: 42, repo: "openai/codex", url: "https://github.com/openai/codex/pull/42" };
const preferences = { autoMerge: false, instructions: "Keep the API stable." };
const existing = { id: "auto-1", kind: "heartbeat", model: null, name: "Auto-fix PR #42", prompt: "## Pull request fix automation:\nPull request URL: https://github.com/openai/codex/pull/42\n\nold", reasoningEffort: null, rrule: {}, status: "ACTIVE", targetThreadId: "thread-2" };
assert.equal(automation.t([existing], item.url), existing);
assert.equal(automation.t([existing], "https://missing"), null);
assert.equal(automation.r(existing), true);
assert.equal(automation.r({ ...existing, status: "PAUSED" }), false);
state.automationHandler = async (event, payload) => {
  state.automationCalls.push({ event, payload });
  if (event === "automation-create") return { item: { ...existing, ...payload.params, id: "created", status: payload.params.status ?? "ACTIVE" } };
  if (event === "automation-update") return { item: { ...existing, ...payload.params } };
  if (event === "list-automations") return { items: [existing] };
  throw new Error("unexpected event");
};
const sent = [];
const createdRun = await automation.a({
  automation: null,
  createThread: async () => ({ conversationId: "thread-created", synchronization: { status: "complete" } }),
  finishThreadSetup: async () => { throw new Error("unused"); },
  item,
  preferences,
  repo: null,
  sendMessage: async (threadId, prompt) => sent.push({ threadId, prompt }),
});
assert.equal(createdRun.runError, null);
assert.equal(createdRun.automation.id, "created");
assert.equal(sent[0].threadId, "thread-created");
assert.equal(sent[0].prompt.startsWith("Begin automatically fixing PR #42."), true);
assert.equal(sent[0].prompt.includes("Custom user instructions"), true);
const createCall = state.automationCalls.find(({ event }) => event === "automation-create");
assert.equal(createCall.payload.params.rrule.rule.intervalMinutes, 10);
assert.equal(createCall.payload.params.prompt.includes("This is a heartbeat turn"), true);
existing.prompt = createCall.payload.params.prompt;
const refused = await automation.a({
  automation: { ...existing, status: "PAUSED" },
  createThread: async () => { throw new Error("unused"); },
  finishThreadSetup: async () => ({ status: "refused" }),
  item,
  preferences,
  sendMessage: async () => { throw new Error("must not send"); },
});
assert.equal(refused.runError, "The retained task is not a supported automatic-fix fork");
const paused = await automation.i(existing);
assert.equal(paused.status, "PAUSED");
assert.equal(state.automationCalls.at(-1).event, "automation-update");
const refreshed = await automation.o({ autoMerge: true, instructions: "Merge when green." });
assert.equal(refreshed.length, 1);
assert.equal(refreshed[0].prompt.includes("merge it using"), true);
assert.equal(refreshed[0].prompt.includes("Merge when green."), true);

const worktrees = await bundle("use-codex-worktrees");
worktrees.r();
assert.equal(state.derivedFamilies.length, 1);
const configFactory = state.derivedFamilies[0].factory;
const localConfig = configFactory("local", { get: (signal) => signal.id === "local-config" ? true : signal.key === "worktreesRoot" ? "/local-wt" : signal.key === "autoCleanupEnabled" ? true : 4 });
assert.deepEqual(localConfig, { worktreesRoot: "/local-wt", autoCleanupEnabled: true, keepCount: 4 });
const remoteConfig = configFactory("remote", { get: () => ({ data: { configReadSucceeded: true, config: { desktop: { worktreesRoot: "/remote-wt", autoCleanupEnabled: false, keepCount: 2 } } } }) });
assert.deepEqual(remoteConfig, { worktreesRoot: "/remote-wt", autoCleanupEnabled: false, keepCount: 2 });
await worktrees.i({}, "local", { key: "keepCount" }, 5);
assert.equal(state.localWrites.at(-1).value, 5);
let currentSnapshot;
const previous = { response: { config: { desktop: { worktreesRoot: "/old" } } } };
const snapshot = {
  queryKey: ["remote-snapshot"],
  getOrFetch: async () => previous,
  cancel: async () => { state.snapshotCancelled = true; },
  setData: data => { currentSnapshot = data; },
};
const remoteScope = {
  queryClient: "client",
  query: { snapshot: (signal, parameter) => signal.id === "remote-config" ? snapshot : { queryKey: ["worktrees-data", parameter] } },
  get: () => ({ data: { configWriteTarget: { filePath: "/config.toml" } } }),
};
state.failRemoteWrite = false;
await worktrees.i(remoteScope, "remote", { key: "worktreesRoot" }, "/new");
assert.equal(state.snapshotCancelled, true);
assert.equal(currentSnapshot.response.config.desktop.worktreesRoot, "/new");
assert.equal(state.remoteWrite.method, "config/batchWrite");
assert.equal(state.remoteWrite.parameters.filePath, "/config.toml");
assert.equal(state.invalidations.length, 6);
state.failRemoteWrite = true;
await assert.rejects(() => worktrees.i(remoteScope, "remote", { key: "keepCount" }, 9), /write failed/);
assert.equal(currentSnapshot, previous);
state.failRemoteWrite = false;
worktrees.t();
const queryResult = worktrees.n({ hostId: "local" }, "pull_requests_page", { enabled: true });
assert.equal(queryResult.options.enabled, true);
assert.deepEqual(state.queryOptions.queryKey, ["worktrees", "local", "/worktrees"]);
assert.equal(state.queryOptions.gcTime, 1_800_000);
assert.equal(state.queryOptions.staleTime, Infinity);
const rpcResult = await state.queryOptions.queryFn({ signal: new AbortController().signal });
assert.deepEqual(rpcResult, { worktrees: ["one"] });
assert.equal(state.rpcCalls.at(-1).input.params.operationSource, "pull_requests_page");
state.signalConfig = null;
worktrees.n("remote", "home_page", { enabled: true });
assert.equal(state.queryOptions.enabled, false);

console.log("pull request fix and worktree core assertions passed");
