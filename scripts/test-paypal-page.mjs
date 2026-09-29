import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/paypal-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let assertions = 0;
const equal = (actual, expected) => {
  assert.equal(actual, expected);
  assertions += 1;
};
const deepEqual = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

let hookIndex = 0;
const hookState = [];
const state = {
  account: { accountId: null, userId: null },
  accountResponse: { accounts: {} },
  apiCalls: [],
  checkoutRequest: null,
  couponResponse: { state: "eligible", coupon: "coupon-inferred" },
  createSessionCalls: [],
  dark: false,
  experimentEnabled: false,
  initialized: 0,
  location: {
    pathname: "/paypal",
    search: "?login_hint=user%40example.com&source=campaign",
    hash: "#return",
    state: null,
    key: "route-1",
  },
  promotion: { id: "promo-inferred" },
  query: { data: undefined, error: null, isPending: true, refetches: 0 },
  queryOptions: null,
  session: {
    tag: "custom_checkout_session",
    processor_entity: "paypal",
    checkout_session_id: "session-1",
  },
};
const React = {
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hookState))
      hookState[index] = typeof initial === "function" ? initial() : initial;
    return [
      hookState[index],
      (next) => {
        hookState[index] = next;
      },
    ];
  },
};
const jsx = {
  Fragment: "Fragment",
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
Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  value: { randomUUID: () => "attempt-1" },
});
globalThis.window = { location: { origin: "https://chatgpt.com" } };
globalThis.__paypalPage = { React, jsx, state };

const initialize = "globalThis.__paypalPage.state.initialized+=1";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__paypalPage;const s=r.state;",
    `export const $3=()=>{${initialize}};export const gL=()=>{${initialize}};export const wL=()=>{${initialize}};export const dg=()=>{${initialize}};`,
    "export const I3=()=>r.jsx;export const e6=()=>r.React;export const fg=()=>s.dark;export const vW='X-Account-ID';",
    "export const _L=options=>{s.queryOptions=options;return {...s.query,refetch:()=>{s.query.refetches+=1}}};",
  ].join("\n"),
  "app-initial": [
    "const s=globalThis.__paypalPage.state;",
    `export const M6t=()=>{${initialize}};export const Qgn=()=>{${initialize}};export const cJt=()=>{${initialize}};export const ifn=()=>{${initialize}};export const v0=()=>{${initialize}};`,
    "export const N6t=()=>s.account;export const i_n=()=>s.location;export const lfn=()=>({kind:'statsig'});",
    "export const _0=({search})=>({pathname:'/pricing',search,hash:''});export const r_n=route=>route.pathname+route.search;",
    "export const Ygn=props=>({type:'navigate',props});export const rfn=()=>({get:()=>s.experimentEnabled});",
    "export const rJt={safeGet:async(path,options)=>{s.apiCalls.push({path,options});return path.includes('check_coupon')?s.couponResponse:s.accountResponse}};",
  ].join("\n"),
  "pricing-promotions": [
    "const s=globalThis.__paypalPage.state;",
    `export const f=()=>{${initialize}};export const a=()=>s.promotion;`,
  ].join("\n"),
  "checkout-policy": [
    "const s=globalThis.__paypalPage.state;",
    `export const S=()=>{${initialize}};export const _=input=>(s.checkoutRequest={kind:'paypal',...input});`,
  ].join("\n"),
  "checkout-confirm-latency": [
    "const s=globalThis.__paypalPage.state;",
    `export const m=()=>{${initialize}};export const p=props=>({type:'preparation',props});`,
  ].join("\n"),
  "checkout-page-core": [
    "const s=globalThis.__paypalPage.state;",
    `export const r=()=>{${initialize}};export const n=props=>({type:'hosted',props});`,
  ].join("\n"),
  "create-session": [
    "const s=globalThis.__paypalPage.state;",
    `export const n=()=>{${initialize}};export const t=async input=>{s.createSessionCalls.push(input);return s.session};`,
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
      name: "paypal-page-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: module }) => ({
            contents: mocks[module] ?? "export {};",
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
function render() {
  hookIndex = 0;
  return module.PayPalCheckoutPage();
}
function resetHooks() {
  hookState.length = 0;
  hookIndex = 0;
}
function inactiveAccount(planType = "free") {
  return {
    account: { plan_type: planType },
    eligible_promo_campaigns: { plus: { id: "promo-eligible", discount: {} } },
    entitlement: { has_active_subscription: false },
  };
}

deepEqual(Object.keys(module), ["PayPalCheckoutPage"]);
equal(state.initialized, 14);
deepEqual(
  [
    ...new Set(
      [
        ...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g),
      ].map((match) => match[1]),
    ),
  ],
  [
    "rolldown-runtime",
    "app-shared",
    "app-initial",
    "pricing-promotions",
    "checkout-policy",
    "checkout-confirm-latency",
    "checkout-page-core",
    "create-session",
  ],
);
equal(/\bany\b/.test(source), false);
equal(/import\s+\*\s+as\s+/.test(source), false);

let view = render();
equal(view.type, "preparation");
equal(view.props.loading, true);

state.account = { accountId: "acct-1", userId: "user-1" };
state.accountResponse = {
  accounts: {
    "acct-1": {
      ...inactiveAccount(),
      entitlement: { has_active_subscription: true },
    },
  },
};
resetHooks();
view = render();
equal(view.type, "preparation");
deepEqual(state.queryOptions.queryKey, [
  "paypal-promotion-checkout",
  "acct-1",
  "user-1",
  "attempt-1",
  "?source=campaign",
]);
equal(state.queryOptions.staleTime, Infinity);
equal(state.queryOptions.gcTime, 0);
equal(state.queryOptions.retry, false);
equal(state.queryOptions.refetchOnWindowFocus, false);
equal(state.queryOptions.refetchOnReconnect, false);
const signal = new AbortController().signal;
let queryResult = await state.queryOptions.queryFn({ signal });
deepEqual(queryResult, {
  type: "pricing",
  search: "?source=campaign&plan=plus",
});
deepEqual(state.apiCalls[0].options.additionalHeaders, {
  "ChatGPT-Account-ID": "acct-1",
  "X-Account-ID": "acct-1",
});

state.accountResponse = { accounts: { "acct-1": inactiveAccount() } };
state.location.search = "?promo_campaign=promo-query&login_hint=hidden";
state.experimentEnabled = false;
state.apiCalls.length = 0;
resetHooks();
render();
queryResult = await state.queryOptions.queryFn({ signal });
deepEqual(queryResult, { type: "purchase", inferredCampaign: undefined });
equal(state.apiCalls[1].options.parameters.query.coupon, "promo-query");
equal(
  state.apiCalls[1].options.parameters.query.is_coupon_from_query_param,
  true,
);

state.location.search = "?promoCode=welcome";
state.experimentEnabled = false;
state.apiCalls.length = 0;
resetHooks();
render();
queryResult = await state.queryOptions.queryFn({ signal });
deepEqual(queryResult, {
  type: "purchase",
  inferredCampaign: "coupon-inferred",
});
equal(state.apiCalls[1].options.parameters.query.coupon, "promo-inferred");

state.experimentEnabled = true;
state.dark = true;
state.createSessionCalls.length = 0;
resetHooks();
render();
queryResult = await state.queryOptions.queryFn({ signal });
equal(queryResult.type, "checkout");
deepEqual(queryResult.request, {
  kind: "paypal",
  promoCode: "welcome",
  eligibleCampaign: "coupon-inferred",
  isCampaignFromQuery: false,
});
equal(state.createSessionCalls[0].attemptId, "attempt-1");
equal(state.createSessionCalls[0].isDark, true);
equal(
  state.createSessionCalls[0].cancelUrl,
  "https://chatgpt.com/pricing?promoCode=welcome",
);

state.query = {
  data: queryResult,
  error: null,
  isPending: false,
  refetches: 0,
};
view = render();
equal(view.type, "navigate");
deepEqual(view.props.to, {
  pathname: "/checkout/paypal/session-1",
  search: "?promoCode=welcome",
});
deepEqual(view.props.state, { checkoutRequest: queryResult.request });

state.query.data = { type: "pricing", search: "?source=campaign&plan=plus" };
view = render();
deepEqual(view.props.to, {
  pathname: "/pricing",
  search: "?source=campaign&plan=plus",
  hash: "",
});
equal(view.props.replace, true);

state.query.data = { type: "purchase", inferredCampaign: "coupon-inferred" };
view = render();
deepEqual(view.props.to, {
  pathname: "/purchase/plus",
  search: "?promoCode=welcome",
  hash: "#return",
});
deepEqual(view.props.state, {
  "account-payment-modal-promo-campaign-handoff": "coupon-inferred",
});

state.query.data = {
  type: "checkout",
  request: { kind: "paypal" },
  session: { url: "https://checkout.example/session" },
};
view = render();
equal(view.type, "hosted");
equal(view.props.url, "https://checkout.example/session");

const checkoutError = new Error("checkout failed");
state.query = {
  data: undefined,
  error: checkoutError,
  isPending: false,
  refetches: 0,
};
view = render();
equal(view.type, "preparation");
equal(view.props.error, checkoutError);
view.props.onRetry();
equal(state.query.refetches, 1);

console.log(`paypal-page targeted tests passed (${assertions} assertions)`);
