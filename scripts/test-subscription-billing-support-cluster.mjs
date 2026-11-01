import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__subscriptionBillingSupportTest = {
  jsx: {
    Fragment: "Fragment",
    jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
    jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  },
};
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{ name: "subscription-billing-support-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared"
        ? "export const I3=()=>globalThis.__subscriptionBillingSupportTest.jsx;"
        : importPath === "app-initial"
          ? "export const EI=({currencyCode})=>['JPY','KRW','CLP'].includes(currencyCode)?0:['BHD','KWD'].includes(currencyCode)?3:2;"
          : "export {};", loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
function text(node) {
  const parts = [];
  const visit = value => {
    if (typeof value === "string" || typeof value === "number") return parts.push(String(value));
    if (value == null || typeof value !== "object") return;
    const children = value.props?.children;
    if (Array.isArray(children)) children.flat(Infinity).forEach(visit); else visit(children);
  };
  visit(node);
  return parts.join(" ");
}

// subscription-plan-status: 7
const status = await bundle("subscription-plan-status");
assert.deepEqual(Object.keys(status), ["n", "r", "t"]);
assert.equal(status.t({ plan: "free" }), "ChatGPT Free");
assert.equal(status.t({ plan: "prolite", showProLevels: true }), "ChatGPT Pro 5x");
const account = (plan, entitlement = {}, willRenew = true) => ({ account: { plan_type: plan }, entitlement, last_active_subscription: { will_renew: willRenew } });
assert.match(text(status.n({ account: account("free") })), /everyday tasks/);
assert.match(text(status.n({ account: account("plus", { is_delinquent: true }) })), /plan is paused/);
assert.match(text(status.n({ account: account("plus", { scheduled_plan_change: { plan_type: "go", changes_at: "2026-11-01T00:00:00Z" } }) })), /changes to ChatGPT Go/);
assert.match(text(status.n({ account: account("plus", { expires_at: "2026-11-01T00:00:00Z" }, false) })), /will expire/);

// format-amount: 5
const amount = await bundle("format-amount");
assert.deepEqual(Object.keys(amount), ["n", "t"]);
const calls = [];
const intl = { formatNumber(value, options) { calls.push({ value, options }); return `${options.currency}:${value}`; } };
assert.equal(amount.t(intl, 1234, "usd"), "USD:12.34");
assert.deepEqual(calls[0], { value: 12.34, options: { style: "currency", currency: "USD" } });
assert.equal(amount.t(intl, 1234, "JPY"), "JPY:1234");
assert.equal(calls[1].options.currency, "JPY");

// payment-method-display: 5
const payment = await bundle("payment-method-display");
assert.deepEqual(Object.keys(payment), ["n", "t"]);
const card = payment.t({ type: "card", card: { brand: "visa", last4: "4242" } });
assert.equal(card.label, "Visa");
assert.equal(text(card.description), "•••• 4242");
assert.equal(text(payment.t({ type: "paypal", paypal: { payer_email: "payer@example.com" } }).description), "payer@example.com");
assert.equal(payment.t({ type: "unknown" }).label, "Payment method");

// cadence-events: 12
const cadence = await bundle("cadence-events");
assert.deepEqual(Object.keys(cadence).sort(), ["a", "c", "i", "n", "o", "r", "s", "t"]);
assert.equal(cadence.c({ amount_due: { amount: 0 }, renewal_date: "2026-11-01T00:00:00Z" }), true);
assert.equal(cadence.c({ amount_due: { amount: 1 }, renewal_date: "2026-11-01T00:00:00Z" }), false);
const cadenceState = cadence.i(
  { plan_type: "plus" },
  { active_until: "2026-11-01T00:00:00Z", billing_currency: "USD", billing_period: "monthly", will_renew: true },
  { country_code: "US", currency_config: { symbol_code: "USD", plus: { month: { amount: 20 }, year: { amount: 15 } } } },
  Date.parse("2026-09-01T00:00:00Z"),
);
assert.equal(cadenceState.currentCadence, "monthly");
assert.equal(cadenceState.annualSavingsAmount, 60);
assert.equal(cadenceState.annualSavingsPercentage, 25);
assert.equal(cadenceState.isAcquisitionCandidate, true);
assert.equal(cadence.a(cadenceState, "yearly"), "change_to_annual");
assert.equal(cadence.r(new Error("another plan change is pending"), "monthly"), "conflicting_plan_change");
assert.equal(cadence.s({ structure: "personal", plan_type: "plus" }), true);
assert.equal(cadence.s({ structure: "team", plan_type: "plus" }), false);
const cadenceEvents = [];
cadence.n({ log(event) { cadenceEvents.push(event); } }, { action: "shown" });
assert.deepEqual(cadenceEvents, [{ action: "shown" }]);

// delinquent-upgrade-preparation: 7
const preparation = await bundle("delinquent-upgrade-preparation");
assert.deepEqual(Object.keys(preparation), ["n", "r", "t"]);
assert.equal(await preparation.r({ accountId: "a", userId: "u", initialPlan: "free", updatedPlan: "plus" }), null);
assert.equal(await preparation.r({ accountId: "a", userId: "u", initialPlan: "plus", updatedPlan: "pro", hasPromotion: true }), null);
const attempt = await preparation.r({ accountId: "a", userId: "u", initialPlan: "plus", updatedPlan: "pro", pricingInfo: { currency: "USD" } });
assert.equal(attempt.updatedPlan, "pro");
assert.equal(typeof attempt.attemptId, "string");
assert.equal(preparation.t(new Error(JSON.stringify({ detail: { error_type: "payment_failed" } }))), "payment_failed");
assert.equal(preparation.t(new Error("subscription update already in progress")), "subscription_update_pending");

// subscription-recovery-events: 4
const recovery = await bundle("subscription-recovery-events");
assert.deepEqual(Object.keys(recovery), ["n", "r", "t"]);
const events = [];
const scope = { logProductEvent(descriptor, payload) { events.push({ descriptor, payload }); } };
recovery.r(scope, "cta_clicked", { source: "banner" });
recovery.t(scope, "payment_succeeded", { invoiceId: "invoice" });
assert.equal(events[0].descriptor, "subscription_payment_recovery_announcement");
assert.deepEqual(events[0].payload, { source: "banner", actionType: "cta_clicked" });
assert.deepEqual(events[1], { descriptor: "subscription_payment_recovery_modal", payload: { invoiceId: "invoice", actionType: "payment_succeeded" } });

console.log("40 subscription billing support cluster assertions passed");
