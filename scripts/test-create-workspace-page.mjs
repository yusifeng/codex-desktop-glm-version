import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  ROOT,
  "src/renderer/create-workspace-page/index.ts",
);
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
  account: { userId: null, accountId: null, isLoading: true },
  apiCalls: [],
  checkoutQuery: { data: undefined, error: null, refetches: 0 },
  checkoutOptions: null,
  createSessionCalls: [],
  dark: false,
  durable: false,
  initialized: 0,
  location: {
    pathname: "/create-workspace",
    search: "?source=direct",
    hash: "",
    key: "route-1",
    state: null,
  },
  navigated: [],
  pendingWorkspaceResponse: undefined,
  pricingCalls: [],
  provisioningResponse: null,
  signupQuery: { data: undefined, error: null, refetches: 0 },
  signupOptions: null,
  session: {
    tag: "custom_checkout_session",
    processor_entity: "stripe",
    checkout_session_id: "checkout-1",
  },
  snapshot: { accessToken: "token", accountId: "acct", userId: "user" },
  accountResponse: { accounts: {} },
  couponResponse: { coupon: "promo-query" },
};
const React = {
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hookState))
      hookState[index] = typeof initial === "function" ? initial() : initial;
    return [
      hookState[index],
      (next) => {
        hookState[index] =
          typeof next === "function" ? next(hookState[index]) : next;
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
globalThis.__createWorkspacePage = { React, jsx, state };
const init = "globalThis.__createWorkspacePage.state.initialized+=1";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__createWorkspacePage;const s=r.state;",
    `export const $3=()=>{${init}};export const FX=()=>{${init}};export const gL=()=>{${init}};export const Zh=()=>{${init}};export const dg=()=>{${init}};`,
    "export const I3=()=>r.jsx;export const e6=()=>r.React;export const fg=()=>s.dark;export const vW='X-Account-ID';",
    "export const Qh=props=>({type:'spinner',props});export const Yh=props=>({type:'button',props});export const Y2=props=>props.defaultMessage;export const sw=props=>({type:'close',props});",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});export const ZI={id:'app'};export const LX=()=>({queryClient:{fetchQuery:options=>options.queryFn()}});",
    "export const _L=options=>{if(options.queryKey[0]==='business-workspace-signup'){s.signupOptions=options;return {...s.signupQuery,refetch:()=>{s.signupQuery.refetches+=1}}}s.checkoutOptions=options;return {...s.checkoutQuery,refetch:()=>{s.checkoutQuery.refetches+=1}}};",
  ].join("\n"),
  "app-initial": [
    "const s=globalThis.__createWorkspacePage.state;",
    `export const M6t=()=>{${init}};export const Qgn=()=>{${init}};export const cJt=()=>{${init}};export const ifn=()=>{${init}};`,
    "export class Sdn extends Error{constructor(status){super('api');this.status=status}};export const N6t=()=>s.account;export const i_n=()=>s.location;export const o_n=()=>destination=>s.navigated.push(destination);export const Ygn=props=>({type:'navigate',props});",
    "export const lfn=()=>({getContext:()=>({user:{country:'US'}}),getLayer:id=>({get:(key,fallback)=>id==='550361471'?s.durable:fallback})});export const rfn=()=>({get:()=>false});",
    "export const rJt={safeGet:async(path,options)=>{s.apiCalls.push({method:'GET',path,options});if(path.includes('business_workspace_provisioning'))return s.provisioningResponse;if(path.includes('pending_team_workspace'))return s.pendingWorkspaceResponse;if(path.includes('check_coupon'))return s.couponResponse;if(path.includes('/users'))return {total:3};return s.accountResponse},safePost:async(path,options)=>{s.apiCalls.push({method:'POST',path,options});return {}}};",
  ].join("\n"),
  "checkout-policy": `export const S=()=>{${init}};`,
  "billing-pricing": [
    `export const n=()=>{${init}};`,
    "export const t=async input=>{globalThis.__createWorkspacePage.state.pricingCalls.push(input);return {currency_config:{symbol_code:'USD'}}};",
  ].join("\n"),
  presentation: "export {};",
  "checkout-session": "export {};",
  "checkout-page-core": `export const r=()=>{${init}};export const n=props=>({type:'hosted',props});`,
  "create-session": `export const n=()=>{${init}};export const t=async input=>{const s=globalThis.__createWorkspacePage.state;s.createSessionCalls.push(input);return s.session};`,
  "chatgpt-token-auth.browser": [
    "const s=globalThis.__createWorkspacePage.state;",
    "export const getBrowserChatGptAuthSnapshot=()=>s.snapshot;export const readChatGptTokenClaims=()=>({accountId:s.snapshot?.accountId});",
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
      name: "create-workspace-page-mocks",
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
  return module.CreateWorkspacePage();
}
function resetHooks() {
  hookState.length = 0;
  hookIndex = 0;
}
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, output);
    return output;
  }
  output.push(value);
  walk(value.props?.children, output);
  return output;
}
function text(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(text).join(" ");
  return text(value.props?.children);
}
function button(view, label) {
  return walk(view).find(
    (node) => node.type === "button" && text(node) === label,
  );
}
function checkoutAccount() {
  return {
    account: {
      account_user_id: "user__acct",
      plan_type: "free_workspace",
      structure: "workspace",
    },
    can_access_with_session: true,
    eligible_promo_campaigns: { team: { id: "promo-fallback" } },
    entitlement: { has_active_subscription: false },
    last_active_subscription: {},
  };
}

deepEqual(Object.keys(module), ["CreateWorkspacePage"]);
equal(state.initialized, 13);
deepEqual(
  [
    ...new Set(
      [
        ...source.matchAll(
          /(?:import\s+(?:[^;]*?from\s*)?|import\()"@rchunk\/([^"]+)"/g,
        ),
      ].map((match) => match[1]),
    ),
  ],
  [
    "rolldown-runtime",
    "app-shared",
    "app-initial",
    "checkout-policy",
    "billing-pricing",
    "presentation",
    "checkout-session",
    "checkout-page-core",
    "create-session",
    "chatgpt-token-auth.browser",
  ],
);
equal(/\bany\b/.test(source), false);
equal(/import\s+\*\s+as\s+/.test(source), false);

let view = render();
equal(view.type, "div");
equal(
  walk(view).some((node) => node.type === "spinner"),
  true,
);

state.account = { userId: null, accountId: null, isLoading: false };
resetHooks();
view = render();
equal(view.type, "navigate");
equal(view.props.to, "/auth/login?next=%2Fcreate-workspace%3Fsource%3Ddirect");

state.account = { userId: "user", accountId: "acct", isLoading: false };
state.signupQuery = { data: undefined, error: new Error("load"), refetches: 0 };
resetHooks();
view = render();
equal(text(view).includes("We couldn't start checkout"), true);
button(view, "Try again").props.onClick();
equal(state.signupQuery.refetches, 1);

state.signupQuery = {
  data: {
    completed: false,
    resumeUrl: "/payments/success-team?x=1",
    pendingWorkspace: undefined,
  },
  error: null,
  refetches: 0,
};
resetHooks();
view = render();
equal(view.type, "navigate");
equal(view.props.to, "/payments/success-team?x=1");

state.signupQuery = {
  data: {
    completed: true,
    resumeUrl: "/payments/success-team?x=1",
    pendingWorkspace: { query_params: "numSeats=7" },
  },
  error: null,
  refetches: 0,
};
resetHooks();
view = render();
equal(text(view).includes("Your workspace is ready"), true);
button(view, "Continue previous setup").props.onClick();
equal(state.navigated.at(-1), "/payments/success-team?x=1");
button(view, "Create another workspace").props.onClick();
view = render();
equal(view.type, "navigate");
equal(view.props.to.includes("numSeats=7"), true);
equal(view.props.to.includes("step=configure-plan"), true);

state.location.search =
  "?source=direct&numSeats=7&promo_campaign=promo-query&step=configure-plan";
state.signupQuery.data = {
  completed: false,
  resumeUrl: null,
  pendingWorkspace: {
    query_params: "numSeats=9&promo_campaign=promo-query",
    workspace_name: "Acme",
    seat_quantity: 7,
  },
};
state.checkoutQuery = { data: undefined, error: null, refetches: 0 };
resetHooks();
view = render();
equal(view.type, "div");
deepEqual(state.checkoutOptions.queryKey, [
  "business-workspace-auto-checkout",
  "user",
  "acct",
  "attempt-1",
]);

state.accountResponse = { accounts: { acct: checkoutAccount() } };
state.apiCalls.length = 0;
state.createSessionCalls.length = 0;
state.pricingCalls.length = 0;
const signal = new AbortController().signal;
const checkoutResult = await state.checkoutOptions.queryFn({ signal });
equal(checkoutResult.request.team_plan_data.seat_quantity, 7);
equal(checkoutResult.request.team_plan_data.workspace_name, "Acme");
equal(checkoutResult.request.team_plan_data.price_interval, "month");
equal(checkoutResult.request.billing_details.currency, "USD");
equal(checkoutResult.request.promo_campaign.promo_campaign_id, "promo-query");
equal(state.pricingCalls.length, 2);
equal(
  state.createSessionCalls[0].cancelUrl,
  "https://chatgpt.com/create-workspace?source=direct&numSeats=7&promo_campaign=promo-query&step=configure-plan",
);
deepEqual(state.apiCalls[0].options.additionalHeaders, {
  "ChatGPT-Account-ID": "acct",
  "X-Account-ID": "acct",
});

state.checkoutQuery = { data: checkoutResult, error: null, refetches: 0 };
view = render();
equal(view.type, "navigate");
equal(
  view.props.to,
  "/checkout/stripe/checkout-1?source=direct&numSeats=7&promo_campaign=promo-query&step=configure-plan",
);
deepEqual(view.props.state, { checkoutRequest: checkoutResult.request });

state.checkoutQuery.data = {
  request: checkoutResult.request,
  session: { url: "https://checkout.example/team" },
};
view = render();
equal(view.type, "hosted");
equal(view.props.url, "https://checkout.example/team");

state.checkoutQuery = {
  data: undefined,
  error: new Error("checkout"),
  refetches: 0,
};
view = render();
button(view, "Try again").props.onClick();
equal(state.checkoutQuery.refetches, 1);

state.durable = true;
state.provisioningResponse = {
  state: "pending",
  checkoutSessionId: "stripe-1",
  processorEntity: "stripe",
  workspaceId: "workspace-1",
};
resetHooks();
render();
const signupResult = await state.signupOptions.queryFn({ signal });
equal(signupResult.completed, false);
equal(
  signupResult.resumeUrl,
  "/payments/success-team?durable_business_checkout=true&stripe_session_id=stripe-1&processor_entity=stripe&account_id=workspace-1",
);

console.log(
  `create-workspace-page targeted tests passed (${assertions} assertions)`,
);
