import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/pricing-promotions/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "pricing-promotions-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
          path: value.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: value }) => ({
            contents:
              value === "app-initial"
                ? "export const TT=(messages)=>messages;"
                : "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const promotions = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const intl = {
  locale: "en-US",
  formatMessage(descriptor, values = {}) {
    return `${descriptor.id}:${JSON.stringify(values)}`;
  },
};

promotions.f();
promotions.m();
assert.equal(promotions.n, "plus-1-month-free-for-go");
assert.equal(promotions.r, "plus-1-month-free");
assert.equal(promotions.t, "go-1-month-free");
assert.equal(promotions.h.specialOffer.defaultMessage, "SPECIAL OFFER");

assert.equal(
  promotions.i({
    requestedPromoCampaignId: "plus-1-month-free",
    eligiblePlusPromoCampaignId: "plus-1-month-free",
  }),
  "plus-1-month-free",
);
assert.equal(
  promotions.i({
    requestedPromoCampaignId: "plus-1-month-free-for-go",
    eligiblePlusPromoCampaignId: "plus-1-month-free-for-go",
  }),
  undefined,
);
assert.equal(
  promotions.i({
    requestedPromoCampaignId: "plus-1-month-free-for-go",
    eligiblePlusPromoCampaignId: "plus-1-month-free-for-go",
    promoCampaignHandoffId: "plus-1-month-free-for-go",
  }),
  "plus-1-month-free-for-go",
);
assert.equal(
  promotions.i({
    eligiblePlusPromoCampaignId: "plus-1-month-free",
    shouldAutoApplyPlusOneMonthFreePromo: false,
  }),
  undefined,
);

assert.equal(
  promotions.c({ plan: "plus", promoCampaignId: "campaign" }),
  "campaign",
);
assert.equal(
  promotions.c({
    plan: "plus",
    promoCampaignId: "resurrection-discount-v1-plus",
    eligiblePromoCampaignId: "eligible",
  }),
  "eligible",
);
assert.equal(
  promotions.c({
    plan: "go",
    promoCampaignId: "resurrection-discount-v1-go",
    eligiblePromoCampaignId: "eligible",
  }),
  "eligible",
);

const syntheticPlus = promotions.s("plus", "plus-2-months-50-pct-off", intl);
assert.equal(syntheticPlus.discount.percentage, 50);
assert.equal(syntheticPlus.duration.num_periods, 2);
assert.equal(syntheticPlus.plan_name, "chatgptplusplan");
assert.equal(
  syntheticPlus.promotion_type_label.startsWith(
    "pricingPlanConstants.specialOffer",
  ),
  true,
);
const syntheticGo = promotions.s("go", "go-1-month-free", intl);
assert.equal(syntheticGo.discount.percentage, 100);
assert.equal(promotions.s("go", "unknown", intl), null);

assert.equal(
  promotions.a("plus", "free", { id: "offer", discount: { percentage: 50 } })
    .id,
  "offer",
);
assert.equal(
  promotions.a("plus", "plus", { id: "offer", discount: { percentage: 50 } }),
  null,
);
assert.equal(
  promotions.a("plus", "go", {
    id: promotions.n,
    discount: { percentage: 100 },
  }).id,
  promotions.n,
);
assert.equal(
  promotions.a("go", "free", {
    id: "resurrection-discount-v1-go",
    metadata: { plan_name: "wrong" },
    discount: { percentage: 100 },
  }),
  null,
);

assert.equal(
  promotions.o(true, "try_plus_free").defaultMessage,
  "Try Plus free",
);
assert.equal(
  promotions.o(false, "try_plus_free").defaultMessage,
  "Claim free offer",
);
assert.equal(
  promotions
    .u(intl, { period: "month", num_periods: 1 })
    .startsWith("pricingPlanConstants.promoCostSubtitleForSingleMonth"),
  true,
);
assert.equal(
  promotions.u(intl, { period: "year", num_periods: 2 }).includes("num_years"),
  true,
);
assert.equal(promotions.d({ daysUntilPlanRenews: 0 }), null);
const renewal = promotions.d({
  daysUntilPlanRenews: 2,
  daysUntilSubscriptionCancelAt: 5,
});
assert.equal(renewal instanceof Date, true);
assert.equal(renewal.getTime() > Date.now() + 4 * 86_400_000, true);
assert.equal(promotions.p({ discount: { percentage: 100 } }), true);
assert.equal(promotions.p({ discount: { percentage: 50 } }), false);

const details = promotions.l({
  intl,
  planName: "plus",
  promoMetadata: {
    credit_grant: { amount: "25" },
    discount: { percentage: 50 },
    duration: { period: "month", num_periods: 2 },
    schedule: { period: "month", start_after_num_periods: 1 },
  },
  promoCampaignId: "plus-2-months-50-pct-off",
  formattedCost: "$20",
  formattedDiscountedCost: "$10",
});
assert.equal(
  details.disclaimer.article.includes("chatgpt-plus-promotions"),
  true,
);
assert.equal(
  details.disclaimer.defaultMessage.includes("Promo terms apply"),
  false,
);
assert.equal(details.summary.includes("creditCount"), true);
assert.equal(details.scheduledCostDuration.includes("discounted_cost"), true);
assert.equal(Number.isFinite(details.fullPriceResumeDateTimestamp), true);

console.log("35 pricing promotions cluster assertions passed");
