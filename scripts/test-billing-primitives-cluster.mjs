import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["billing-queries", "billing-query-error", "stripe-client", "billing-state", "billing-pricing", "subscription-queries", "billing-events", "card-tile"];
const state = globalThis.__billingPrimitivesTest = { requests: [], responses: [] };
state.jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
state.api = { async safeGet(pathname, options) { state.requests.push({ pathname, options }); return state.responses.shift() ?? {}; } };
const imports = new Map();
for (const directory of MODULES) { const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8"); for (const match of source.matchAll(/import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) { const names = imports.get(match[2]) ?? new Set(); for (const item of match[1].split(",")) names.add(item.trim().split(/\s+as\s+/)[0]); imports.set(match[2], names); } }
const overrides = {
  "app-shared": { I3: "() => globalThis.__billingPrimitivesTest.jsx" },
  "app-initial": { rJt: "globalThis.__billingPrimitivesTest.api" },
  "billing-pricing": { n: "() => undefined", t: "async input => globalThis.__billingPrimitivesTest.pricingResolver(input)" },
};
const sideEffects = new Set(["rolldown-runtime", "stripe-pure"]);
function mock(name) { if (sideEffects.has(name)) return "export {};"; return [...(imports.get(name) ?? [])].map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "() => undefined"};`).join("\n"); }
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "billing-primitives-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mock(importPath), loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); if ("type" in value && "props" in value) output.push(value); visit(value.props?.children); }; visit(root); return output; }

// billing-queries: 8
const queries = await bundle("billing-queries"); queries.n();
const billingInfo = queries.t("account-1");
assert.deepEqual(billingInfo.queryKey, ["consumer-billing", "account-1", "billing-info"]);
assert.equal(billingInfo.retry, false);
await billingInfo.queryFn({ signal: "billing-signal" });
assert.equal(state.requests.at(-1).pathname, "/payments/billing_info");
assert.equal(state.requests.at(-1).options.parameters.query.account_id, "account-1");
const paymentMethods = queries.r("account-2");
assert.deepEqual(paymentMethods.queryKey, ["consumer-billing", "account-2", "payment-methods"]);
await paymentMethods.queryFn({ signal: "payment-signal" });
assert.equal(state.requests.at(-1).pathname, "/payments/payment_methods");
const invalidated = [];
await queries.i({ queryClient: { invalidateQueries: ({ queryKey }) => invalidated.push(queryKey) } }, "account-3");
assert.deepEqual(invalidated[0], ["consumer-billing", "account-3"]);
assert.equal(invalidated.length, 3);

// billing-query-error: 4
const queryError = await bundle("billing-query-error"); queryError.n();
let retried = false;
const errorTree = queryError.t({ onRetry: () => { retried = true; } });
assert.equal(errorTree.props.role, "alert");
assert.match(errorTree.props.children[0].props.children, /Unable to load/);
errorTree.props.children[1].props.onClick();
assert.equal(retried, true);
assert.equal(errorTree.props.children[1].props.children, "Retry");

// stripe-client: 8
const stripe = await bundle("stripe-client"); stripe.n();
const lightAppearance = stripe.t(false);
assert.equal(lightAppearance.theme, "stripe");
assert.equal(stripe.t(true).theme, "night");
assert.equal(lightAppearance.labels, "floating");
state.responses.push({ publishable_key: "pk_test", currency: "USD" });
const stripeQuery = stripe.r("account-4");
assert.deepEqual(stripeQuery.queryKey, ["consumer-billing-setup", "account-4", "stripe-client"]);
assert.equal(stripeQuery.staleTime, Infinity);
const stripeResult = await stripeQuery.queryFn({});
assert.equal(stripeResult.stripe, "pk_test");
assert.equal(stripeResult.currency, "USD");
assert.equal(state.requests.at(-1).pathname, "/payments/stripe_client_bootstrap");

// billing-state: 10
const billingState = await bundle("billing-state"); billingState.r();
assert.equal(billingState.n({ entitlement: { has_active_subscription: false } }), null);
assert.equal(billingState.n({ entitlement: { has_active_subscription: true }, last_active_subscription: { purchase_origin_platform: "chatgpt_mobile_ios" } }), "app_store");
assert.equal(billingState.n({ entitlement: { has_active_subscription: true }, last_active_subscription: { purchase_origin_platform: "chatgpt_mobile_android" } }), "google_play_store");
assert.equal(billingState.n({ entitlement: { has_active_subscription: true }, last_active_subscription: { purchase_origin_platform: "partner_managed" } }), "partner_managed");
assert.equal(billingState.n({ entitlement: { has_active_subscription: true }, last_active_subscription: { purchase_origin_platform: "web" } }), null);
const now = new Date(2026, 8, 15);
assert.equal(billingState.i({ id: "expired", type: "card", card: { exp_month: 8, exp_year: 2026 } }, now), true);
assert.equal(billingState.i({ id: "valid", type: "card", card: { exp_month: 9, exp_year: 2026 } }, now), false);
assert.equal(billingState.i({ id: "bank", type: "bank" }, now), false);
assert.equal(billingState.t({ paymentMethod: { id: "spare" }, defaultPaymentMethodId: "default", autoReloadPaymentMethodId: "reload", autoReloadResolved: true }), true);
assert.equal(billingState.t({ paymentMethod: { id: "default" }, defaultPaymentMethodId: "default", autoReloadResolved: true }), false);

// billing-pricing: 7
const pricing = await bundle("billing-pricing"); pricing.n();
state.responses.push({ country_code: "DE", currency_config: { symbol_code: "EUR" } });
let resolved = await pricing.t({ country: "de", currency: "eur", isPricingEnabled: () => true });
assert.equal(resolved.country_code, "DE");
assert.equal(state.requests.at(-1).options.parameters.path.country_code, "DE");
state.responses.push({ country_code: "US", currency_config: { symbol_code: "USD" } });
resolved = await pricing.t({ isPricingEnabled: () => true });
assert.equal(resolved.country_code, "US");
state.responses.push({ country_code: "FR", currency_config: { symbol_code: "EUR", pricing_rollout_gate: "gate" } }, { country_code: "EU", currency_config: { symbol_code: "EUR" } });
resolved = await pricing.t({ country: "FR", isPricingEnabled: () => false });
assert.equal(resolved.country_code, "EU");
assert.equal(state.requests.at(-1).options.parameters.path.country_code, "EU");
state.responses.push({ country_code: "CA", currency_config: { symbol_code: "CAD" } }, { country_code: "USD", currency_config: { symbol_code: "USD" } });
resolved = await pricing.t({ country: "CA", currency: "USD", isPricingEnabled: () => true });
assert.equal(resolved.country_code, "USD");
assert.equal(state.requests.at(-1).pathname, "/checkout_pricing_config/configs/{country_code}");

// subscription-queries: 12
state.pricingResolver = async input => ({ country_code: input.country ?? "US", currency_config: { symbol_code: input.currency ?? "USD" } });
const subscriptions = await bundle("subscription-queries"); subscriptions.i();
assert.equal(subscriptions.r({ pricing_scope: "country", price_country: "JP", billing_currency: "JPY" }), "JP");
assert.equal(subscriptions.r({ pricing_scope: "default", price_country: null, billing_currency: "USD" }), "USD");
assert.equal(subscriptions.r({ pricing_scope: "country", price_country: null }), null);
const subscriptionQuery = subscriptions.o("account-5");
assert.deepEqual(subscriptionQuery.queryKey, ["consumer-billing", "account-5", "subscription"]);
await subscriptionQuery.queryFn({});
assert.equal(state.requests.at(-1).pathname, "/subscriptions");
const pricingQuery = subscriptions.a("account-5", { pricing_scope: "country", price_country: "JP", billing_currency: "JPY" }, () => true);
assert.equal(pricingQuery.enabled, true);
assert.equal((await pricingQuery.queryFn({})).country_code, "JP");
const renewal = subscriptions.n({ account: { plan_type: "plus" }, entitlement: { billing_period: "yearly", discount: { discount_expires_at: "2026-10-01" }, renews_at: "2026-10-01" } }, { billing_currency: "USD", billing_period: "yearly", price_country: null, pricing_scope: "default" }, { country_code: "US", currency_config: { symbol_code: "USD", plus: { year: { amount: 20 } } } }, Date.parse("2026-09-01"));
assert.equal(renewal.amount, 240);
assert.equal(renewal.currency, "USD");
assert.equal(renewal.period, "yearly");
assert.equal(subscriptions.n({ account: { plan_type: "free" }, entitlement: {} }, null, null), undefined);
assert.equal(subscriptions.t.safeParse(null).success, false);

// billing-events: 6
const events = await bundle("billing-events"); events.t();
const analytics = [];
const analyticsStore = { logEventWithStatsig: (name, metadata) => analytics.push({ name, metadata }) };
events.r(analyticsStore, { name: "billing_opened", metadata: { source: "settings" } });
assert.equal(analytics[0].name, "billing_opened");
assert.equal(analytics[0].metadata.source, "settings");
events.n(analyticsStore, new Error(JSON.stringify({ detail: { error_type: "declined", reason: "expired" } })));
assert.equal(analytics[1].name, "chatgpt_plan_management_modal_handle_update_error");
assert.equal(analytics[1].metadata.error_type, "declined");
assert.equal(analytics[1].metadata.reason, "expired");
events.n(analyticsStore, new Error("not-json"));
assert.deepEqual(analytics[2].metadata, {});

assertReleaseOwner("card-tile");

console.log("billing primitives cluster and card-tile release assertions passed");
