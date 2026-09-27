import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

globalThis.__pricingPaymentTest = {
  intlInitializations: 0,
  modelInitializations: 0,
  FormattedMessage: Symbol("FormattedMessage"),
  jsx: {
    Fragment: Symbol("Fragment"),
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  },
  reasoningEffortMessages: {
    high: { id: "reasoningEffort.high", defaultMessage: "High" },
    xhigh: { id: "reasoningEffort.xhigh", defaultMessage: "Extra high" },
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
    plugins: [{
      name: "pricing-payment-foundation-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
          path: value.slice(8),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => {
          if (value === "app-initial") {
            return { contents: "export const TT=(messages)=>messages;", loader: "js" };
          }
          if (value === "app-shared") {
            return {
              contents: `
                const state=globalThis.__pricingPaymentTest;
                export const I3=()=>state.jsx;
                export const K2=()=>{state.intlInitializations+=1};
                export const Y2=state.FormattedMessage;
              `,
              loader: "js",
            };
          }
          if (value === "app-primary") {
            return {
              contents: `
                const state=globalThis.__pricingPaymentTest;
                export const cc=()=>{state.modelInitializations+=1};
                export const lc=state.reasoningEffortMessages;
              `,
              loader: "js",
            };
          }
          return { contents: "export {};", loader: "js" };
        });
      },
    }],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

const planNames = await bundle("plan-names");
planNames.r();
assert.equal(planNames.n({ planType: "pro" }), "Pro");
assert.equal(planNames.n({ planType: "prolite" }), "Pro");
assert.equal(planNames.n({ initialPlanType: "prolite", planType: "pro", updatedPlanType: "pro" }), "Pro 20x");
assert.equal(planNames.n({ initialPlanType: "pro", planType: "prolite", updatedPlanType: "prolite" }), "Pro 5x");
assert.equal(planNames.n({ planType: "plus" }), "Plus");
assert.equal(planNames.n({ planType: "go" }), "Go");
assert.equal(planNames.n({ planType: "team" }), null);
assert.equal(planNames.t.team.defaultMessage, "Business");

const pricing = await bundle("pricing");
pricing.r();
const priceCalls = [];
const intl = {
  formatNumber(value, options) {
    priceCalls.push({ kind: "format", value, options });
    return `${options.currency}:${value}`;
  },
  formatNumberToParts(value, options) {
    priceCalls.push({ kind: "parts", value, options });
    const currency = options.currencyDisplay === "narrowSymbol" ? "$" : options.currency;
    return [{ type: "currency", value: currency }, { type: "integer", value: String(value) }];
  },
};
assert.equal(pricing.t({ intl, amount: null, currencyCode: "USD" }), null);
assert.equal(pricing.t({ intl, amount: 12, currencyCode: "USD", minorUnitExponent: 0 }), "USD:12");
assert.equal(priceCalls[0].options.currencyDisplay, "narrowSymbol");
assert.equal(priceCalls[0].options.maximumFractionDigits, 0);
const formattedParts = pricing.n({ intl, amount: 12, currencyCode: "USD" });
assert.equal(formattedParts.currencyCodeLabel, "USD");
assert.equal(formattedParts.formatted, "$12");
assert.equal(priceCalls.filter((call) => call.kind === "parts").length, 2);
const codeOnlyIntl = {
  formatNumber() { return ""; },
  formatNumberToParts() { return [{ type: "currency", value: "XTS" }]; },
};
assert.equal(pricing.n({ intl: codeOnlyIntl, amount: 1, currencyCode: "XTS" }).currencyCodeLabel, null);

const translations = await bundle("model-and-reasoning-effort-translations");
translations.n();
assert.equal(globalThis.__pricingPaymentTest.intlInitializations, 1);
assert.equal(globalThis.__pricingPaymentTest.modelInitializations, 1);
const translation = translations.t({ effort: "xhigh" });
assert.equal(translation.type, globalThis.__pricingPaymentTest.FormattedMessage);
assert.deepEqual(translation.props, { id: "reasoningEffort.xhigh", defaultMessage: "Extra high" });

const stripePure = await bundle("stripe-pure");
stripePure.n();
stripePure.t();
assert.throws(
  () => stripePure.r.setLoadParameters({ advancedFraudSignals: "no" }),
  /invalid load parameters/,
);
stripePure.r.setLoadParameters({ advancedFraudSignals: false });
assert.equal(await stripePure.r("pk_test_server"), null);
assert.doesNotThrow(() => stripePure.r.setLoadParameters({ advancedFraudSignals: false }));
assert.throws(
  () => stripePure.r.setLoadParameters({ advancedFraudSignals: true }),
  /cannot change load parameters/i,
);

const payment = await bundle("stripe-payment-confirmation");
payment.o();
payment.r();
assert.equal(payment.i, "lock_timeout");
assert.equal(payment.a({ code: "insufficient_funds" }), "insufficient_funds");
assert.equal(payment.a({ code: "authentication_required" }), "authentication_failed");
assert.equal(payment.a({ decline_code: "generic_decline" }), "payment_method_declined");
assert.equal(payment.a({ code: "card_declined" }), "payment_method_declined");
assert.equal(payment.a({ code: "unknown" }), "other");
assert.equal(payment.n({ status: "requires_action" }), "authentication_failed");
assert.equal(payment.n({ status: "succeeded" }), null);
assert.equal(payment.n({ status: "requires_payment_method", last_payment_error: { code: "expired_card" } }), "expired_card");

const delays = [];
globalThis.window = {
  setTimeout(callback, duration) {
    delays.push(duration);
    callback();
    return 0;
  },
};
let confirmationCalls = 0;
const retryResult = await payment.t({
  async confirmPaymentIntent() {
    confirmationCalls += 1;
    return confirmationCalls < 3
      ? { error: { code: "lock_timeout" } }
      : { paymentIntent: { status: "succeeded" } };
  },
  shouldRetry: () => true,
});
assert.equal(confirmationCalls, 3);
assert.deepEqual(delays, [100, 250]);
assert.equal(retryResult.paymentIntent.status, "succeeded");

console.log("36 pricing and payment foundation cluster assertions passed");
