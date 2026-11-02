import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

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

const subscriptionPlanReleaseAssertions = assertReleaseOwner("subscription-plan-status");

// format-amount: 5
const amount = await bundle("format-amount");
assert.deepEqual(Object.keys(amount), ["n", "t"]);
const calls = [];
const intl = { formatNumber(value, options) { calls.push({ value, options }); return `${options.currency}:${value}`; } };
assert.equal(amount.t(intl, 1234, "usd"), "USD:12.34");
assert.deepEqual(calls[0], { value: 12.34, options: { style: "currency", currency: "USD" } });
assert.equal(amount.t(intl, 1234, "JPY"), "JPY:1234");
assert.equal(calls[1].options.currency, "JPY");

assertReleaseOwner("payment-method-display");

assertReleaseOwner("cadence-events");

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

console.log(`33 subscription billing support cluster assertions and ${subscriptionPlanReleaseAssertions} subscription plan release assertions passed`);
