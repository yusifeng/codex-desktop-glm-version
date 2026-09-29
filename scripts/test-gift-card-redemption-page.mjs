import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/gift-card-redemption-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
class MockApiError extends Error {
  constructor(message, status, errorCode) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}
const state = {
  accountQuery: {
    data: {
      account: { account_user_role: "account-owner", plan_type: "free", structure: "personal" },
      can_access_with_session: true,
    },
    isPending: false,
    refetch: async () => ({}),
  },
  apiPosts: [],
  auth: { accountId: "account-1", isLoading: false, userId: "user-1" },
  cleanups: [],
  configLoading: false,
  gate: true,
  initialized: 0,
  integrityActions: [],
  invalidations: [],
  location: { countryEligible: true, usOnly: true },
  navigations: [],
  openPricing: [],
  postQueue: [],
  serialNumberRequired: false,
  stateIndex: 0,
  stateSetCalls: [],
  stateValues: [],
};
const node = (type, props = {}, key) => ({ type, props, key });
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) {
    return typeof type === "function" ? type(props ?? {}) : node(type, props ?? {}, key);
  },
  jsxs(type, props, key) {
    return typeof type === "function" ? type(props ?? {}) : node(type, props ?? {}, key);
  },
};
globalThis.__giftCardRedemption = { ApiError: MockApiError, jsx, node, state };

const initializer = "()=>{globalThis.__giftCardRedemption.state.initialized+=1}";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__giftCardRedemption;const s=r.state;",
    "export const $3=" + initializer + ";export const FX=" + initializer + ";export const I3=()=>r.jsx;export const ZI='scope';",
    "export const BX=()=>s.accountQuery;export const LX=()=>({queryClient:{invalidateQueries(){}}});",
    "export const n4=()=>({formatNumber:(value,options)=>options.currency+' '+value.toFixed(2)});",
    "export const e6=()=>({useEffect(effect){const cleanup=effect();if(typeof cleanup==='function')s.cleanups.push(cleanup)},useRef(value){return {current:value}},useState(value){const index=s.stateIndex++;const initial=index<s.stateValues.length?s.stateValues[index]:value;return [initial,next=>s.stateSetCalls.push({index,next})]}});",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__giftCardRedemption;const s=r.state;",
    "export const N6t=()=>s.auth;export const Ygn=props=>r.node('redirect',props);export const cJt=" + initializer + ";",
    "export const cfn=()=>({client:{getLayer:()=>({get:()=>s.serialNumberRequired})},isLoading:s.configLoading});",
    "export const jI=()=>input=>s.openPricing.push(input);export const o_n=()=>destination=>s.navigations.push(destination);export const ofn=()=>s.gate;",
    "export const Sdn=r.ApiError;",
    "export const rJt={safePost:async(path,input)=>{s.apiPosts.push({path,input});const value=s.postQueue.shift();if(value instanceof Error)throw value;return value}};",
  ].join("\n"),
  "account-action-integrity": "const s=globalThis.__giftCardRedemption.state;export const r=" + initializer + ";export const t=async action=>{s.integrityActions.push(action);return {'Integrity-Token':'token'}};",
  "assert-never": "export const n=" + initializer + ";export const t=value=>{throw new Error('Unexpected value: '+value)};",
  "billing-queries": "const s=globalThis.__giftCardRedemption.state;export const n=" + initializer + ";export const i=async(scope,accountId)=>s.invalidations.push({scope,accountId});",
  "billing-query-error": "const r=globalThis.__giftCardRedemption;export const n=" + initializer + ";export const t=props=>r.node('billing-query-error',props);",
  eligibility: [
    "const s=globalThis.__giftCardRedemption.state;",
    "export const a=" + initializer + ";export const r=" + initializer + ";export const n=()=>s.location;",
    "export const o=value=>['serial_number_required','currency_ineligible','daily_limit','attempt_limit','temporarily_unavailable'].includes(value);",
    "export const i=value=>value??'generic';",
  ].join("\n"),
  "format-amount": "export const n=" + initializer + ";export const t=(intl,amount,currency)=>intl.formatNumber(amount/100,{style:'currency',currency});",
  queries: "export const i=" + initializer + ";export const t={name:'gift-card-account'};",
};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "gift-card-redemption-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions += 1; }
function tick() { return new Promise((resolve) => setTimeout(resolve, 0)); }
function reset() {
  state.accountQuery = {
    data: {
      account: { account_user_role: "account-owner", plan_type: "free", structure: "personal" },
      can_access_with_session: true,
    },
    isPending: false,
    refetch: async () => ({}),
  };
  state.apiPosts.length = 0;
  state.auth = { accountId: "account-1", isLoading: false, userId: "user-1" };
  state.cleanups.length = 0;
  state.configLoading = false;
  state.gate = true;
  state.integrityActions.length = 0;
  state.invalidations.length = 0;
  state.location = { countryEligible: true, usOnly: true };
  state.navigations.length = 0;
  state.openPricing.length = 0;
  state.postQueue.length = 0;
  state.serialNumberRequired = false;
  state.stateIndex = 0;
  state.stateSetCalls.length = 0;
  state.stateValues = [];
}
function render() { state.stateIndex = 0; return module.GiftCardRedemptionPage(); }
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; }
  output.push(value); walk(value.props?.children, output); return output;
}
function find(view, predicate) { return walk(view).find(predicate); }
function byType(view, type) { return find(view, (item) => item.type === type); }
function byData(view, key, value) { return find(view, (item) => item.props?.[key] === value); }

assert.deepEqual(Object.keys(module), ["GiftCardRedemptionPage"]); assertions += 1;
assert.deepEqual([...source.matchAll(/from \"@rchunk\/([^\"]+)\"/g)].map((match) => match[1]), [
  "account-action-integrity", "app-initial", "app-shared", "assert-never", "billing-queries",
  "billing-query-error", "eligibility", "format-amount", "queries",
]); assertions += 1;
assert.equal(source.includes('import "@rchunk/rolldown-runtime"'), true); assertions += 1;
assert.equal(/\bany\b/.test(source), false); assertions += 1;
assert.equal(/\b(?:accountIntegrityChunk|appInitialChunk|appSharedChunk|assertNeverChunk|billingQueriesChunk|billingQueryErrorChunk|eligibilityChunk|formatAmountChunk|accountQueriesChunk)\s*\./.test(source), false); assertions += 1;

reset(); state.auth.isLoading = true;
check(render().props["data-state"] === "loading", "shows loading while authentication resolves");

reset(); state.gate = false;
check(render().type === "redirect", "redirects when the redemption feature is disabled");

reset(); state.auth.userId = null;
check(byType(render(), "billing-query-error") != null, "shows a retry surface without an authenticated user");

reset(); state.accountQuery.isPending = true;
check(render().props["data-state"] === "loading", "shows loading while account eligibility resolves");

reset(); state.accountQuery.data.can_access_with_session = false;
check(byType(render(), "billing-query-error") != null, "rejects accounts unavailable to the session");

reset(); state.location = { countryEligible: false, usOnly: true };
let view = render();
check(view.props["data-state"] === "unavailable", "blocks redemption outside the eligible location");
check(walk(view).some((item) => item.props?.children?.includes?.("United States")), "explains the US-only launch");

reset(); state.accountQuery.data.account = { account_user_role: "member", plan_type: "team", structure: "workspace" };
view = render();
check(view.props["data-state"] === "unavailable", "blocks non-owner workspace users");
check(walk(view).some((item) => item.props?.children?.includes?.("workspace owners")), "explains workspace-owner eligibility");

reset();
view = render();
check(view.props["data-state"] === "idle", "renders the redemption form for an eligible account");
check(byData(view, "data-view", "redemption-form") != null, "renders the semantic redemption form");
check(find(view, (item) => item.props?.["aria-label"] === "Card number") == null, "keeps card number hidden by default");
check(byType(view, "button").props.disabled === true, "disables submission until the PIN is complete");
check(state.cleanups.length === 1, "registers request abort cleanup");

reset(); state.serialNumberRequired = true;
view = render();
check(find(view, (item) => item.props?.["aria-label"] === "Card number") != null, "shows card number when the layer requires it");

reset(); state.stateValues = ["ABCDEFGHIJKLMNOP", "", false, { phase: "idle" }];
state.postQueue.push({ amount: 2500, currency: "USD", status: "redeemed" });
view = render();
byData(view, "data-view", "redemption-form").props.onSubmit({ preventDefault() {} });
await tick(); await tick();
check(state.apiPosts[0].path === "/gift-cards/redeem", "posts to the gift-card redemption endpoint");
check(state.apiPosts[0].input.requestBody.account_id === "account-1", "binds redemption to the active account");
check(state.apiPosts[0].input.requestBody.pin === "ABCDEFGHIJKLMNOP", "submits the normalized PIN");
check(state.integrityActions[0] === "chatgpt_gift_card_redemption", "requests the correct integrity action");
check(state.stateSetCalls.some((call) => call.index === 3 && call.next?.phase === "redeemed"), "records a successful redemption");
check(state.invalidations[0].accountId === "account-1", "refreshes billing state after redemption");

reset(); state.stateValues = ["ABCDEFGHIJKLMNOP", "", false, { phase: "idle" }];
state.postQueue.push({ amount: 0, currency: "USD", status: "already_redeemed" });
view = render();
byData(view, "data-view", "redemption-form").props.onSubmit({ preventDefault() {} });
await tick();
check(state.stateSetCalls.some((call) => call.index === 3 && call.next?.error === "already_redeemed"), "surfaces same-account already redeemed responses");

reset(); state.stateValues = ["ABCDEFGHIJKLMNOP", "", false, { phase: "idle" }];
state.postQueue.push(new MockApiError("serial required", 400, "serial_number_required"));
view = render();
byData(view, "data-view", "redemption-form").props.onSubmit({ preventDefault() {} });
await tick();
check(state.stateSetCalls.some((call) => call.index === 2 && call.next === true), "reveals card number after a server requirement");
check(state.stateSetCalls.some((call) => call.index === 3 && call.next?.error === "serial_number_required"), "preserves the server error category");

reset(); state.stateValues = ["", "", true, { phase: "failed", error: "serial_number_required" }];
view = render();
check(find(view, (item) => item.props?.["aria-label"] === "Card number") != null, "reveals card number after the server requires it");
check(byData(view, "data-error", "serial_number_required") != null, "announces the serial-number requirement");

reset(); state.stateValues = ["", "", false, { phase: "redeemed", result: { amount: 2500, currency: "USD", status: "redeemed" } }];
view = render();
check(view.props["data-state"] === "redeemed", "renders the redemption success state");
check(walk(view).some((item) => item.props?.children === "Added USD 25.00 to your Wallet"), "formats the redeemed amount");
byData(view, "data-action", "upgrade").props.onClick({ type: "click" });
check(state.openPricing[0].source === "gift_card_redemption", "opens pricing from the redemption success screen");
byData(view, "data-action", "continue").props.onClick();
check(state.navigations[0] === "/", "continues to ChatGPT home");

reset(); state.accountQuery.data.account.plan_type = "pro"; state.stateValues = ["", "", false, { phase: "redeemed", result: { amount: 100, currency: "USD", status: "redeemed" } }];
view = render();
check(byData(view, "data-action", "upgrade") == null, "does not offer an upgrade to Pro accounts");

console.log(assertions + " gift-card redemption page assertions passed");
