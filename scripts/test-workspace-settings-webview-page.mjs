import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  ROOT,
  "src/renderer/workspace-settings-webview-page/index.ts",
);
const source = fs.readFileSync(sourcePath, "utf8");
const state = {
  account: { id: "workspace-1", plan_type: "team", structure: "workspace" },
  accountLoading: false,
  analytics: [],
  auth: { authMethod: "chatgpt", isLoading: false, userId: "user-1" },
  authOrigin: {
    data: { chatGptDesktopAuthOrigin: "https://chatgpt.com" },
    isLoading: false,
  },
  dynamicOverride: "  Custom-Route  ",
  experimentEnabled: true,
  externalLinks: [],
  familyInitial: null,
  initialized: 0,
  lastPartition: null,
  location: {
    pathname: "/workspace-settings/web",
    search: "?accountId=workspace-1",
  },
  messages: [],
  releasedAccounts: [],
  scopeStates: new Map(),
  surfaceProps: null,
  timers: [],
  transitionPending: false,
  unsupported: false,
  workspaceId: "workspace-1",
};

const nodes = (type, props = {}) => ({ type, props });
let hooks = [];
let hookIndex = 0;
let queuedEffects = [];
const sameDependencies = (left, right) =>
  left != null &&
  right != null &&
  left.length === right.length &&
  left.every((value, index) => Object.is(value, right[index]));
function registerEffect(effect, dependencies) {
  const index = hookIndex++;
  const previous = hooks[index];
  if (
    previous == null ||
    !sameDependencies(previous.dependencies, dependencies)
  )
    queuedEffects.push(() => {
      previous?.cleanup?.();
      const cleanup = effect();
      hooks[index] = { dependencies, cleanup };
    });
}
const React = {
  __clear() {
    for (const hook of hooks) hook?.cleanup?.();
    hooks = [];
    hookIndex = 0;
    queuedEffects = [];
  },
  __render(component) {
    hookIndex = 0;
    queuedEffects = [];
    const view = component();
    const effects = queuedEffects;
    queuedEffects = [];
    for (const effect of effects) effect();
    return view;
  },
  useEffect: registerEffect,
  useLayoutEffect: registerEffect,
  useRef(initialValue) {
    const index = hookIndex++;
    if (hooks[index] == null) hooks[index] = { current: initialValue };
    return hooks[index];
  },
  useState(initialValue) {
    const index = hookIndex++;
    if (hooks[index] == null)
      hooks[index] =
        typeof initialValue === "function" ? initialValue() : initialValue;
    return [
      hooks[index],
      (next) => {
        hooks[index] = typeof next === "function" ? next(hooks[index]) : next;
      },
    ];
  },
};
const jsx = {
  Fragment: Symbol("fragment"),
  jsx(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
};
const scope = {
  get(_family, partition) {
    state.lastPartition = partition;
    if (!state.scopeStates.has(partition))
      state.scopeStates.set(
        partition,
        state.familyInitial?.(partition) ?? {
          accountId: null,
          failedAttemptCount: 0,
          generation: 0,
          loadState: "loading",
          userId: undefined,
        },
      );
    return state.scopeStates.get(partition);
  },
  set(_family, partition, value) {
    state.lastPartition = partition;
    state.scopeStates.set(partition, value);
  },
  query: {
    invalidate(_family, accountId) {
      state.invalidatedAccount = accountId;
    },
  },
  queryClient: {
    async cancelQueries(options) {
      state.cancelledQuery = options;
    },
  },
};
let nextTimerId = 1;
globalThis.window = {
  clearTimeout(id) {
    const timer = state.timers.find((item) => item.id === id);
    if (timer) timer.cleared = true;
  },
  setTimeout(callback, delay) {
    const id = nextTimerId++;
    state.timers.push({ callback, cleared: false, delay, id });
    return id;
  },
};
globalThis.__workspaceSettingsWebview = { React, jsx, nodes, scope, state };

const initializer =
  "()=>{globalThis.__workspaceSettingsWebview.state.initialized+=1}";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__workspaceSettingsWebview;",
    `export const $3=${initializer};`,
    "export const BX=(family,partition)=>r.scope.get(family,partition);",
    `export const FX=${initializer};`,
    "export const G3={dispatchMessage:(type,payload)=>r.state.messages.push([type,payload])};",
    "export const H4=()=>({safeParse:value=>typeof value?.accountId==='string'&&value.accountId.length>0?{success:true,data:{accountId:value.accountId}}:{success:false}});",
    "export const HX=()=>r.state.authOrigin;",
    "export const I3=()=>r.jsx;",
    `export const K2=${initializer};`,
    "export const LX=()=>r.scope;",
    "export const NX='https://chatgpt.com/codex';",
    `export const QI=${initializer};`,
    `export const W3=${initializer};`,
    "export const Y2=props=>r.nodes('message',props);",
    "export const Yh=props=>r.nodes('button',props);",
    "export const ZI={};",
    `export const Zh=${initializer};`,
    "export const e6=()=>r.React;",
    `export const g4=${initializer};`,
    `export const h4=${initializer};`,
    "export const m4=(...values)=>values.filter(Boolean).join(' ');",
    "export const oZ=(_scope,initial)=>{r.state.familyInitial=initial;return Symbol('family')};",
    "export const q4=()=>({min:()=>({})});",
    `export const wL=${initializer};`,
    "export const yG='persist:workspace-settings-';",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__workspaceSettingsWebview;",
    "export const A9=()=>false;",
    `export const Dft=${initializer};`,
    "export const Dln={};",
    `export const M6t=${initializer};`,
    "export const MTt='https://chatgpt.com/admin/settings?desktop=true';",
    "export const N6t=()=>r.state.auth;",
    "export const Oft=input=>r.state.externalLinks.push(input);",
    `export const Oln=${initializer};`,
    "export const PTt='https://chatgpt.com/admin';",
    `export const Qgn=${initializer};`,
    `export const Udn=${initializer};`,
    "export const Wdn=()=>r.state.unsupported;",
    "export const Ygn=props=>r.nodes('navigate',props);",
    "export const c$t={};",
    "export const d_n=()=>[new URLSearchParams(r.state.location.search)];",
    "export const dfn=()=>r.state.transitionPending;",
    `export const eEt=${initializer};`,
    `export const gT=${initializer};`,
    "export const i_n=()=>r.state.location;",
    "export const idn=accountId=>{r.state.releasedAccounts.push(accountId)};",
    `export const ifn=${initializer};`,
    `export const j9=${initializer};`,
    `export const l$t=${initializer};`,
    "export const lfn=()=>({getContext:()=>({user:{customIDs:{workspace_id:r.state.workspaceId}}}),getDynamicConfig:()=>({get:()=>r.state.dynamicOverride})});",
    `export const oS=${initializer};`,
    `export const rdn=${initializer};`,
    `export const rht=${initializer};`,
    "export const sS=(_scope,event)=>r.state.analytics.push(event);",
    "export const ufn=()=>({get:()=>r.state.experimentEnabled});",
    "export const uht=()=>({data:r.state.account,isLoading:r.state.accountLoading});",
  ].join("\n"),
  "compact-empty-state": [
    "const r=globalThis.__workspaceSettingsWebview;",
    `export const n=${initializer};`,
    "export const t=props=>r.nodes('compact-empty-state',props);",
  ].join("\n"),
  surface: [
    "const runtime=globalThis.__workspaceSettingsWebview;",
    `export const n=${initializer};`,
    "export const t=props=>{runtime.state.surfaceProps=props;return runtime.nodes('webview-surface',props)};",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "workspace-settings-webview-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: moduleName }) => ({
            contents: mocks[moduleName] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);

assert.deepEqual(Object.keys(module).sort(), [
  "WorkspaceSettingsWebviewHost",
  "WorkspaceSettingsWebviewPage",
]);
assert.equal(state.initialized, 29);
const imports = [
  ...source.matchAll(
    /(?:import \"@rchunk\/([^\"]+)\"|from \"@rchunk\/([^\"]+)\")/g,
  ),
].map((match) => match[1] ?? match[2]);
assert.deepEqual(imports, [
  "rolldown-runtime",
  "app-shared",
  "app-initial",
  "compact-empty-state",
  "surface",
]);
assert.equal(/\bany\b/.test(source), false);
assert.equal(
  /\b(?:appSharedChunk|appInitialChunk|compactEmptyStateChunk|surfaceChunk)\s*\./.test(
    source,
  ),
  false,
);

function reset() {
  React.__clear();
  state.account = {
    id: "workspace-1",
    plan_type: "team",
    structure: "workspace",
  };
  state.accountLoading = false;
  state.analytics.length = 0;
  state.auth = { authMethod: "chatgpt", isLoading: false, userId: "user-1" };
  state.authOrigin = {
    data: { chatGptDesktopAuthOrigin: "https://chatgpt.com" },
    isLoading: false,
  };
  state.dynamicOverride = "  Custom-Route  ";
  state.experimentEnabled = true;
  state.externalLinks.length = 0;
  state.lastPartition = null;
  state.location = {
    pathname: "/workspace-settings/web",
    search: "?accountId=workspace-1",
  };
  state.messages.length = 0;
  state.releasedAccounts.length = 0;
  state.scopeStates.clear();
  state.surfaceProps = null;
  state.timers.length = 0;
  state.transitionPending = false;
  state.unsupported = false;
  state.workspaceId = "workspace-1";
}
function renderHost() {
  return React.__render(module.WorkspaceSettingsWebviewHost);
}
function renderPage() {
  return React.__render(module.WorkspaceSettingsWebviewPage);
}
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, output);
    return output;
  }
  output.push(value);
  walk(value.props?.children, output);
  walk(value.props?.actions, output);
  return output;
}
function find(value, type) {
  return walk(value).find((item) => item.type === type);
}
function buttons(value) {
  return walk(value).filter((item) => item.type === "button");
}
function textContent(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  if (value.type === "message") return String(value.props.defaultMessage ?? "");
  return textContent(value.props?.children);
}

reset();
state.location.search = "?other=value";
let view = renderPage();
assert.equal(view.type, "navigate");
assert.equal(view.props.to, "/");
assert.equal(view.props.replace, true);
state.location.search = "?accountId=workspace-1";
assert.equal(renderPage(), null);

reset();
view = renderHost();
assert.equal(view.type, "div");
assert.equal(view.props["aria-hidden"], false);
assert.equal(view.props.inert, false);
assert.equal(
  view.props.className.includes("fixed inset-x-0 bottom-0 z-30"),
  true,
);
assert.equal(find(view, "webview-surface").type, "webview-surface");
assert.equal(
  state.messages.at(-1)[0],
  "workspace-settings-webview-presentation-changed",
);
assert.equal(state.messages.at(-1)[1].presented, true);
assert.equal(
  state.scopeStates.get(state.lastPartition).accountId,
  "workspace-1",
);
assert.equal(state.scopeStates.get(state.lastPartition).generation, 1);
view = renderHost();
const initialSrc = new URL(state.surfaceProps.src);
assert.equal(initialSrc.protocol, "about:");
assert.equal(
  initialSrc.searchParams.get("toUrl"),
  "/admin/settings?desktop=true",
);
assert.equal(initialSrc.searchParams.get("accountId"), "workspace-1");
assert.equal(initialSrc.searchParams.get("routingOverride"), "custom-route");
assert.equal(
  state.surfaceProps.partition.startsWith("persist:workspace-settings-"),
  true,
);

reset();
state.workspaceId = "workspace-2";
view = renderHost();
assert.equal(view.type, "navigate");
assert.equal(view.props.to, "/");
reset();
state.auth.isLoading = true;
assert.equal(renderHost(), null);
reset();
state.unsupported = true;
assert.equal(renderHost().type, "navigate");
reset();
state.experimentEnabled = false;
assert.equal(renderHost().type, "navigate");
reset();
state.account.plan_type = "quorum";
assert.equal(renderHost().type, "navigate");

class FakeWebview {
  constructor() {
    this.listeners = new Map();
    this.loading = false;
    this.url = "https://chatgpt.com/admin";
  }
  addEventListener(name, listener) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(listener);
  }
  emit(name, event = {}) {
    for (const listener of this.listeners.get(name) ?? []) listener(event);
  }
  getURL() {
    return this.url;
  }
  isLoading() {
    return this.loading;
  }
  removeEventListener(name, listener) {
    this.listeners.get(name)?.delete(listener);
  }
}

reset();
renderHost();
renderHost();
const webview = new FakeWebview();
state.surfaceProps.webviewRef(webview);
renderHost();
let stored = state.scopeStates.get(state.lastPartition);
assert.equal(stored.loadState, "ready");
assert.equal(stored.failedAttemptCount, 0);
assert.equal(state.analytics.at(-1).action, "webview_ready");
assert.equal(state.surfaceProps.isLoading, true);
view = renderHost();
assert.equal(state.surfaceProps.isLoading, false);

webview.loading = true;
webview.emit("did-start-navigation", { isMainFrame: true });
stored = state.scopeStates.get(state.lastPartition);
assert.equal(stored.loadState, "loading");
webview.loading = false;
webview.url = "https://chatgpt.com/unexpected";
webview.emit("did-finish-load");
stored = state.scopeStates.get(state.lastPartition);
assert.equal(stored.loadState, "failed");
assert.equal(stored.failedAttemptCount, 1);
assert.equal(
  state.analytics.at(-1).failure.failureReason,
  "unexpected_navigation",
);
assert.equal(state.analytics.at(-1).failure.navigationPhase, "other");

state.scopeStates.set(state.lastPartition, {
  accountId: "workspace-1",
  failedAttemptCount: 0,
  generation: stored.generation,
  loadState: "loading",
  userId: "user-1",
});
webview.url = "https://chatgpt.com/checkout/session";
webview.emit("did-fail-load", {
  errorCode: -105,
  isMainFrame: true,
  validatedURL: webview.url,
});
stored = state.scopeStates.get(state.lastPartition);
assert.equal(stored.loadState, "failed");
assert.equal(state.analytics.at(-1).failure.failureReason, "navigation_failed");
assert.equal(state.analytics.at(-1).failure.navigationPhase, "checkout");
assert.equal(state.analytics.at(-1).failure.navigationErrorCode, -105);

reset();
renderHost();
renderHost();
const partition = state.lastPartition;
state.scopeStates.set(partition, {
  accountId: "workspace-1",
  failedAttemptCount: 2,
  generation: 1,
  loadState: "failed",
  userId: "user-1",
});
renderHost();
const automaticRetry = state.timers.find(
  (timer) => timer.delay === 2000 && !timer.cleared,
);
assert.equal(automaticRetry != null, true);
automaticRetry.callback();
stored = state.scopeStates.get(partition);
assert.equal(stored.loadState, "loading");
assert.equal(stored.generation, 2);
assert.equal(state.analytics.at(-1).action, "automatic_retry");

reset();
renderHost();
renderHost();
const failedPartition = state.lastPartition;
state.scopeStates.set(failedPartition, {
  accountId: "workspace-1",
  failedAttemptCount: 5,
  generation: 1,
  loadState: "failed",
  userId: "user-1",
});
view = renderHost();
const emptyState = state.surfaceProps.loadingContent;
assert.equal(emptyState.type, "compact-empty-state");
assert.equal(
  textContent(emptyState.props.title),
  "Couldn't load workspace settings",
);
const [retryButton, browserButton] = buttons(emptyState);
assert.equal(textContent(retryButton), "Try again");
retryButton.props.onClick();
stored = state.scopeStates.get(failedPartition);
assert.equal(stored.failedAttemptCount, 0);
assert.equal(stored.generation, 2);
assert.equal(stored.loadState, "loading");
assert.equal(state.analytics.at(-1).action, "manual_retry");
state.scopeStates.set(failedPartition, {
  accountId: "workspace-1",
  failedAttemptCount: 5,
  generation: 2,
  loadState: "failed",
  userId: "user-1",
});
view = renderHost();
const browserFallback = buttons(state.surfaceProps.loadingContent)[1];
browserFallback.props.onClick({ type: "click" });
assert.equal(state.analytics.at(-1).action, "browser_fallback_requested");
assert.equal(state.externalLinks.at(-1).initiator, "open_in_browser_bridge");
assert.equal(
  new URL(state.externalLinks.at(-1).href).searchParams.get("account_id"),
  "workspace-1",
);

reset();
renderHost();
renderHost();
const timeoutWebview = new FakeWebview();
timeoutWebview.url = "about:blank";
timeoutWebview.loading = true;
state.surfaceProps.webviewRef(timeoutWebview);
renderHost();
const loadTimeout = state.timers.find(
  (timer) => timer.delay === 30000 && !timer.cleared,
);
assert.equal(loadTimeout != null, true);
loadTimeout.callback();
stored = state.scopeStates.get(state.lastPartition);
assert.equal(stored.loadState, "failed");
assert.equal(state.analytics.at(-1).failure.failureReason, "load_timeout");
assert.equal(state.analytics.at(-1).failure.navigationPhase, "startup");

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(
  assertionCount + " workspace settings webview page assertions passed",
);
