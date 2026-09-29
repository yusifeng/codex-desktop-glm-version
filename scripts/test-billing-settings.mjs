import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hookState = [];
let hookIndex = 0;
const makeQuery = (data) => ({
  data,
  isError: false,
  isFetching: false,
  isLoading: false,
  isPending: false,
  refetches: 0,
  refetch() {
    this.refetches += 1;
  },
});
const paidAccount = {
  account: {
    plan_type: "plus",
    processor: { a001: { has_customer_object: true } },
  },
  can_access_with_session: true,
  entitlement: {
    billing_currency: "usd",
    cancels_at: null,
    has_active_subscription: true,
  },
  last_active_subscription: {
    purchase_origin_platform: "web",
    will_renew: true,
  },
  usage: { label: "Usage", used: 42, limit: 100 },
};
const state = {
  activeAccount: makeQuery({ id: "acct-1", structure: "personal" }),
  billing: makeQuery(paidAccount),
  checkoutCalls: [],
  identity: { accountId: "acct-1", userId: "user-1" },
  initialized: 0,
  openedPaths: [],
  paymentMethods: makeQuery({
    default_payment_method_id: "pm-1",
    payment_methods: [
      { id: "pm-1", type: "card", card: { brand: "visa", last4: "4242" } },
    ],
  }),
  wallet: makeQuery({
    balance: -2500,
    currency: "usd",
    has_redeemed_gift_card: true,
  }),
  walletGate: true,
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
globalThis.__billingSettings = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__billingSettings;",
    "export const $3=()=>{runtime.state.initialized+=1};export const FX=()=>{};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const BX=(query,input)=>query(input);export const _L=options=>options;",
    "export const n4=()=>({formatNumber:(value,options)=>new Intl.NumberFormat('en-US',options).format(value),formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join("\n"),
  "app-initial": [
    "const runtime=globalThis.__billingSettings;",
    "export const N6t=()=>runtime.state.identity;export const Vcn=()=>{};export const uht=()=>runtime.state.activeAccount;",
    "export const jI=()=>input=>runtime.state.checkoutCalls.push(input);export const o_n=()=>path=>runtime.state.openedPaths.push(path);export const ofn=()=>runtime.state.walletGate;",
  ].join("\n"),
  queries: [
    "const runtime=globalThis.__billingSettings;",
    "export const i=()=>{};export const r=()=>runtime.state.wallet;export const t=()=>runtime.state.billing;",
  ].join("\n"),
  eligibility: [
    "const runtime=globalThis.__billingSettings;",
    "export const r=()=>{};export const t=(_account,wallet)=>({canRedeem:wallet?.has_redeemed_gift_card===true,showWallet:wallet!=null,usdBalance:wallet?.balances?.usd??0});",
  ].join("\n"),
  "billing-queries":
    "const runtime=globalThis.__billingSettings;export const n=()=>{};export const r=()=>runtime.state.paymentMethods;",
  "billing-state":
    "export const r=()=>{};export const n=account=>{const source=account.last_active_subscription?.purchase_origin_platform;return source==='chatgpt_mobile_ios'?'app_store':source==='chatgpt_mobile_android'?'google_play_store':source==='partner_managed'?'partner_managed':null};",
  "settings-loading-row":
    "export const n=()=>{};export const t=props=>({type:'settings-loading-row',props});",
  "billing-query-error":
    "export const n=()=>{};export const t=props=>({type:'billing-query-error',props});",
  "subscription-plan-status":
    "export const r=()=>{};export const t=({plan})=>({free:'Free',plus:'Plus',pro:'Pro',prolite:'Pro',go:'Go'}[plan]??plan);export const n=props=>({type:'plan-status',props});",
  "format-amount":
    "export const n=()=>{};export const t=(_intl,amount,currency)=>new Intl.NumberFormat('en-US',{style:'currency',currency:currency.toUpperCase()}).format(amount/100);",
  "payment-method-display":
    "export const n=()=>{};export const t=method=>({label:method.card?.brand??method.type,description:method.card?.last4==null?'':' •••• '+method.card.last4});",
  "add-payment-method":
    "export const n=()=>{};export const t=props=>({type:'add-payment-method',props});",
  "edit-payment-method":
    "export const n=()=>{};export const t=props=>({type:'edit-payment-method',props});",
  "subscription-cancellation-dialog":
    "export const CancellationDialog=props=>({type:'cancellation-dialog',props});",
  "subscription-renewal-dialog":
    "export const SubscriptionRenewalDialog=props=>({type:'renewal-dialog',props});",
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/billing-settings/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "billing-settings-mocks",
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
assert.deepEqual(Object.keys(module), ["ConsumerBillingSettings"]);
assert.equal(state.initialized, 1);

function render() {
  hookIndex = 0;
  return module.ConsumerBillingSettings();
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
function find(view, predicate) {
  return walk(view).find(predicate);
}
function findAll(view, predicate) {
  return walk(view).filter(predicate);
}
function button(view, label) {
  return find(
    view,
    (node) => node.type === "button" && node.props?.children === label,
  );
}

state.activeAccount.isLoading = true;
let view = render();
assert.equal(
  find(view, (node) => node.type === "settings-loading-row").props.children,
  "Loading settings…",
);
state.activeAccount.isLoading = false;

state.activeAccount.data = { id: "workspace-1", structure: "workspace" };
view = render();
assert.equal(findAll(view, (node) => node.type === "section").length, 0);
state.activeAccount.data = { id: "acct-1", structure: "personal" };

state.billing.isPending = true;
view = render();
assert.equal(
  find(view, (node) => node.type === "settings-loading-row").props.children,
  "Loading settings…",
);
state.billing.isPending = false;
state.billing.isError = true;
view = render();
find(view, (node) => node.type === "billing-query-error").props.onRetry();
assert.equal(state.billing.refetches, 1);
state.billing.isError = false;
state.billing.data.can_access_with_session = false;
view = render();
assert.equal(
  find(view, (node) => node.type === "billing-query-error") != null,
  true,
);
state.billing.data.can_access_with_session = true;

resetHooks();
view = render();
assert.equal(
  find(view, (node) => node.type === "h1").props.children,
  "Billing",
);
assert.equal(
  find(view, (node) => node.type === "h2" && node.props.children === "Plan") !=
    null,
  true,
);
assert.equal(
  find(view, (node) => node.type === "strong").props.children,
  "Plus",
);
assert.equal(find(view, (node) => node.type === "plan-status") != null, true);
assert.equal(button(view, "Change plan") != null, true);
button(view, "Change plan").props.onClick();
assert.equal(state.checkoutCalls.at(-1).currentPlan, "plus");
assert.equal(
  find(view, (node) => node.props?.["data-wallet-balance"]).props.children,
  "$25.00",
);
assert.equal(
  find(view, (node) => node.props?.["data-billing-usage"]).props.children,
  "42 / 100",
);
button(view, "Redeem gift card").props.onClick();
assert.equal(state.openedPaths.at(-1), "/redeem?entry_point=billing");
assert.equal(
  findAll(view, (node) => node.props?.["data-payment-method-id"]).length,
  1,
);
assert.equal(button(view, "Add new").props.disabled, false);

button(view, "Add new").props.onClick();
view = render();
const addDialog = find(view, (node) => node.type === "add-payment-method");
assert.equal(addDialog.props.accountId, "acct-1");
addDialog.props.onSuccess();
assert.equal(state.paymentMethods.refetches, 1);

view = render();
button(view, "Edit").props.onClick();
view = render();
assert.equal(
  find(view, (node) => node.type === "edit-payment-method").props.methodId,
  "pm-1",
);

resetHooks();
state.paymentMethods.isLoading = true;
view = render();
assert.equal(
  find(view, (node) => node.type === "settings-loading-row").props.children,
  "Loading payment methods",
);
state.paymentMethods.isLoading = false;
state.paymentMethods.isError = true;
view = render();
find(view, (node) => node.type === "billing-query-error").props.onRetry();
assert.equal(state.paymentMethods.refetches, 2);
state.paymentMethods.isError = false;
state.paymentMethods.data = {
  default_payment_method_id: null,
  payment_methods: [],
};
view = render();
assert.equal(
  find(
    view,
    (node) =>
      node.type === "p" &&
      node.props.children === "No payment methods available",
  ) != null,
  true,
);

state.wallet.isFetching = true;
view = render();
assert.equal(
  find(view, (node) => node.props?.role === "status").props.children,
  "Loading balance…",
);
assert.equal(button(view, "Change plan").props.disabled, true);
state.wallet.isFetching = false;
state.wallet.isError = true;
view = render();
button(view, "Retry").props.onClick();
assert.equal(state.wallet.refetches, 1);
state.wallet.isError = false;

resetHooks();
state.billing.data = {
  ...paidAccount,
  last_active_subscription: {
    purchase_origin_platform: "chatgpt_mobile_ios",
    will_renew: true,
  },
};
view = render();
assert.equal(button(view, "Manage") != null, true);
button(view, "Manage").props.onClick();
view = render();
assert.equal(
  find(view, (node) => node.props?.role === "dialog").props[
    "data-management-source"
  ],
  "app_store",
);
assert.equal(
  find(
    view,
    (node) => node.type === "h2" && node.props.children === "Payment methods",
  ),
  undefined,
);

resetHooks();
state.billing.data = {
  ...paidAccount,
  last_active_subscription: {
    purchase_origin_platform: "web",
    will_renew: false,
  },
};
view = render();
assert.equal(button(view, "Renew Plus Plan") != null, true);
button(view, "Renew Plus Plan").props.onClick();
view = render();
assert.equal(
  find(view, (node) => node.type === "renewal-dialog") != null,
  true,
);

resetHooks();
state.billing.data = paidAccount;
view = render();
assert.equal(button(view, "Cancel") != null, true);
button(view, "Cancel").props.onClick();
view = render();
assert.equal(
  find(view, (node) => node.type === "cancellation-dialog") != null,
  true,
);

resetHooks();
state.billing.data = {
  account: {
    plan_type: "free",
    processor: { a001: { has_customer_object: false } },
  },
  can_access_with_session: true,
  entitlement: { has_active_subscription: false },
  last_active_subscription: { will_renew: false },
};
state.walletGate = false;
view = render();
assert.equal(button(view, "Upgrade") != null, true);
assert.equal(
  find(
    view,
    (node) => node.type === "h2" && node.props.children === "Wallet balance",
  ),
  undefined,
);
assert.equal(
  find(
    view,
    (node) => node.type === "h2" && node.props.children === "Payment methods",
  ),
  undefined,
);
assert.equal(button(view, "Cancel"), undefined);

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " billing settings assertions passed");
