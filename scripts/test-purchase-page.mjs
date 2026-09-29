import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/purchase-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set(
  [...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map(
    (match) => match[1],
  ),
);

assert.deepEqual([...dependencies].sort(), [
  "account-action-integrity",
  "app-initial",
  "app-primary",
  "app-shared",
  "checkout-confirm-latency",
  "checkout-page-core",
  "checkout-policy",
  "checkout-session",
  "checkout-telemetry",
  "credit-purchase-page-core",
  "offer-queries",
  "promo-funnel-context",
  "queries",
  "rolldown-runtime",
  "workspace-auto-generated-name",
]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(
  source,
  /\b(?:accountIntegrityChunk|appInitialChunk|appPrimaryChunk|appSharedChunk|checkoutLatencyChunk|checkoutPageChunk|checkoutPolicyChunk|checkoutSessionChunk|checkoutTelemetryChunk|creditPurchaseChunk|offerQueriesChunk|promoFunnelChunk|queriesChunk|workspaceNameChunk)\s*\./,
);

const state = {
  accountId: "account-1",
  userId: "user-1",
  routePlan: "plus",
  location: { pathname: "/purchase/plus", search: "", state: null },
  accountQuery: { data: { id: "account-1", plan_type: "free" }, isLoading: false, isError: false },
  subscription: { data: null, isPending: false, error: null, refetches: 0 },
  promotion: { data: null, isPending: false, error: null, refetches: 0 },
  checkout: { data: null, isPending: true, error: null, refetches: 0 },
  workspaceName: "Acme Workspace",
  darkMode: false,
  configGates: {},
  dynamicConfig: {},
  queryOptions: {},
  initializers: [],
  invalidations: [],
  navigations: [],
  resets: [],
  integritySurfaces: [],
  apiCalls: [],
  apiResponse: { url: "https://checkout.test/session" },
  promoRecords: [],
  offerCalls: [],
  checkoutModes: [],
  stateIndex: 0,
  stateValues: [],
  stateSetCalls: [],
};
state.scope = {
  queryClient: { invalidateQueries(input) { state.invalidations.push(input); } },
};
globalThis.__purchasePageTest = state;

const mocks = {
  "app-shared": [
    "const state = globalThis.__purchasePageTest; const marker = name => () => state.initializers.push(name);",
    "export const $3 = marker('compiler'); export const FX = marker('signals'); export const K2 = marker('intl'); export const QI = marker('scope');",
    "export const Zh = marker('button'); export const gL = marker('use-query'); export const wL = marker('query-runtime');",
    "export const Y2 = 'FormattedMessage'; export const Yh = 'Button'; export const ZI = 'applicationScope'; export const vW = 'OpenAI-Account-ID';",
    "export const I3 = () => ({ Fragment: 'Fragment', jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) });",
    "export const e6 = () => ({ useEffect(effect) { effect(); }, useRef: value => ({ current: value }), useState(value) { const index = state.stateIndex++; const selected = index < state.stateValues.length ? state.stateValues[index] : value; return [selected, next => state.stateSetCalls.push({ index, next })]; } });",
    "export const LX = () => state.scope; export const fg = () => state.darkMode;",
    "export const BX = () => ({ data: state.workspaceName, isLoading: false, error: null });",
    "export const _L = options => { const key = String(options.queryKey?.[0] ?? 'unknown'); state.queryOptions[key] = options; const source = key === 'subscription' ? state.subscription : key === 'purchase-promotion' ? state.promotion : key === 'subscription-checkout-create' ? state.checkout : { data: null, isPending: false, error: null, refetches: 0 }; return { ...source, refetch() { source.refetches += 1; } }; };",
  ].join('\n'),
  "app-initial": [
    "const state = globalThis.__purchasePageTest; const marker = name => () => state.initializers.push(name);",
    "export const M6t = marker('account-models'); export const Qgn = marker('auth'); export const cJt = marker('api'); export const ifn = marker('feature-gates'); export const rht = marker('account-queries');",
    "export const Ygn = 'Redirect'; export const mC = 'workspaceNameFamily';",
    "export const N6t = () => ({ accountId: state.accountId, userId: state.userId }); export const l_n = () => ({ plan: state.routePlan }); export const i_n = () => state.location;",
    "export const _0 = input => '/pricing' + (input?.search ?? ''); export const uht = () => state.accountQuery;",
    "export const o_n = () => (destination, options) => state.navigations.push({ destination, options });",
    "export const XP = (scope, attempt) => state.resets.push({ scope, attempt });",
    "export const lfn = () => ({ checkGate: key => state.configGates[key] ?? false, getDynamicConfig: key => ({ get(name, fallback) { return state.dynamicConfig[key + ':' + name] ?? fallback; } }), getLayer: () => ({ get(_name, fallback) { return fallback; } }) });",
    "export const rJt = { safePost: async (path, input) => { state.apiCalls.push({ path, input }); return state.apiResponse; } };",
  ].join('\n'),
  "app-primary": "const state = globalThis.__purchasePageTest; export const ph = () => state.initializers.push('checkout-selection'); export const sh = () => state.initializers.push('workspace-checkout');",
  queries: "const state = globalThis.__purchasePageTest; export const i = () => state.initializers.push('subscription-queries'); export const n = accountId => ({ queryKey: ['subscription', accountId] });",
  "checkout-policy": "const state = globalThis.__purchasePageTest; export const S = () => state.initializers.push('checkout-policy'); export const E = request => { state.checkoutModes.push(request); return 'custom'; };",
  "checkout-telemetry": "const state = globalThis.__purchasePageTest; export const r = () => state.initializers.push('checkout-telemetry'); export const t = { ALL_PLANS_PRICING_MODAL: 'all_plans_pricing_modal' };",
  "account-action-integrity": "const state = globalThis.__purchasePageTest; export const n = () => state.initializers.push('integrity'); export const i = async surface => { state.integritySurfaces.push(surface); return { 'Integrity-Token': 'token-1' }; };",
  "checkout-session": "const state = globalThis.__purchasePageTest; export const I = () => state.initializers.push('checkout-session'); export const d = () => state.initializers.push('checkout-plan-data'); export const o = () => state.initializers.push('checkout-route'); export const u = 'CheckoutReturn';",
  "checkout-confirm-latency": "const state = globalThis.__purchasePageTest; export const m = () => state.initializers.push('checkout-loading'); export const p = 'CheckoutLoadingState';",
  "checkout-page-core": "const state = globalThis.__purchasePageTest; export const r = () => state.initializers.push('checkout-page'); export const n = 'HostedCheckout';",
  "offer-queries": "const state = globalThis.__purchasePageTest; export const r = () => state.initializers.push('offer-queries'); export const n = async input => { state.offerCalls.push(input); return state.promotion.data; };",
  "promo-funnel-context": "const state = globalThis.__purchasePageTest; export const n = () => state.initializers.push('promo-funnel'); export const r = input => state.promoRecords.push(input);",
  "credit-purchase-page-core": "const state = globalThis.__purchasePageTest; export const n = () => state.initializers.push('credit-purchase'); export const t = 'CreditPurchasePage';",
  "workspace-auto-generated-name": "const state = globalThis.__purchasePageTest; export const n = () => state.initializers.push('workspace-name'); export const t = (_intl, workspace, generated) => workspace?.id ? 'Existing Workspace' : generated ?? 'New Workspace';",
  "rolldown-runtime": "export {};",
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
    name: "purchase-page-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: mocks[importPath] ?? "export {};" }));
    },
  }],
});

const purchasePage = await import(
  "data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"),
);

let assertions = 3;
function check(value, message) { assert.ok(value, message); assertions += 1; }
function reset() {
  state.accountId = "account-1"; state.userId = "user-1"; state.routePlan = "plus";
  state.location = { pathname: "/purchase/plus", search: "", state: null };
  state.accountQuery = { data: { id: "account-1", plan_type: "free" }, isLoading: false, isError: false };
  state.subscription = { data: null, isPending: false, error: null, refetches: 0 };
  state.promotion = { data: null, isPending: false, error: null, refetches: 0 };
  state.checkout = { data: null, isPending: true, error: null, refetches: 0 };
  state.workspaceName = "Acme Workspace"; state.darkMode = false; state.configGates = {}; state.dynamicConfig = {}; state.queryOptions = {};
  state.invalidations = []; state.navigations = []; state.resets = []; state.integritySurfaces = []; state.apiCalls = [];
  state.apiResponse = { url: "https://checkout.test/session" }; state.promoRecords = []; state.offerCalls = []; state.checkoutModes = [];
  state.stateIndex = 0; state.stateValues = []; state.stateSetCalls = [];
}
function renderPage() { state.stateIndex = 0; return purchasePage.PurchasePage(); }
function renderFlow() { const node = renderPage(); return { node, flow: node.type(node.props) }; }
function signal() { return { aborted: false, throws: 0, throwIfAborted() { this.throws += 1; } }; }

check(Object.keys(purchasePage).sort().join(',') === "PricingCheckoutPreparation,PurchasePage", "preserves both public exports");
check(state.initializers.length === 27, "runs every published dependency initializer");
check(new Set(state.initializers).size === 27, "initializes dependencies once");

reset(); state.routePlan = "credits";
check(renderPage().type === "CreditPurchasePage", "routes credit purchases to the credit page");
reset(); state.routePlan = "enterprise";
const invalid = renderPage();
check(invalid.type === "Redirect" && invalid.props.to === "/pricing", "redirects invalid purchase plans");
reset(); state.accountId = null;
const anonymous = renderPage();
check(anonymous.type === "CheckoutLoadingState" && anonymous.props.loading === true, "waits for checkout identity");
reset();
const entry = renderPage();
check(entry.key === "user-1:account-1:plus", "keys checkout by user, account, and plan");
check(typeof entry.type === "function" && entry.props.plan === "plus", "creates the semantic checkout flow");

reset();
const invalidPreparation = purchasePage.PricingCheckoutPreparation({ route: "/purchase/bad", onPrepared() {} });
check(invalidPreparation.type === "Redirect", "rejects invalid preparation routes");
reset(); state.userId = null;
const preparationLoading = { type: "loading-content" };
check(purchasePage.PricingCheckoutPreparation({ route: "/purchase/pro", loadingContent: preparationLoading, onPrepared() {} }) === preparationLoading, "uses caller loading content while identity resolves");
reset(); state.location = { pathname: "/pricing", search: "?old=1", state: { source: "pricing" } };
const prepared = purchasePage.PricingCheckoutPreparation({ route: "/purchase/pro?promoCode=SAVE", cancelHref: "/pricing/back", checkoutEntryPoint: "pricing_modal", pricingCheckoutId: "pricing-1", upsellContextId: "upsell-1", loadingContent: preparationLoading, onPrepared() {} });
check(prepared.key === "user-1:account-1:/purchase/pro?promoCode=SAVE", "keys prepared checkout by the full route");
check(prepared.props.location.pathname === "/purchase/pro" && prepared.props.location.search === "?promoCode=SAVE", "uses the prepared route location");
check(prepared.props.preparation.cancelHref === "/pricing/back" && prepared.props.preparation.pricingCheckoutId === "pricing-1", "forwards preparation metadata");

reset(); state.accountQuery = { data: null, isLoading: true, isError: false };
const accountLoading = renderFlow().flow;
check(accountLoading.type === "CheckoutLoadingState" && accountLoading.props.loading === true, "shows account loading state");
accountLoading.props.onRetry();
check(state.invalidations[0].queryKey.join('/') === "accounts/check", "retries account resolution");

reset(); state.accountQuery = { data: { id: "account-1", plan_type: "plus" }, isLoading: false, isError: false };
state.subscription = { data: { entitlement: { has_active_subscription: true }, last_active_subscription: { purchase_origin_platform: "web" } }, isPending: false, error: null, refetches: 0 };
const activeSubscription = renderFlow().flow;
check(activeSubscription.type === "Redirect" && activeSubscription.props.to.includes("plan=plus"), "returns active subscribers to pricing");

reset(); state.routePlan = "team"; state.location = { pathname: "/purchase/team", search: "?standardSeats=2&premiumSeats=0", state: null };
state.accountQuery = { data: { id: "account-1", plan_type: "free_workspace", account_user_role: "member" }, isLoading: false, isError: false };
check(renderFlow().flow.type === "Redirect", "blocks non-owner workspace purchases");

reset(); state.routePlan = "team"; state.location = { pathname: "/purchase/team", search: "", state: null }; state.dynamicConfig["1069053961:redirect_team_purchase_to_create_workspace"] = true;
const createWorkspace = renderFlow().flow;
check(createWorkspace.type === "Redirect" && createWorkspace.props.to === "/create-workspace", "redirects team purchases to workspace creation when configured");

reset(); state.location.search = "?promoCode=SAVE"; state.promotion = { data: null, isPending: true, error: null, refetches: 0 };
const promoLoading = renderFlow().flow;
check(promoLoading.type === "CheckoutLoadingState" && promoLoading.props.loading === true, "shows promotion eligibility loading");
promoLoading.props.onRetry();
check(state.promotion.refetches === 1, "retries promotion eligibility");

reset(); state.location.search = "?promoCode=SAVE"; state.promotion = { data: null, isPending: false, error: new Error("promo failed"), refetches: 0 };
const promoError = renderFlow().flow;
check(promoError.type === "CheckoutReturn", "shows the contained promotion error state");
check(promoError.props.children[0].props.children.props.defaultMessage === "This promotion isn’t available for this checkout", "explains unavailable promotions");
promoError.props.children[1].props.onClick();
check(state.promotion.refetches === 1, "retries failed promotion requests");

reset(); state.location.search = "?promoCode=SAVE"; state.promotion = { data: { is_eligible: true, metadata: { plan_name: "chatgptplusplan" } }, isPending: false, error: null, refetches: 0 };
const eligible = renderFlow();
const checkoutOptions = state.queryOptions["subscription-checkout-create"];
check(checkoutOptions.enabled === true, "enables checkout after eligibility resolves");
check(checkoutOptions.queryKey[3].plan_name === "chatgptplusplan" && checkoutOptions.queryKey[3].promo_code === "SAVE", "builds the personal plan request with promotion");
const requestSignal = signal();
const response = await checkoutOptions.queryFn({ signal: requestSignal });
check(response.url === "https://checkout.test/session" && requestSignal.throws === 2, "creates and validates the checkout session");
check(state.integritySurfaces[0] === "chatgpt_checkout", "requests checkout integrity headers");
check(state.apiCalls[0].path === "/payments/checkout", "posts to the checkout endpoint");
check(state.apiCalls[0].input.additionalHeaders["ChatGPT-Account-ID"] === "account-1" && state.apiCalls[0].input.additionalHeaders["Integrity-Token"] === "token-1", "sends account and integrity headers");
check(state.apiCalls[0].input.requestBody.checkout_ui_mode === "custom" && state.apiCalls[0].input.requestBody.checkout_appearance === "light", "adds checkout mode and appearance");
check(state.promoRecords[0].promoCode === "SAVE", "records applied promotion telemetry");

reset(); state.checkout = { data: { url: "https://checkout.test/live" }, isPending: false, error: null, refetches: 0 };
const hosted = renderFlow().flow;
check(hosted.type === "HostedCheckout" && hosted.props.url === "https://checkout.test/live", "opens hosted checkout URLs");

reset(); state.location.search = "?source=pricing"; state.checkout = { data: { tag: "custom_checkout_session", checkout_session_id: "cs_custom" }, isPending: false, error: null, refetches: 0 };
const custom = renderFlow().flow;
check(custom.type === "Redirect" && custom.props.to === "/checkout/cs_custom?source=pricing", "routes custom checkout sessions internally");
check(custom.props.state.checkoutRequest.plan_name === "chatgptplusplan", "passes the checkout request to custom checkout");

reset(); state.checkout = { data: null, isPending: false, error: { status: 403 }, refetches: 0 };
const unavailable = renderFlow().flow;
check(unavailable.type === "CheckoutReturn" && unavailable.props.children.props.role === "alert", "shows account-denied checkout state");

reset();
const pending = renderFlow().flow;
check(pending.type === "CheckoutLoadingState" && pending.props.loading === true, "shows checkout creation progress");
pending.props.onRetry();
check(state.resets.length === 1 && state.checkout.refetches === 1, "resets checkout telemetry before retrying");

reset(); state.routePlan = "team"; state.location = { pathname: "/purchase/team", search: "?standardSeats=3&premiumSeats=2&price_interval=year", state: null };
renderFlow();
const teamRequest = state.queryOptions["subscription-checkout-create"].queryKey[3];
check(teamRequest.plan_name === "chatgptteamplan" && teamRequest.team_plan_data.workspace_name === "Acme Workspace", "builds the workspace checkout request");
check(teamRequest.team_plan_data.seat_quantity === 5 && teamRequest.team_plan_data.seat_quantities[1].quantity === 2, "preserves standard and premium seat quantities");
check(teamRequest.team_plan_data.price_interval === "year", "preserves the selected team billing interval");

reset(); state.routePlan = "pro5x";
renderFlow();
check(state.queryOptions["subscription-checkout-create"].queryKey[3].plan_name === "chatgptpro", "maps the pro5x route to the published pro plan name");

reset();
let preparedResponse = null;
const preparedNode = purchasePage.PricingCheckoutPreparation({ route: "/purchase/plus", loadingContent: preparationLoading, onPrepared(responseValue, requestValue) { preparedResponse = { responseValue, requestValue }; } });
preparedNode.type(preparedNode.props);
await state.queryOptions["subscription-checkout-create"].queryFn({ signal: signal() });
check(preparedResponse.responseValue.url === "https://checkout.test/session", "notifies prepared checkout callers");
state.checkout = { data: { url: "https://checkout.test/session" }, isPending: false, error: null, refetches: 0 };
const preparedLoadingResult = preparedNode.type(preparedNode.props);
check(preparedLoadingResult === preparationLoading, "keeps caller loading content after preparation");

console.log(`${assertions} Purchase page assertions passed`);
