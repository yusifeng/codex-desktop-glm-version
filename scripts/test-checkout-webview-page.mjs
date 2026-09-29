import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  ROOT,
  "src/renderer/checkout-webview-page/index.ts",
);
const source = fs.readFileSync(sourcePath, "utf8");
const state = {
  account: { id: "personal", plan_type: "plus", structure: "personal" },
  accountLoading: false,
  auth: { authMethod: "chatgpt", isLoading: false, userId: "user-1" },
  authOrigin: {
    data: { chatGptDesktopAuthOrigin: "https://chatgpt.com" },
    isLoading: false,
  },
  checkoutExperiment: true,
  checkoutUrl: "https://chatgpt.com/pricing/?plan=plus",
  creditEnabled: true,
  creditExperiment: true,
  familyInitial: null,
  initialized: 0,
  lastPartition: null,
  location: { pathname: "/", search: "" },
  messages: [],
  scopeStates: new Map(),
  statsigLoading: false,
  surfaceProps: null,
  timers: [],
  unsupported: false,
};
const node = (type, props = {}) => ({ type, props });
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
        state.familyInitial?.() ?? {
          generation: 0,
          loadState: "loading",
          retryCount: 0,
          search: null,
          state: "available",
          userId: undefined,
        },
      );
    return state.scopeStates.get(partition);
  },
  set(_family, partition, value) {
    state.lastPartition = partition;
    state.scopeStates.set(partition, value);
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
globalThis.__checkoutWebview = { React, jsx, node, scope, state };
const initializer = "()=>{globalThis.__checkoutWebview.state.initialized+=1}";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__checkoutWebview;",
    `export const $3=${initializer};`,
    "export const BX=(family,partition)=>r.scope.get(family,partition);",
    "export const CG='persist:checkout-pricing-';",
    `export const FX=${initializer};`,
    "export const G3={dispatchMessage:(type,payload)=>r.state.messages.push([type,payload])};",
    "export const H4=()=>({safeParse:value=>{if(typeof value?.url!=='string')return {success:false};try{new URL(value.url)}catch{return {success:false}};if(value.accountId!=null&&(typeof value.accountId!=='string'||value.accountId.length===0))return {success:false};if(value.currentPlan!=null&&!['free','go','plus','prolite','pro'].includes(value.currentPlan))return {success:false};return {success:true,data:value}}});",
    "export const HX=()=>r.state.authOrigin;",
    "export const I3=()=>r.jsx;",
    "export const LX=()=>r.scope;",
    "export const NX='https://chatgpt.com/codex';",
    "export const Q4=()=>({});",
    `export const QI=${initializer};`,
    "export const SG='persist:checkout-credit-';",
    `export const W3=${initializer};`,
    "export const ZI={};",
    "export const __=handler=>handler;",
    "export const e6=()=>r.React;",
    `export const g4=${initializer};`,
    `export const g_=${initializer};`,
    `export const h4=${initializer};`,
    "export const m4=(...values)=>values.filter(Boolean).join(' ');",
    "export const oZ=(_scope,initial)=>{r.state.familyInitial=initial;return Symbol('pricing-state')};",
    "export const q4=()=>({min:()=>({optional:()=>({})})});",
    `export const wL=${initializer};`,
    "export const x4=()=>({optional:()=>({})});",
    "export const xG='persist:checkout-default';",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__checkoutWebview;",
    `export const II=${initializer};`,
    "export const Kzt=()=>r.state.creditEnabled;",
    "export const LI=()=>()=>r.state.checkoutUrl;",
    `export const M6t=${initializer};`,
    `export const MP=${initializer};`,
    "export const N6t=()=>r.state.auth;",
    `export const Qgn=${initializer};`,
    `export const Udn=${initializer};`,
    `export const Vzt=${initializer};`,
    "export const Wdn=()=>r.state.unsupported;",
    "export const Ygn=props=>r.node('navigate',props);",
    "export const c$t={};",
    "export const d_n=()=>[new URLSearchParams(r.state.location.search)];",
    "export const dfn=()=>r.state.statsigLoading;",
    `export const h0=${initializer};`,
    "export const i_n=()=>r.state.location;",
    `export const ifn=${initializer};`,
    "export const jP={};",
    `export const l$t=${initializer};`,
    "export const lfn=()=>({});",
    "export const rfn=()=>({get:key=>key==='use_embedded_checkout'?r.state.checkoutExperiment:r.state.creditExperiment});",
    `export const rht=${initializer};`,
    "export const uht=()=>({data:r.state.account,isLoading:r.state.accountLoading});",
  ].join("\n"),
  surface: [
    "const r=globalThis.__checkoutWebview;",
    `export const n=${initializer};`,
    "export const t=props=>{r.state.surfaceProps=props;return r.node('webview-surface',props)};",
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
      name: "checkout-webview-mocks",
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
  "CheckoutCreditWebviewHost",
  "CheckoutPricingWebviewHost",
  "CheckoutWebviewPage",
]);
assert.equal(state.initialized, 19);
const imports = [
  ...source.matchAll(
    /(?:import \"@rchunk\/([^\"]+)\"|from \"@rchunk\/([^\"]+)\")/g,
  ),
].map((match) => match[1] ?? match[2]);
assert.deepEqual(imports, [
  "rolldown-runtime",
  "app-shared",
  "app-initial",
  "surface",
]);
assert.equal(/\bany\b/.test(source), false);
assert.equal(
  /\b(?:appSharedChunk|appInitialChunk|surfaceChunk)\s*\./.test(source),
  false,
);

function reset() {
  React.__clear();
  state.account = { id: "personal", plan_type: "plus", structure: "personal" };
  state.accountLoading = false;
  state.auth = { authMethod: "chatgpt", isLoading: false, userId: "user-1" };
  state.authOrigin = {
    data: { chatGptDesktopAuthOrigin: "https://chatgpt.com" },
    isLoading: false,
  };
  state.checkoutExperiment = true;
  state.checkoutUrl = "https://chatgpt.com/pricing/?plan=plus";
  state.creditEnabled = true;
  state.creditExperiment = true;
  state.lastPartition = null;
  state.location = { pathname: "/", search: "" };
  state.messages.length = 0;
  state.scopeStates.clear();
  state.statsigLoading = false;
  state.surfaceProps = null;
  state.timers.length = 0;
  state.unsupported = false;
}
function render(component) {
  return React.__render(component);
}
function makeSearch(url, extras = {}) {
  return new URLSearchParams({ url, ...extras }).toString();
}

reset();
state.location.search =
  "?" +
  makeSearch("https://chatgpt.com/pricing/?plan=pro", {
    accountId: "personal",
  });
assert.equal(render(module.CheckoutWebviewPage), null);
state.location.search =
  "?" +
  makeSearch("https://chatgpt.com/codex/purchase/credits", {
    accountId: "personal",
  });
assert.equal(render(module.CheckoutWebviewPage), null);
state.location.search = "?url=not-a-url";
let view = render(module.CheckoutWebviewPage);
assert.equal(view.type, "navigate");
assert.equal(view.props.to, "/pricing-plan");
state.location.search = "?" + makeSearch("https://example.com/not-allowed");
view = render(module.CheckoutWebviewPage);
assert.equal(view.type, "navigate");
state.location.search =
  "?" +
  makeSearch("https://chatgpt.com/checkout/session-1", {
    accountId: "personal",
    currentPlan: "plus",
  });
view = render(module.CheckoutWebviewPage);
assert.equal(view.type, "webview-surface");
let src = new URL(view.props.src);
assert.equal(src.searchParams.get("toUrl"), "/checkout/session-1");
assert.equal(src.searchParams.get("accountId"), "personal");
assert.equal(src.searchParams.get("currentPlan"), "plus");

reset();
assert.equal(render(module.CheckoutPricingWebviewHost), null);
view = render(module.CheckoutPricingWebviewHost);
assert.equal(view.type, "div");
assert.equal(view.props["aria-hidden"], true);
assert.equal(view.props.className.includes("invisible"), true);
src = new URL(state.surfaceProps.src);
assert.equal(src.searchParams.get("toUrl").startsWith("/pricing/"), true);
assert.equal(src.searchParams.get("accountId"), "personal");
assert.equal(src.searchParams.get("currentPlan"), "plus");
const cachedSearch = state.scopeStates.get(state.lastPartition).search;
assert.equal(
  new URL(new URLSearchParams(cachedSearch).get("url")).searchParams.get(
    "source",
  ),
  "codex-embedded-checkout",
);

state.location = { pathname: "/checkout/web", search: "?" + cachedSearch };
view = render(module.CheckoutPricingWebviewHost);
assert.equal(view.props["aria-hidden"], false);
assert.equal(state.messages.at(-1)[0], "checkout-webview-presentation-changed");
assert.equal(state.messages.at(-1)[1].url.includes("/pricing/"), true);
assert.equal(state.scopeStates.get(state.lastPartition).state, "presented");

const differentSearch = makeSearch("https://chatgpt.com/pricing/?plan=pro", {
  accountId: "personal",
  currentPlan: "pro",
});
state.location = { pathname: "/checkout/web", search: "?" + differentSearch };
view = render(module.CheckoutPricingWebviewHost);
assert.equal(view.props.className, "fixed inset-0 z-30");
assert.equal(
  new URL(state.surfaceProps.src).searchParams.get("currentPlan"),
  "pro",
);

state.location = {
  pathname: "/checkout/web",
  search: "?" + makeSearch("https://chatgpt.com/checkout/session-2"),
};
render(module.CheckoutPricingWebviewHost);
assert.equal(state.scopeStates.get(state.lastPartition).state, "discarded");
assert.equal(state.scopeStates.get(state.lastPartition).search, null);
assert.equal(render(module.CheckoutPricingWebviewHost), null);

reset();
view = render(module.CheckoutCreditWebviewHost);
assert.equal(view.type, "div");
assert.equal(view.props["aria-hidden"], true);
src = new URL(state.surfaceProps.src);
assert.equal(
  src.searchParams.get("toUrl").startsWith("/codex/purchase/credits"),
  true,
);
assert.equal(src.searchParams.get("prewarm"), "true");
reset();
state.creditEnabled = false;
assert.equal(render(module.CheckoutCreditWebviewHost), null);
reset();
const creditSearch = makeSearch(
  "https://chatgpt.com/codex/purchase/credits?amount=100",
  { accountId: "personal" },
);
state.location = { pathname: "/checkout/web", search: "?" + creditSearch };
view = render(module.CheckoutCreditWebviewHost);
assert.equal(view.props["aria-hidden"], false);
assert.equal(new URL(state.surfaceProps.src).searchParams.get("prewarm"), null);
assert.equal(
  state.messages.at(-1)[1].url.includes("/codex/purchase/credits"),
  true,
);

class FakeWebview {
  constructor(url) {
    this.listeners = new Map();
    this.loading = false;
    this.reloads = 0;
    this.url = url;
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
  reloadIgnoringCache() {
    this.reloads += 1;
  }
  removeEventListener(name, listener) {
    this.listeners.get(name)?.delete(listener);
  }
}

reset();
state.location.search =
  "?" + makeSearch("https://chatgpt.com/checkout/session-1");
render(module.CheckoutWebviewPage);
const checkoutWebview = new FakeWebview(
  "https://chatgpt.com/checkout/session-1",
);
state.surfaceProps.webviewRef(checkoutWebview);
render(module.CheckoutWebviewPage);
render(module.CheckoutWebviewPage);
assert.equal(state.surfaceProps.isLoading, false);

reset();
render(module.CheckoutPricingWebviewHost);
render(module.CheckoutPricingWebviewHost);
const pricingWebview = new FakeWebview(
  "https://chatgpt.com/pricing/?plan=plus",
);
state.surfaceProps.webviewRef(pricingWebview);
render(module.CheckoutPricingWebviewHost);
pricingWebview.emit("did-fail-load", {
  errorCode: -105,
  isMainFrame: true,
  validatedURL: pricingWebview.url,
});
let stored = state.scopeStates.get(state.lastPartition);
assert.equal(stored.loadState, "failed");
const retryTimer = state.timers.find(
  (timer) => timer.delay === 1000 && !timer.cleared,
);
assert.equal(retryTimer != null, true);
retryTimer.callback();
stored = state.scopeStates.get(state.lastPartition);
assert.equal(stored.loadState, "loading");
assert.equal(stored.retryCount, 1);
assert.equal(stored.generation, 1);

reset();
render(module.CheckoutPricingWebviewHost);
render(module.CheckoutPricingWebviewHost);
const refreshWebview = new FakeWebview(
  "https://chatgpt.com/checkout/unexpected",
);
state.surfaceProps.webviewRef(refreshWebview);
render(module.CheckoutPricingWebviewHost);
const refreshTimer = state.timers.find(
  (timer) => timer.delay === 5000 && !timer.cleared,
);
assert.equal(refreshTimer != null, true);
refreshTimer.callback();
assert.equal(refreshWebview.reloads, 1);

reset();
state.location = { pathname: "/checkout/web", search: "?" + creditSearch };
render(module.CheckoutCreditWebviewHost);
const creditWebview = new FakeWebview(
  "https://chatgpt.com/codex/purchase/credits?amount=100",
);
state.surfaceProps.webviewRef(creditWebview);
render(module.CheckoutCreditWebviewHost);
creditWebview.emit("did-fail-load", {
  errorCode: -105,
  isMainFrame: true,
  validatedURL: creditWebview.url,
});
const creditRetry = state.timers.find(
  (timer) => timer.delay === 1000 && !timer.cleared,
);
assert.equal(creditRetry != null, true);
creditRetry.callback();
assert.equal(creditWebview.reloads, 1);

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " checkout webview page assertions passed");
