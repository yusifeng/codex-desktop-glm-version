import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";
import type { IntlShape, MessageDescriptor } from "@rchunk/app-shared";

const { TT: defineMessages } = appInitialChunk;

type BillingPeriod = "hour" | "month" | "year";
type PlanType = "go" | "plus";

interface PromotionDuration {
  num_periods: number;
  period: BillingPeriod;
}

interface PromotionDiscount {
  amount?: number;
  percentage?: number;
}

interface PromotionMetadata {
  credit_grant?: { amount?: number | string | null };
  discount: PromotionDiscount;
  duration?: PromotionDuration;
  id?: string;
  metadata?: { plan_name?: string };
  no_auto_renewal_at_discount_end?: boolean;
  plan_type_change?: string;
  schedule?: { period?: BillingPeriod; start_after_num_periods?: number };
  summary?: string;
}

const promotionMessages = defineMessages({
  applyToSubscription: {
    id: "pricingPlanConstants.promo.callToAction",
    defaultMessage: "Apply to My Subscription",
  },
  promotionalRenewalSucceeded: {
    id: "planManagement.successfullyRenewedSubscriptionPromotion2",
    defaultMessage:
      "Your subscription has been updated and will auto-renew at your promotional rate of {promotionalCost} on {renewalDate}.",
  },
  promotionalDowngradeSucceeded: {
    id: "planManagement.updatedSubscriptionToPlus",
    defaultMessage:
      "Your subscription has been updated. Your subscription will change to {capitalizedUpdatedPlanType} on {renewalDateFormatted}.",
  },
  promotionClaimSuccess: {
    id: "AccountPaymentModal.primaryCTA.promotionClaimSuccess",
    defaultMessage: "You've successfully claimed your promotion",
  },
  promotionClaimError: {
    id: "AccountPaymentModal.primaryCTA.promotionClaimError",
    defaultMessage: "There was a problem claiming your promotion",
  },
  promotionEmailRequired: {
    id: "pricing.promotionEmailRequired",
    defaultMessage:
      "Add and verify an email address in ChatGPT before claiming this promotion",
  },
  subscriptionUpdateUnavailable: {
    id: "pricing.subscriptionUpdateUnavailable",
    defaultMessage: "We couldn't complete this plan change. Please try again.",
  },
  goToPlusNativeTrialBillingCycle: {
    id: "planUpgradeModal.goToPlusNativeTrialBillingCycle",
    defaultMessage:
      "Free for 1 month, then {currencyCode} {currencySign}{planCost}/month starting {renewalDateFormatted}",
  },
  percentageDiscount: {
    id: "percentageDiscount",
    defaultMessage: "{discount_percentage}% OFF",
  },
  flatDiscount: { id: "flatDiscount", defaultMessage: "{discounted_cost} OFF" },
  promo: { id: "promo", defaultMessage: "PROMO" },
  limitedTime: {
    id: "pricingPlanBadgeConstants.limitedTime",
    defaultMessage: "LIMITED TIME",
  },
  goHeadline: {
    id: "pricing.goRedesign.headline",
    defaultMessage: "More access to popular features",
  },
  plusHeadline: {
    id: "pricing.plusRedesign.headline",
    defaultMessage: "More access to advanced intelligence",
  },
  specialOffer: {
    id: "pricingPlanConstants.specialOffer",
    defaultMessage: "SPECIAL OFFER",
  },
  claimFreeOffer: {
    id: "pricingColumn.freeTrial.claimFreeOffer",
    defaultMessage: "Claim free offer",
  },
  redeemFreeOffer: {
    id: "pricingColumn.freeTrial.redeemFreeOffer",
    defaultMessage: "Redeem free offer",
  },
  startFreeTrial: {
    id: "pricingColumn.freeTrial.startFreeTrial",
    defaultMessage: "Start free trial",
  },
  tryPlusFree: {
    id: "pricingColumn.freeTrial.tryPlusFree",
    defaultMessage: "Try Plus free",
  },
  claimPlusFreeOffer: {
    id: "pricingColumn.freeTrial.claimPlusFreeOffer",
    defaultMessage: "Claim Plus free offer",
  },
  claimSpecialOffer: {
    id: "pricingColumn.specialOffer.claimSpecialOffer",
    defaultMessage: "Claim special offer",
  },
  renew: { id: "pricingColumn.renew", defaultMessage: "Renew" },
  goNotNow: { id: "GoColumn.notNow", defaultMessage: "Not Now" },
  notNow: { id: "AccountPaymentModal.notNow", defaultMessage: "Not Now" },
  termsApply: {
    id: "pricingPlanConstants.termsApply",
    defaultMessage: "Promo terms apply.",
  },
  resurrectionPromoPlanDisclaimer: {
    id: "pricingPlanConstants.resurrectionPromoPlanDisclaimer",
    defaultMessage:
      "Payment details required. The offer applies to your first month. After that, ChatGPT {plan_name} renews at {cost}/month unless you cancel.",
  },
  promoPlanDisclaimerForSingleMonth: {
    id: "pricingPlanConstants.promoPlanDisclaimerForSingleMonth",
    defaultMessage:
      "Promo pricing applies for 1 month. Starting {date}, ChatGPT {plan_name} will continue at {cost}/month. Cancel anytime.",
  },
  promoPlanDisclaimerForPluralMonths: {
    id: "pricingPlanConstants.promoPlanDisclaimerForPluralMonths",
    defaultMessage:
      "Promo pricing applies for {num_months} months. Starting {date}, ChatGPT {plan_name} will continue at {cost}/month. Cancel anytime.",
  },
  promoPlanDisclaimerNoRenewForSingleMonth: {
    id: "pricingPlanConstants.promoPlanDisclaimerNoRenewForSingleMonth",
    defaultMessage: "Promo pricing applies for 1 month.",
  },
  promoPlanDisclaimerNoRenewForPluralMonths: {
    id: "pricingPlanConstants.promoPlanDisclaimerNoRenewForPluralMonths",
    defaultMessage: "Promo pricing applies for {num_months} months.",
  },
  promoPlanDisclaimerScheduledForSingleMonth: {
    id: "pricingPlanConstants.promoPlanDisclaimerScheduledForSingleMonth",
    defaultMessage:
      "Promo pricing applies for 1 month starting {start_date}. Starting {end_date}, ChatGPT {plan_name} will continue at {cost}/month. Cancel anytime.",
  },
  promoPlanDisclaimerScheduledForPluralMonths: {
    id: "pricingPlanConstants.promoPlanDisclaimerScheduledForPluralMonths",
    defaultMessage:
      "Promo pricing applies for {num_months} months starting {start_date}. Starting {end_date}, ChatGPT {plan_name} will continue at {cost}/month. Cancel anytime.",
  },
  promoPlanDisclaimerForSingleYear: {
    id: "pricingPlanConstants.promoPlanDisclaimerForSingleYear",
    defaultMessage:
      "Promo pricing applies for 1 year. Starting {date}, ChatGPT {plan_name} will continue at {cost}/month (billed annually). Cancel anytime.",
  },
  promoPlanDisclaimerForPluralYears: {
    id: "pricingPlanConstants.promoPlanDisclaimerForPluralYears",
    defaultMessage:
      "Promo pricing applies for {num_years} years. Starting {date}, ChatGPT {plan_name} will continue at {cost}/month (billed annually). Cancel anytime.",
  },
  promoPlanDisclaimerNoRenewForSingleYear: {
    id: "pricingPlanConstants.promoPlanDisclaimerNoRenewForSingleYear",
    defaultMessage: "Promo pricing applies for 1 year.",
  },
  promoPlanDisclaimerNoRenewForPluralYears: {
    id: "pricingPlanConstants.promoPlanDisclaimerNoRenewForPluralYears",
    defaultMessage: "Promo pricing applies for {num_years} years.",
  },
  promoPlanDisclaimerScheduledForSingleYear: {
    id: "pricingPlanConstants.promoPlanDisclaimerScheduledForSingleYear",
    defaultMessage:
      "Promo pricing applies for 1 year starting {start_date}. Starting {end_date}, ChatGPT {plan_name} will continue at {cost}/year. Cancel anytime.",
  },
  promoPlanDisclaimerScheduledForPluralYears: {
    id: "pricingPlanConstants.promoPlanDisclaimerScheduledForPluralYears",
    defaultMessage:
      "Promo pricing applies for {num_years} years starting {start_date}. Starting {end_date}, ChatGPT {plan_name} will continue at {cost}/year. Cancel anytime.",
  },
  plusFreeForGoPromoPlanDisclaimerForSingleMonthWithoutDate: {
    id: "pricingPlanConstants.plusFreeForGoPromoPlanDisclaimerForSingleMonthWithoutDate",
    defaultMessage:
      "Promo pricing applies for 1 month. After the free month, ChatGPT {plan_name} will continue at {cost}/month. Return to Go anytime.",
  },
  promoStandardSeatDisclaimerForMonths: {
    id: "pricingPlanConstants.promoStandardSeatDisclaimerForMonths",
    defaultMessage:
      "Promo pricing applies for {num_periods, plural, one {# month} other {# months}}. Starting {date}, Standard seats will continue at {cost}/month. Cancel anytime.",
  },
  promoStandardSeatDisclaimerForYears: {
    id: "pricingPlanConstants.promoStandardSeatDisclaimerForYears",
    defaultMessage:
      "Promo pricing applies for {num_periods, plural, one {# year} other {# years}}. Starting {date}, Standard seats will continue at {cost}/month (billed annually). Cancel anytime.",
  },
  promoSummaryScheduledForSingleMonth: {
    id: "pricingPlanConstants.promoSummaryScheduledForSingleMonth",
    defaultMessage:
      "Pay for the first month, then the next month is {discounted_cost}.",
  },
  promoSummaryScheduledForPluralMonths: {
    id: "pricingPlanConstants.promoSummaryScheduledForPluralMonths",
    defaultMessage:
      "Pay for the first month, then the next {num_months} months are {discounted_cost}.",
  },
  promoSummaryScheduledForSingleYear: {
    id: "pricingPlanConstants.promoSummaryScheduledForSingleYear",
    defaultMessage:
      "Pay for the first year, then the next year is {discounted_cost}.",
  },
  promoSummaryScheduledForPluralYears: {
    id: "pricingPlanConstants.promoSummaryScheduledForPluralYears",
    defaultMessage:
      "Pay for the first year, then the next {num_years} years are {discounted_cost}.",
  },
  promoSummaryWithCreditGrant: {
    id: "pricingPlanConstants.promoSummaryWithCreditGrant.v2",
    defaultMessage: "Includes {creditCount, number} bonus credits, on us.",
  },
  promoCostSubtitleScheduledForSingleMonth: {
    id: "pricingPlanConstants.promoCostSubtitleScheduledForSingleMonth",
    defaultMessage:
      "Starting {start_date}: {discounted_cost}/month for 1 month",
  },
  promoCostSubtitleScheduledForPluralMonths: {
    id: "pricingPlanConstants.promoCostSubtitleScheduledForPluralMonths",
    defaultMessage:
      "Starting {start_date}: {discounted_cost}/month for {num_months} months",
  },
  promoCostSubtitleScheduledForSingleYear: {
    id: "pricingPlanConstants.promoCostSubtitleScheduledForSingleYear",
    defaultMessage: "Starting {start_date}: {discounted_cost}/year for 1 year",
  },
  promoCostSubtitleScheduledForPluralYears: {
    id: "pricingPlanConstants.promoCostSubtitleScheduledForPluralYears",
    defaultMessage:
      "Starting {start_date}: {discounted_cost}/year for {num_years} years",
  },
  promoCostSubtitleForSingleMonth: {
    id: "pricingPlanConstants.promoCostSubtitleForSingleMonth",
    defaultMessage: "for the first month",
  },
  promoCostSubtitleForPluralMonths: {
    id: "pricingPlanConstants.promoCostSubtitleForPluralMonths",
    defaultMessage: "for the first {num_months} months",
  },
  promoCostSubtitleForSingleYear: {
    id: "pricingPlanConstants.promoCostSubtitleForSingleYear",
    defaultMessage: "per month for the first year",
  },
  promoCostPerMonthSubtitleForPluralYears: {
    id: "pricingPlanConstants.promoCostPerMonthSubtitleForPluralYears",
    defaultMessage: "per month for the first {num_years} years",
  },
} satisfies Record<string, MessageDescriptor>);

const GO_ONE_MONTH_FREE = "go-1-month-free";
const PLUS_ONE_MONTH_FREE = "plus-1-month-free";
const PLUS_FREE_FOR_GO = "plus-1-month-free-for-go";

const plusCampaigns: Record<
  string,
  { discountPercentage: number; durationNumPeriods: number }
> = {
  [PLUS_ONE_MONTH_FREE]: { discountPercentage: 100, durationNumPeriods: 1 },
  [PLUS_FREE_FOR_GO]: { discountPercentage: 100, durationNumPeriods: 1 },
  "plus-1-month-50-pct-off": { discountPercentage: 50, durationNumPeriods: 1 },
  "plus-2-months-50-pct-off": { discountPercentage: 50, durationNumPeriods: 2 },
  "plus-3-months-50-pct-off": { discountPercentage: 50, durationNumPeriods: 3 },
};
const goCampaigns: Record<
  string,
  { discountPercentage: number; durationNumPeriods: number }
> = {
  [GO_ONE_MONTH_FREE]: { discountPercentage: 100, durationNumPeriods: 1 },
  "go-1-month-50-pct-off": { discountPercentage: 50, durationNumPeriods: 1 },
  "go-2-months-50-pct-off": { discountPercentage: 50, durationNumPeriods: 2 },
  "go-3-months-50-pct-off": { discountPercentage: 50, durationNumPeriods: 3 },
};

function selectEligibleCampaign({
  requestedPromoCampaignId,
  eligiblePlusPromoCampaignId,
  eligibleGoPromoCampaignId,
  promoCampaignHandoffId,
  shouldAutoApplyPlusOneMonthFreePromo = true,
}: {
  requestedPromoCampaignId?: string | null;
  eligiblePlusPromoCampaignId?: string;
  eligibleGoPromoCampaignId?: string;
  promoCampaignHandoffId?: string;
  shouldAutoApplyPlusOneMonthFreePromo?: boolean;
}): string | undefined {
  if (
    requestedPromoCampaignId === PLUS_FREE_FOR_GO &&
    !(
      eligiblePlusPromoCampaignId === PLUS_FREE_FOR_GO &&
      promoCampaignHandoffId === PLUS_FREE_FOR_GO
    )
  )
    return undefined;
  if (
    requestedPromoCampaignId != null &&
    (requestedPromoCampaignId === eligiblePlusPromoCampaignId ||
      requestedPromoCampaignId === eligibleGoPromoCampaignId)
  )
    return requestedPromoCampaignId;
  if (
    eligiblePlusPromoCampaignId === PLUS_ONE_MONTH_FREE &&
    !shouldAutoApplyPlusOneMonthFreePromo
  )
    return undefined;
  return eligiblePlusPromoCampaignId === PLUS_FREE_FOR_GO
    ? undefined
    : eligiblePlusPromoCampaignId;
}

function campaignToDiscount(
  campaignId?: string | null,
): { discount: { percentage: number }; duration: PromotionDuration } | null {
  const preset = campaignId == null ? null : plusCampaigns[campaignId];
  if (preset != null)
    return {
      discount: { percentage: preset.discountPercentage },
      duration: { num_periods: preset.durationNumPeriods, period: "month" },
    };
  return campaignId === "plus-10-for-1-month"
    ? {
        discount: { percentage: 50 },
        duration: { num_periods: 1, period: "month" },
      }
    : null;
}

function selectPromotionCampaign({
  plan,
  promoCampaignId,
  eligiblePromoCampaignId,
  suppressGoFallback = false,
}: {
  plan: PlanType;
  promoCampaignId?: string;
  eligiblePromoCampaignId?: string;
  suppressGoFallback?: boolean;
}): string | undefined {
  const resurrection =
    promoCampaignId?.startsWith("resurrection-discount-v1-") ?? false;
  if (plan === "plus")
    return resurrection ? eligiblePromoCampaignId : promoCampaignId;
  return (
    (resurrection ? undefined : promoCampaignId) ??
    (suppressGoFallback ? undefined : eligiblePromoCampaignId)
  );
}

function buildSyntheticPromotion(
  plan: PlanType,
  campaignId: string | undefined,
  intl: IntlShape,
): (PromotionMetadata & Record<string, unknown>) | null {
  const preset =
    plan === "go"
      ? campaignId == null
        ? null
        : goCampaigns[campaignId]
      : null;
  const promotion =
    preset == null
      ? campaignToDiscount(campaignId)
      : {
          discount: { percentage: preset.discountPercentage },
          duration: {
            num_periods: preset.durationNumPeriods,
            period: "month" as const,
          },
        };
  if (promotion == null) return null;
  return {
    plan_name: plan === "plus" ? "chatgptplusplan" : "chatgptgoplan",
    title: "",
    summary: intl.formatMessage(
      plan === "plus"
        ? promotionMessages.plusHeadline
        : promotionMessages.goHeadline,
    ) as string,
    ...promotion,
    price_period: "recurring",
    promotion_type: "discount",
    promotion_type_label: intl.formatMessage(
      promotionMessages.specialOffer,
    ) as string,
  };
}

function validateApplicablePromotion(
  plan: PlanType,
  currentPlan: string,
  promotion?: PromotionMetadata | null,
): PromotionMetadata | null {
  if (promotion == null) return null;
  if (
    plan === "plus" &&
    currentPlan !== (promotion.id === PLUS_FREE_FOR_GO ? "go" : "free")
  )
    return null;
  if (
    promotion.id?.startsWith("resurrection-discount-v1-") &&
    promotion.metadata?.plan_name !==
      (plan === "plus" ? "chatgptplusplan" : "chatgptgoplan")
  )
    return null;
  return promotion;
}

function selectFreeTrialCta(
  useConfiguredCopy: boolean,
  copy?: string,
): MessageDescriptor {
  if (useConfiguredCopy) {
    if (copy === "start_free_trial") return promotionMessages.startFreeTrial;
    if (copy === "try_plus_free") return promotionMessages.tryPlusFree;
    if (copy === "claim_plus_free_offer")
      return promotionMessages.claimPlusFreeOffer;
  }
  return promotionMessages.claimFreeOffer;
}

function formatPromoCostSubtitle(
  intl: IntlShape,
  duration: PromotionDuration,
): string | readonly unknown[] {
  if (duration.period === "year")
    return duration.num_periods === 1
      ? intl.formatMessage(promotionMessages.promoCostSubtitleForSingleYear)
      : intl.formatMessage(
          promotionMessages.promoCostPerMonthSubtitleForPluralYears,
          { num_years: duration.num_periods },
        );
  return duration.num_periods === 1
    ? intl.formatMessage(promotionMessages.promoCostSubtitleForSingleMonth)
    : intl.formatMessage(promotionMessages.promoCostSubtitleForPluralMonths, {
        num_months: duration.num_periods,
      });
}

function addMonths(date: Date, count: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  const end = new Date(result);
  end.setMonth(result.getMonth() + count + 1, 0);
  if (day >= end.getDate()) return end;
  result.setFullYear(end.getFullYear(), end.getMonth(), day);
  return result;
}
function addPeriods(period: BillingPeriod, count: number, extraDays = 0): Date {
  const now = new Date();
  const result =
    period === "year"
      ? addMonths(now, count * 12)
      : period === "month"
        ? addMonths(now, count)
        : now;
  if (extraDays > 0) result.setDate(result.getDate() + extraDays);
  return result;
}
function getRenewalDate({
  daysUntilPlanRenews,
  daysUntilSubscriptionCancelAt,
}: {
  daysUntilPlanRenews?: number;
  daysUntilSubscriptionCancelAt?: number;
}): Date | null {
  if (typeof daysUntilPlanRenews !== "number" || daysUntilPlanRenews <= 0)
    return null;
  const days =
    typeof daysUntilSubscriptionCancelAt === "number" &&
    daysUntilSubscriptionCancelAt > daysUntilPlanRenews
      ? daysUntilSubscriptionCancelAt
      : daysUntilPlanRenews;
  const result = new Date();
  result.setDate(result.getDate() + days);
  return result;
}
function creditGrant(metadata: PromotionMetadata): number | null {
  const parsed = Number.parseFloat(String(metadata.credit_grant?.amount));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildPromotionDetails({
  intl,
  planName,
  promoMetadata,
  promoCampaignId,
  formattedCost,
  formattedDiscountedCost,
  daysUntilPlanRenews,
  qualifyStandardSeatRenewal = false,
}: {
  intl: IntlShape;
  planName: string;
  promoMetadata: PromotionMetadata;
  promoCampaignId?: string;
  formattedCost: string;
  formattedDiscountedCost: string;
  daysUntilPlanRenews?: number;
  qualifyStandardSeatRenewal?: boolean;
}) {
  const normalizedPlanName =
    planName.charAt(0).toUpperCase() + planName.slice(1).toLowerCase();
  const duration = promoMetadata.duration ?? {
    num_periods: 1,
    period: "month" as const,
  };
  const scheduleDelay = promoMetadata.schedule?.start_after_num_periods ?? 0;
  const schedulePeriod = promoMetadata.schedule?.period ?? duration.period;
  const startDate =
    scheduleDelay > 0
      ? new Intl.DateTimeFormat(intl.locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(addPeriods(schedulePeriod, scheduleDelay))
      : undefined;
  const renewalDelay =
    promoMetadata.plan_type_change === "upgrade" ||
    promoCampaignId === PLUS_FREE_FOR_GO
      ? 0
      : (daysUntilPlanRenews ?? 0);
  const resumeDate = addPeriods(
    duration.period,
    duration.num_periods + scheduleDelay,
    renewalDelay,
  );
  const formattedResumeDate = new Intl.DateTimeFormat(intl.locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(resumeDate);
  const noRenewal = promoMetadata.no_auto_renewal_at_discount_end === true;
  const values = {
    cost: formattedCost,
    date: formattedResumeDate,
    end_date: formattedResumeDate,
    start_date: startDate,
    plan_name: normalizedPlanName,
    num_months: duration.num_periods,
    num_years: duration.num_periods,
    num_periods: duration.num_periods,
  };
  let descriptor: MessageDescriptor;
  if (promoCampaignId?.startsWith("resurrection-discount-v1-"))
    descriptor = promotionMessages.resurrectionPromoPlanDisclaimer;
  else if (qualifyStandardSeatRenewal && !noRenewal)
    descriptor =
      duration.period === "year"
        ? promotionMessages.promoStandardSeatDisclaimerForYears
        : promotionMessages.promoStandardSeatDisclaimerForMonths;
  else if (duration.period === "hour")
    throw new Error("Period 'hour' is not supported");
  else if (scheduleDelay > 0)
    descriptor =
      duration.period === "year"
        ? duration.num_periods === 1
          ? promotionMessages.promoPlanDisclaimerScheduledForSingleYear
          : promotionMessages.promoPlanDisclaimerScheduledForPluralYears
        : duration.num_periods === 1
          ? promotionMessages.promoPlanDisclaimerScheduledForSingleMonth
          : promotionMessages.promoPlanDisclaimerScheduledForPluralMonths;
  else if (duration.period === "year")
    descriptor = noRenewal
      ? duration.num_periods === 1
        ? promotionMessages.promoPlanDisclaimerNoRenewForSingleYear
        : promotionMessages.promoPlanDisclaimerNoRenewForPluralYears
      : duration.num_periods === 1
        ? promotionMessages.promoPlanDisclaimerForSingleYear
        : promotionMessages.promoPlanDisclaimerForPluralYears;
  else if (noRenewal)
    descriptor =
      duration.num_periods === 1
        ? promotionMessages.promoPlanDisclaimerNoRenewForSingleMonth
        : promotionMessages.promoPlanDisclaimerNoRenewForPluralMonths;
  else
    descriptor =
      promoCampaignId === PLUS_FREE_FOR_GO
        ? promotionMessages.plusFreeForGoPromoPlanDisclaimerForSingleMonthWithoutDate
        : duration.num_periods === 1
          ? promotionMessages.promoPlanDisclaimerForSingleMonth
          : promotionMessages.promoPlanDisclaimerForPluralMonths;
  const disclaimerText = intl.formatMessage(descriptor, values) as string;
  let summary = promoMetadata.summary;
  if (scheduleDelay > 0)
    summary = intl.formatMessage(
      duration.period === "year"
        ? duration.num_periods === 1
          ? promotionMessages.promoSummaryScheduledForSingleYear
          : promotionMessages.promoSummaryScheduledForPluralYears
        : duration.num_periods === 1
          ? promotionMessages.promoSummaryScheduledForSingleMonth
          : promotionMessages.promoSummaryScheduledForPluralMonths,
      {
        discounted_cost: formattedDiscountedCost,
        num_months: duration.num_periods,
        num_years: duration.num_periods,
      },
    ) as string;
  const credits = creditGrant(promoMetadata);
  if (credits != null)
    summary = intl.formatMessage(
      promotionMessages.promoSummaryWithCreditGrant,
      { creditCount: credits },
    ) as string;
  const scheduledCostDuration =
    scheduleDelay > 0
      ? (intl.formatMessage(
          duration.period === "year"
            ? duration.num_periods === 1
              ? promotionMessages.promoCostSubtitleScheduledForSingleYear
              : promotionMessages.promoCostSubtitleScheduledForPluralYears
            : duration.num_periods === 1
              ? promotionMessages.promoCostSubtitleScheduledForSingleMonth
              : promotionMessages.promoCostSubtitleScheduledForPluralMonths,
          {
            start_date: startDate,
            discounted_cost: formattedDiscountedCost,
            num_months: duration.num_periods,
            num_years: duration.num_periods,
          },
        ) as string)
      : undefined;
  const article =
    planName === "go"
      ? "https://help.openai.com/en/articles/12501659-chatgpt-go-promotions-and-referrals"
      : "https://help.openai.com/en/articles/10492689-chatgpt-plus-promotions-referrals";
  return {
    disclaimer: {
      id: "promoDisclaimer",
      defaultMessage: `<article>${intl.formatMessage(promotionMessages.termsApply)}</article> ${disclaimerText}`,
      article,
    },
    fullPriceResumeDate: formattedResumeDate,
    fullPriceResumeDateTimestamp: resumeDate.getTime(),
    summary,
    scheduledCostDuration,
  };
}

function isFullyDiscounted(promotion?: PromotionMetadata | null): boolean {
  return (
    promotion != null &&
    "percentage" in promotion.discount &&
    promotion.discount.percentage === 100
  );
}
function initializePromotionMessages(): void {}
function initializePricingPromotions(): void {
  initializePromotionMessages();
}

export {
  validateApplicablePromotion as a,
  selectPromotionCampaign as c,
  getRenewalDate as d,
  initializePricingPromotions as f,
  promotionMessages as h,
  selectEligibleCampaign as i,
  buildPromotionDetails as l,
  initializePromotionMessages as m,
  PLUS_FREE_FOR_GO as n,
  selectFreeTrialCta as o,
  isFullyDiscounted as p,
  PLUS_ONE_MONTH_FREE as r,
  buildSyntheticPromotion as s,
  GO_ONE_MONTH_FREE as t,
  formatPromoCostSubtitle as u,
};
