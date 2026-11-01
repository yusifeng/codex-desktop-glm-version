import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__checkoutSessionTest = {
  jsx: {
    Fragment: "fragment",
    jsx(type, props, key) { return typeof type === "function" ? type(props) : { type, props, key }; },
    jsxs(type, props, key) { return typeof type === "function" ? type(props) : { type, props, key }; },
  },
};
const result = await esbuild.build({
  entryPoints: [path.join(root, "src/renderer/checkout-session/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "checkout-session-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath, namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
        contents: importPath.endsWith("app-shared") ? "export const I3 = () => globalThis.__checkoutSessionTest.jsx;" : "export {};",
        loader: "js",
      }));
    },
  }],
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
const checkout = await import(moduleUrl);
let assertions = 0;
const check = (value, message) => { assert.ok(value, message); assertions += 1; };

const valid = checkout.r.safeParse({ processorEntity: "openai_llc", checkoutSessionId: "cs_test_123" });
check(valid.success, "accepts Stripe checkout session");
check(valid.data.checkoutSessionId === "cs_test_123", "preserves checkout session id");
check(checkout.r.safeParse({ processorEntity: "openai_ie", checkoutSessionId: "oaics_abc_9" }).success, "accepts OpenAI checkout session");
check(!checkout.r.safeParse({ processorEntity: "other", checkoutSessionId: "cs_test" }).success, "rejects unknown processor");
check(!checkout.r.safeParse({ processorEntity: "openai_llc", checkoutSessionId: "bad" }).success, "rejects malformed session id");
check(checkout.s.safeParse("team").success, "accepts supported plan");
check(!checkout.s.safeParse("enterprise").success, "rejects unsupported plan");
check(checkout.t.length === 5 && checkout.rt.pro === "chatgptpro", "publishes plan mapping");

check(checkout.b({ amountMinorUnits: 1234, currency: "USD", locale: "en-US" }) === "$12.34", "formats two-decimal currencies");
check(checkout.b({ amountMinorUnits: 1234, currency: "JPY", locale: "ja-JP" }).includes("1,234"), "formats zero-decimal currencies");
check(checkout.B({ monthlyAmount: 20, annualMonthlyEquivalent: 16 }) === 20, "calculates annual savings percent");
check(checkout.B({ monthlyAmount: 0, annualMonthlyEquivalent: 0 }) === 0, "guards invalid annual price");
check(checkout.H(20, 15) === 25, "calculates discount percent");
const intl = { locale: "en-US", formatMessage: ({ defaultMessage }) => defaultMessage };
check(checkout.J("month", intl) === "month", "formats billing interval noun");
check(checkout.T.FLEXIBLE === "month" && checkout.T.ANNUAL === "year", "publishes billing interval constants");

check(checkout.E({ configuredDefaultSeats: "7", fallbackDefaultSeats: 5, maxSeats: 20, minimumSeats: 2 }) === 7, "reads configured default seats");
check(checkout.E({ configuredDefaultSeats: 99, fallbackDefaultSeats: 5, maxSeats: 20, minimumSeats: 2 }) === 20, "clamps configured seats to maximum");
check(checkout.M({ isFreeWorkspace: true, workspaceMemberCount: 9 }).minimumSeats === 9, "uses current workspace members as minimum");
const bounds = checkout.A({ standardQuantity: 4, premiumQuantity: 1, minimumSeats: 5, maximumSeats: 20 });
check(bounds.standardMinimum === 4 && bounds.premiumMinimum === 1, "derives cross-seat minimums");
check(bounds.standardMaximum === 19 && bounds.premiumMaximum === 16, "derives cross-seat maximums");

const parsed = checkout.O("?promoCode=SAVE&price_interval=month&numSeats=12");
check(parsed.promoCode === "SAVE" && parsed.promoCampaign === null, "parses promo code");
check(parsed.priceInterval === "month" && parsed.requestedSeatQuantity === 12, "parses interval and seat count");
const campaign = checkout.O("?promo_campaign=trial");
check(campaign.promoCampaign === "trial" && campaign.priceInterval === "month", "defaults campaign checkout to flexible interval");
check(checkout.k({ input: parsed, metadata: { plan_name: "chatgptteamplan" } }).promo_code === "SAVE", "builds team promo request");
check(checkout.k({ input: campaign, eligibleCampaign: "trial" }).promo_campaign.promo_campaign_id === "trial", "builds eligible campaign request");

const items = [
  { id: "standard", quantity: 3, recurring: { interval: "month" }, subtotal: { minorUnitsAmount: 3000 } },
  { id: "premium", quantity: 2, recurring: { interval: "month" }, subtotal: { minorUnitsAmount: 4000 } },
];
const aggregate = checkout.P(items, { standard: { seat_type: "default" }, premium: { seat_type: "prolite" } });
check(aggregate.isMapped && aggregate.quantity === 5, "aggregates mapped seat line items");
check(aggregate.standardQuantity === 3 && aggregate.premiumQuantity === 2, "separates standard and premium quantities");
check(aggregate.standardAmountMinorUnits === 3000 && aggregate.premiumAmountMinorUnits === 4000, "separates seat amounts");
const breakdown = checkout.it({ businessSeatLineItems: { standard: { seat_type: "default" }, premium: { seat_type: "prolite" } }, lineItems: items, subtotalMinorUnits: 7000 });
check(breakdown.length === 2 && breakdown[1].type === "premium", "creates validated business seat breakdown");
check(checkout.it({ businessSeatLineItems: {}, lineItems: items, subtotalMinorUnits: 7000 }) === null, "rejects unmapped seat breakdown");

const metadata = checkout.j({ checkout_provider: "open_ai", plan_name: "chatgptteamplan", checkout_state: { lineItems: [{ id: "line", seatType: "prolite", lineRole: "renewal", recurring: {} }] } });
check(metadata.line.seat_type === "prolite", "recovers legacy checkout line metadata");
check(checkout.j({ checkout_provider: "stripe", plan_name: "chatgptteamplan" }) === null, "does not infer metadata for other providers");
check(checkout.L({ currentPlan: "year", nextPlan: "month", hasFreeTrialPromo: true, hideSeatPickerLayerEnabled: true }), "hides seat picker for trial downgrade transition");
check(checkout.R({ isFreeTrial: false, isStandardBusinessCheckout: true, serverEnabled: "true", isEnabledForCheckout: () => false }), "honors premium-seat server override");

const checkoutValue = { lineItems: items, total: { subtotal: { minorUnitsAmount: 7000 }, discount: { minorUnitsAmount: 1000 }, taxInclusive: { minorUnitsAmount: 500 }, total: { minorUnitsAmount: 6500 } } };
check(checkout.Y(checkoutValue) === 3000, "uses recurring plan line item subtotal");
check(checkout.Z(checkoutValue) === 5500, "calculates due-before-tax amount");
check(checkout.h({ checkout: checkoutValue }).renewalAmountMinorUnits === 3000, "derives first-month renewal amount");
check(checkout.y({ discountAmounts: [{ minorUnitsAmount: 300 }, { minorUnitsAmount: 200 }], currency: "USD", locale: "en-US" }).minorUnitsAmount === 500, "combines discount amounts");
check(checkout.g("DE") && !checkout.g("US"), "recognizes VAT countries");
check(checkout.K("US") && !checkout.K("XX"), "recognizes checkout countries");

const verify = checkout.n({ checkout_session_id: "cs_test", processor_entity: "openai_llc", confirm_return_url: "https://chatgpt.com/back?account_id=acct&plan_type=plus" }, { campaign: "spring" });
const verifyUrl = new URL(verify, "https://chatgpt.com");
check(verifyUrl.pathname === "/checkout/verify", "builds checkout verify route");
check(verifyUrl.searchParams.get("stripe_session_id") === "cs_test", "includes checkout session in verify route");
check(verifyUrl.searchParams.get("account_id") === "acct" && verifyUrl.searchParams.get("plan_type") === "plus", "carries trusted return parameters");
check(verifyUrl.searchParams.get("campaign") === "spring", "merges explicit verify parameters");
check(checkout.i("acct", valid.data).join(":") === "subscription-checkout:acct:openai_llc:cs_test_123", "creates account-isolated checkout query key");

const shell = checkout.u({ children: "Complete", returnPath: "/pricing" });
check(shell.type === "main" && shell.props["data-checkout-shell"] === true, "renders checkout shell landmark");
check(shell.props["aria-busy"] === false, "checkout shell defaults to idle");
const form = checkout.f({ children: "Payment", pending: true });
check(form.type === "form" && form.props["aria-busy"] === true, "renders pending checkout form");
check(form.props.children[2].props.disabled === true, "disables checkout submit while pending");
const error = checkout.c({ error: new Error("Card declined"), onRetry() {} });
check(error.props.children[0].props.role === "alert", "renders checkout error alert");
check(error.props.children[0].props.children === "Card declined", "shows actionable checkout error");
const summary = checkout.v({ checkout: checkoutValue, currency: "USD", locale: "en-US" });
check(summary.type === "dl", "renders semantic checkout summary");
check(summary.props.children.some((node) => node.props?.children === "$65.00"), "renders checkout total");

console.log(`${assertions} checkout session contract assertions passed`);
