import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/checkout-success-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set(
  [...source.matchAll(/(?:from|import(?:\s*\()?)\s*["']@rchunk\/([^"']+)/g)].map(
    (match) => match[1],
  ),
);

assert.deepEqual([...dependencies].sort(), [
  "app-initial", "app-primary", "app-shared", "chatgpt-subscription-events",
  "chatgpt-token-auth.browser", "checkout-confirm-latency", "checkout-policy",
  "checkout-session", "create-workspace-presentation", "document-title",
  "pending-image-download", "promo-funnel-context", "queries", "rolldown-runtime",
  "subscription-onboarding-content", "subscription-queries", "workspace-access.browser",
  "workspace-auto-generated-name",
]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(
  source,
  /\b(?:appInitialChunk|appPrimaryChunk|appSharedChunk|subscriptionEventsChunk|checkoutPolicyChunk|checkoutLatencyChunk|documentTitleChunk|workspacePresentationChunk|promoFunnelChunk|queriesChunk|subscriptionQueriesChunk|checkoutSessionChunk|subscriptionOnboardingChunk|workspaceNameChunk)\s*\./,
);

const state = {
  access: { data: null, error: null, isPending: false, refetches: 0 },
  accountId: "account-1", apiGets: [], apiPosts: [], beacon: null, config: {},
  fulfillment: { data: null, error: null, isPending: true, refetches: 0 },
  historyWrites: [], initializers: [],
  location: { pathname: "/payments/success", search: "", hash: "" },
  locationAssignments: [], mutation: null, pendingImageCalls: [], promoReads: 0,
  provisioning: { data: null, error: null, isFetching: false, refetches: 0 },
  queryFetches: [], queryOptions: {}, refreshes: 0,
  search: new URLSearchParams("processor_entity=stripe&stripe_session_id=session-1&plan_type=plus"),
  studentOnboarding: [], tokenAuthCalls: [], userId: "user-1",
  workspace: { id: "workspace-1", name: "Acme" }, workspaceAccessCalls: [],
  workspaceName: "Acme Workspace",
};
state.scope = { queryClient: { async fetchQuery(options) { state.queryFetches.push(options); return {}; } } };
globalThis.__checkoutSuccessTest = state;
globalThis.window = {
  history: { replaceState(_state, _title, destination) { state.historyWrites.push(destination); } },
  location: {
    assign(destination) { state.locationAssignments.push(destination); },
    href: "https://chatgpt.test/payments/success",
    origin: "https://chatgpt.test",
  },
};

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const s=globalThis.__checkoutSuccessTest;const mark=name=>()=>s.initializers.push(name);",
    "export const $3=mark('compiler');export const QI=mark('scope');export const wL=mark('query-runtime');",
    "export const Y2='FormattedMessage';export const Yh='Button';export const ZI='applicationScope';",
    "export const I3=()=>({Fragment:'Fragment',jsx:(type,props,key)=>typeof type==='function'?type(props??{}):({type,props:props??{},key}),jsxs:(type,props,key)=>typeof type==='function'?type(props??{}):({type,props:props??{},key})});",
    "export const e6=()=>({useEffect(effect){s.effects??=[];s.effects.push(effect())},useRef:value=>({current:value})});",
    "export const LX=()=>s.scope;export const n4=()=>({formatMessage:d=>d.defaultMessage});",
    "export const _L=options=>{const key=String(options.queryKey?.[0]??'unknown');s.queryOptions[key]=options;const target=key==='checkout-fulfillment'?s.fulfillment:key==='business-checkout-access'?s.access:key==='checkout-workspace-provisioning'?s.provisioning:{data:null,error:null,isPending:false,refetches:0};return{...target,refetch(){target.refetches+=1}}};",
    "export const iL=options=>({error:null,isPending:false,mutate(){s.mutation=Promise.resolve(options.mutationFn()).finally(options.onSettled)}});",
  ].join("\n"),
  "app-initial": [
    "const s=globalThis.__checkoutSuccessTest;const mark=name=>()=>s.initializers.push(name);",
    "export const M6t=mark('account-models');export const Qgn=mark('authentication');export const cJt=mark('api');",
    "export const Ygn='Redirect';export const N6t=()=>({accountId:s.accountId,userId:s.userId,isLoading:s.identityLoading??false});",
    "export const i_n=()=>s.location;export const d_n=()=>[s.search];export const _0=()=>'/pricing';export const r_n=path=>'https://chatgpt.test'+path;",
    "export const F6t=()=>()=>{s.refreshes+=1};export const lfn=()=>({getLayer:key=>({get(name,fallback){return s.config[key+':'+name]??fallback}})});",
    "export const rJt={safePost:async(path,options)=>{s.apiPosts.push({path,options});return s.fulfillmentResponse??{}},safeGet:async(path,options)=>{s.apiGets.push({path,options});return s.provisioningResponse??{}}};",
  ].join("\n"),
  "app-primary": "const s=globalThis.__checkoutSuccessTest;export const sh=()=>s.initializers.push('checkout-primary');export const ih=()=>s.beacon;",
  "chatgpt-subscription-events": "export const i=()=>globalThis.__checkoutSuccessTest.initializers.push('subscription-events');",
  "checkout-policy": "export const S=()=>globalThis.__checkoutSuccessTest.initializers.push('checkout-policy');",
  "checkout-confirm-latency": "const s=globalThis.__checkoutSuccessTest;export const c=()=>s.initializers.push('business-latency');export const m=()=>s.initializers.push('checkout-loading');export const r=()=>s.initializers.push('checkout-latency');export const p='CheckoutStatus';",
  "document-title": "const s=globalThis.__checkoutSuccessTest;export const r=()=>s.initializers.push('document-title');export const t='DocumentTitle';",
  "create-workspace-presentation": "export const T=()=>globalThis.__checkoutSuccessTest.initializers.push('workspace-presentation');",
  "promo-funnel-context": "const s=globalThis.__checkoutSuccessTest;export const n=()=>s.initializers.push('promo-funnel');export const t=()=>{s.promoReads+=1;return null};",
  queries: "const s=globalThis.__checkoutSuccessTest;export const i=()=>s.initializers.push('queries');export const n=accountId=>({queryKey:['accounts',accountId]});",
  "subscription-queries": "const s=globalThis.__checkoutSuccessTest;export const i=()=>s.initializers.push('subscription-queries');export const o=accountId=>({queryKey:['subscription',accountId]});",
  "checkout-session": [
    "const s=globalThis.__checkoutSuccessTest;export const d=()=>s.initializers.push('checkout-plan-data');export const o=()=>s.initializers.push('checkout-session');export const u='CheckoutShell';",
    "export const r={safeParse(value){return typeof value?.checkoutSessionId==='string'&&value.checkoutSessionId.length>0&&typeof value?.processorEntity==='string'&&value.processorEntity.length>0?{success:true,data:value}:{success:false}}};",
  ].join("\n"),
  "subscription-onboarding-content": "const s=globalThis.__checkoutSuccessTest;export const t=()=>s.initializers.push('subscription-onboarding');export const o=input=>s.studentOnboarding.push(input);",
  "workspace-auto-generated-name": "const s=globalThis.__checkoutSuccessTest;export const n=()=>s.initializers.push('workspace-name');export const t=()=>s.workspaceName;",
  "chatgpt-token-auth.browser": "export const getChatGptTokenAuthHeaders=async options=>{globalThis.__checkoutSuccessTest.tokenAuthCalls.push(options);return{Authorization:'token'}};",
  "workspace-access.browser": "export const prepareWorkspaceAccess=async options=>{const s=globalThis.__checkoutSuccessTest;s.workspaceAccessCalls.push(options);return s.workspace};",
  "pending-image-download": "export const resumePendingCheckoutImageDownload=async options=>{globalThis.__checkoutSuccessTest.pendingImageCalls.push(options)};",
};

const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22",
  write: false, logLevel: "silent",
  plugins: [{ name: "checkout-success-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

let assertions = 3;
function check(value, message) { assert.ok(value, message); assertions += 1; }
function reset() {
  state.access = { data: null, error: null, isPending: false, refetches: 0 };
  state.accountId = "account-1"; state.apiGets = []; state.apiPosts = []; state.beacon = null; state.config = {};
  state.fulfillment = { data: null, error: null, isPending: true, refetches: 0 };
  state.historyWrites = []; state.identityLoading = false; state.location = { pathname: "/payments/success", search: "", hash: "" };
  state.locationAssignments = []; state.mutation = null; state.pendingImageCalls = []; state.promoReads = 0;
  state.provisioning = { data: null, error: null, isFetching: false, refetches: 0 }; state.queryFetches = []; state.queryOptions = {};
  state.refreshes = 0; state.search = new URLSearchParams("processor_entity=stripe&stripe_session_id=session-1&plan_type=plus");
  state.studentOnboarding = []; state.tokenAuthCalls = []; state.userId = "user-1"; state.workspace = { id: "workspace-1", name: "Acme" };
  state.workspaceAccessCalls = []; state.workspaceName = "Acme Workspace";
}
function render() { return module.CheckoutSuccessPage(); }
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; }
  output.push(value); walk(value.props?.children, output); return output;
}
function nodeByType(view, type) { return walk(view).find((node) => node.type === type); }
function textContent(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  return value.props?.defaultMessage ?? textContent(value.props?.children);
}

assert.deepEqual(Object.keys(module), ["CheckoutSuccessPage"]); assertions += 1;
check(state.initializers.length === 21, "initializes every static dependency runtime");
check(new Set(state.initializers).size === 21, "initializes static dependencies once");

reset(); state.search = new URLSearchParams();
let view = render();
check(view.type === "Redirect" && view.props.to === "/pricing", "redirects invalid checkout returns");

reset(); state.location.pathname = "/payments/success-team"; state.userId = null;
view = render();
check(view.type === "Redirect" && String(view.props.to).startsWith("/auth/login?"), "sends signed-out Business customers to login");

reset(); state.location.pathname = "/payments/success-team"; state.identityLoading = true;
view = render();
check(view.type === "CheckoutStatus" && view.props.stage === "confirming_payment", "shows Business confirmation loading");

reset(); view = render();
check(view.type === "CheckoutStatus" && view.props.loading === true, "shows personal fulfillment loading");
view.props.onRetry();
check(state.fulfillment.refetches === 1, "retries personal fulfillment");
const requestSignal = { aborted: false, throwIfAborted() {} };
await state.queryOptions["checkout-fulfillment"].queryFn({ signal: requestSignal });
check(state.apiPosts[0].path === "/payments/checkout_session", "confirms checkout through the fulfillment endpoint");

reset(); state.search.set("wallet_covered", "true"); render();
await state.queryOptions["checkout-fulfillment"].queryFn({ signal: requestSignal });
check(state.apiPosts[0].options.requestBody.payment_method_behavior === "skip_if_wallet_covered", "preserves wallet-covered fulfillment behavior");

reset(); state.fulfillment = { data: { workspace_provisioning: true }, error: null, isPending: false, refetches: 0 };
view = render();
check(view.type === "Redirect" && String(view.props.to).includes("durable_business_checkout=true"), "hands workspace provisioning to the Business route");

reset(); state.fulfillment = { data: { checkout_kind: "standard" }, error: null, isPending: false, refetches: 0 };
view = render();
check(nodeByType(view, "DocumentTitle")?.props.title === "Account - Payment success", "sets the success document title");
const continueButton = nodeByType(view, "Button");
check(textContent(continueButton).includes("Continue to ChatGPT"), "renders the continue action");
continueButton.props.onClick(); await state.mutation;
check(state.queryFetches.length === 2, "refreshes account and subscription state");
check(state.pendingImageCalls.length === 1, "resumes a pending image download after upgrade");
check(state.historyWrites[0] === "https://chatgpt.test/?refresh_account=true" && state.refreshes === 1, "returns to ChatGPT and refreshes application state");

reset(); state.search.set("campaign", "students_2026"); state.fulfillment = { data: { checkout_kind: "standard" }, error: null, isPending: false, refetches: 0 };
view = render(); nodeByType(view, "Button").props.onClick(); await state.mutation;
check(state.studentOnboarding.length === 1 && state.promoReads === 1, "records student onboarding and promo completion");

reset(); state.fulfillment = { data: { auto_top_up_enabled_after_checkout: false }, error: null, isPending: false, refetches: 0 };
view = render();
check(walk(view).some((node) => node.props?.role === "alert" && textContent(node).includes("automatic top-ups")), "warns when automatic top-up activation fails");

reset(); state.location.pathname = "/payments/success-team"; state.fulfillment = { data: { workspace_id: "workspace-1" }, error: null, isPending: false, refetches: 0 }; state.access = { data: state.workspace, error: null, isPending: false, refetches: 0 };
view = render();
check(textContent(view).includes("Your workspace is ready") && textContent(view).includes("Acme Workspace"), "renders the ready Business workspace");
nodeByType(view, "Button").props.onClick();
check(state.locationAssignments[0] === "https://chatgpt.test/", "opens the prepared workspace");
await state.queryOptions["business-checkout-access"].queryFn({ signal: requestSignal });
check(state.tokenAuthCalls.length === 1 && state.workspaceAccessCalls.length === 1, "prepares authenticated workspace access through dynamic dependencies");

reset(); state.location.pathname = "/payments/success-team"; state.fulfillment = { data: null, error: new Error("failed"), isPending: false, refetches: 0 };
view = render();
check(textContent(view).includes("Your workspace needs attention"), "shows Business recovery after fulfillment failure");
nodeByType(view, "Button").props.onClick();
check(state.fulfillment.refetches === 1, "retries the paid Business checkout without resubmitting payment");

console.log(assertions + " checkout success page assertions passed");
