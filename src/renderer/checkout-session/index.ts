// Checkout session contracts shared by purchase and fulfillment routes.

import "@rchunk/rolldown-runtime";
// Preserve the release chunk's audited registration and loader edges.
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/checkout-policy";
import "@rchunk/billing-icons";
import "@rchunk/checkout-error";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";

type BillingInterval = "day" | "week" | "month" | "year";
type Plan = "plus" | "go" | "pro5x" | "pro" | "team";
type SeatType = "default" | "prolite";

interface SafeParseResult<Value> { success: boolean; data?: Value; error?: Error }
interface Schema<Value> { parse(value: unknown): Value; safeParse(value: unknown): SafeParseResult<Value> }
interface CheckoutReturnValue { checkoutSessionId: string; processorEntity: "openai_llc" | "openai_ie" }
interface Money { minorUnitsAmount: number }
interface RecurringLineItem {
  id?: string | null;
  quantity?: number;
  recurring?: { interval?: string | null } | null;
  subtotal: Money;
}
interface CheckoutTotals {
  discount: Money;
  subtotal: Money;
  taxInclusive: Money;
  total?: Money;
}
interface Checkout {
  billingAddress?: { address?: { country?: string | null } } | null;
  discountAmounts?: Array<Money & { displayName?: string | null }>;
  lineItems: RecurringLineItem[];
  total: CheckoutTotals;
}
interface IntlShape {
  locale?: string;
  formatMessage(message: { defaultMessage: string }, values?: Record<string, unknown>): string;
  formatNumber?(value: number, options: Intl.NumberFormatOptions & { trailingZeroDisplay?: string }): string;
}
interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

const SEAT_TYPES = { STANDARD: "default", PREMIUM: "prolite" } as const;
const BILLING_INTERVALS = { FLEXIBLE: "month", ANNUAL: "year" } as const;
const CONTACT_SALES_201 = "https://openai.com/contact-sales/?utm_medium=product&utm_source=website&utm_campaign=PLG-Business-201-seats";
const CONTACT_SALES_999 = "https://openai.com/contact-sales/?utm_medium=product&utm_source=website&utm_campaign=PLG-Business-999-seats";
const MINIMUM_SEATS = 2;
const DEFAULT_SEATS = 5;
const DEFAULT_SEAT_QUANTITIES = { standardSeats: 5, premiumSeats: 0 };
const SUPPORTED_PLANS: Plan[] = ["plus", "go", "pro5x", "pro", "team"];
const PLAN_NAMES: Record<Plan, string> = {
  plus: "chatgptplusplan",
  go: "chatgptgoplan",
  pro5x: "chatgptprolite",
  pro: "chatgptpro",
  team: "chatgptteamplan",
};
const VAT_COUNTRIES = new Set("AT.BE.BG.HR.CY.CZ.DK.EE.FI.FR.DE.GF.GP.GR.HU.IS.IE.IT.LV.LI.LT.LU.MF.MQ.MT.NL.NO.PL.PT.RE.RO.SK.SI.ES.SE.YT".split("."));
const CHECKOUT_COUNTRIES = "AD.AE.AF.AG.AI.AL.AM.AO.AQ.AR.AS.AT.AU.AW.AX.AZ.BA.BB.BD.BE.BF.BG.BH.BI.BJ.BL.BM.BN.BO.BQ.BR.BS.BT.BW.BZ.CA.CD.CF.CG.CH.CI.CK.CL.CM.CO.CR.CV.CW.CY.CZ.DE.DJ.DK.DM.DO.DZ.EC.EE.EG.ER.ES.ET.FI.FJ.FK.FM.FO.FR.GA.GB.GD.GE.GF.GG.GH.GI.GL.GM.GN.GP.GQ.GR.GT.GU.GW.GY.HN.HR.HT.HU.ID.IE.IL.IM.IN.IQ.IS.IT.JE.JM.JO.JP.KE.KG.KH.KI.KM.KN.KR.KW.KY.KZ.LA.LB.LC.LI.LK.LR.LS.LT.LU.LV.LY.MA.MC.MD.ME.MF.MG.MH.MK.ML.MM.MN.MP.MQ.MR.MS.MT.MU.MV.MW.MX.MY.MZ.NA.NC.NE.NF.NG.NI.NL.NO.NP.NR.NU.NZ.OM.PA.PE.PF.PG.PH.PK.PL.PM.PN.PR.PS.PT.PW.PY.QA.RE.RO.RS.RW.SA.SB.SC.SD.SE.SG.SH.SI.SJ.SK.SL.SM.SN.SO.SR.SS.ST.SV.SX.SZ.TC.TD.TF.TG.TH.TJ.TK.TL.TM.TN.TO.TR.TT.TV.TW.TZ.UA.UG.US.UY.UZ.VA.VC.VG.VI.VN.VU.WF.WS.XK.YE.YT.ZA.ZM.ZW".split(".");

let initialized = false;
let jsx: JsxRuntime;

function initializeCheckoutSession(): void {
  if (initialized) return;
  jsx = getJsxRuntime();
  initialized = true;
}

function schema<Value>(reader: (value: unknown) => Value): Schema<Value> {
  return {
    parse(value) { return reader(value); },
    safeParse(value) {
      try { return { success: true, data: reader(value) }; }
      catch (error) { return { success: false, error: error instanceof Error ? error : new Error(String(error)) }; }
    },
  };
}

const checkoutReturnSchema = schema<CheckoutReturnValue>((value) => {
  if (value == null || typeof value !== "object") throw new Error("Checkout return must be an object");
  const input = value as Record<string, unknown>;
  if (input.processorEntity !== "openai_llc" && input.processorEntity !== "openai_ie") throw new Error("Invalid checkout processor entity");
  if (typeof input.checkoutSessionId !== "string" || !/^(cs_|oaics_)[A-Za-z0-9_]+$/.test(input.checkoutSessionId)) throw new Error("Invalid checkout session id");
  return { processorEntity: input.processorEntity, checkoutSessionId: input.checkoutSessionId };
});

const planSchema = schema<Plan>((value) => {
  if (!SUPPORTED_PLANS.includes(value as Plan)) throw new Error("Unsupported checkout plan");
  return value as Plan;
});

function currencyFractionDigits(currency: string): number {
  try { return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits; }
  catch { return 2; }
}

function formatMinorUnits({ amountMinorUnits, currency, locale, maximumFractionDigits }: { amountMinorUnits: number; currency: string; locale: string; maximumFractionDigits?: number }): string {
  const digits = currencyFractionDigits(currency);
  const maximum = maximumFractionDigits ?? digits;
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: Math.min(digits, maximum), maximumFractionDigits: maximum }).format(amountMinorUnits / 10 ** digits);
}

function formatIntlAmount({ intl, amount, currency }: { intl: IntlShape; amount: number; currency: string }): string {
  const digits = currencyFractionDigits(currency);
  return intl.formatNumber?.(amount, { style: "currency", currency, currencyDisplay: "symbol", minimumFractionDigits: digits, maximumFractionDigits: digits, trailingZeroDisplay: "stripIfInteger" }) ?? new Intl.NumberFormat(intl.locale, { style: "currency", currency }).format(amount);
}

function annualSavingsPercent({ annualMonthlyEquivalent, monthlyAmount }: { annualMonthlyEquivalent: number; monthlyAmount: number }): number {
  if (!Number.isFinite(monthlyAmount) || !Number.isFinite(annualMonthlyEquivalent) || monthlyAmount <= 0 || annualMonthlyEquivalent < 0 || annualMonthlyEquivalent >= monthlyAmount) return 0;
  const percent = ((monthlyAmount - annualMonthlyEquivalent) / monthlyAmount) * 100;
  return Number.isFinite(percent) && percent > 0 ? Math.floor(percent + 1e-9) : 0;
}

function discountPercent(original: number, discounted: number): number {
  return original <= 0 ? 0 : Math.floor(100 - discounted / original * 100);
}

function billingIntervalAdverb(interval: BillingInterval, intl: IntlShape): string {
  const labels: Record<BillingInterval, string> = { month: "monthly", year: "annually", week: "weekly", day: "daily" };
  if (!(interval in labels)) throw new Error(`Unknown StripeCheckoutBillingInterval: ${interval}`);
  return intl.formatMessage({ defaultMessage: labels[interval] });
}

function billingIntervalNoun(interval: BillingInterval, intl: IntlShape): string {
  const labels: Record<BillingInterval, string> = { month: "month", year: "year", week: "week", day: "day" };
  if (!(interval in labels)) throw new Error(`Unknown StripeCheckoutBillingInterval: ${interval}`);
  return intl.formatMessage({ defaultMessage: labels[interval] });
}

function parseInteger(value: unknown): number | null {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof parsed === "number" && Number.isSafeInteger(parsed) ? parsed : null;
}

function clampDefaultSeats({ configuredDefaultSeats, fallbackDefaultSeats, maxSeats, minimumSeats }: { configuredDefaultSeats: unknown; fallbackDefaultSeats: number; maxSeats: number; minimumSeats: number }): number {
  return Math.max(minimumSeats, Math.min(maxSeats, parseInteger(configuredDefaultSeats) ?? fallbackDefaultSeats));
}

function configuredSeatQuantities({ configuredSeatQuantities: configured, maxSeats, minimumSeats }: { configuredSeatQuantities: unknown; maxSeats: number; minimumSeats: number }) {
  const source = configured != null && typeof configured === "object" ? configured as Record<string, unknown> : {};
  const standardSeats = parseInteger(source.default) ?? DEFAULT_SEAT_QUANTITIES.standardSeats;
  const premiumSeats = parseInteger(source.prolite) ?? DEFAULT_SEAT_QUANTITIES.premiumSeats;
  const total = standardSeats + premiumSeats;
  return standardSeats < 0 || premiumSeats < 0 || total < minimumSeats || total > maxSeats ? { ...DEFAULT_SEAT_QUANTITIES } : { standardSeats, premiumSeats };
}

function seatBounds({ standardQuantity, premiumQuantity, minimumSeats, maximumSeats, assignedStandardMinimum = 0, assignedPremiumMinimum = 0 }: { standardQuantity: number; premiumQuantity: number; minimumSeats: number; maximumSeats: number; assignedStandardMinimum?: number; assignedPremiumMinimum?: number }) {
  const standardMinimum = Math.max(assignedStandardMinimum, minimumSeats - premiumQuantity, 0);
  const premiumMinimum = Math.max(assignedPremiumMinimum, minimumSeats - standardQuantity, 0);
  return { standardMinimum, premiumMinimum, standardMaximum: Math.max(standardMinimum, maximumSeats - premiumQuantity), premiumMaximum: Math.max(premiumMinimum, maximumSeats - standardQuantity) };
}

function workspaceSeatDefaults({ isFreeWorkspace, workspaceMemberCount, minimumSeats = 0 }: { isFreeWorkspace: boolean; workspaceMemberCount?: number | null; minimumSeats?: number }) {
  const members = isFreeWorkspace && workspaceMemberCount != null && workspaceMemberCount > 0 ? workspaceMemberCount : undefined;
  return { minimumSeats: Math.max(members ?? MINIMUM_SEATS, minimumSeats), defaultSeats: Math.max(members ?? DEFAULT_SEATS, minimumSeats) };
}

function parseCheckoutInput(search: string) {
  const values = new URLSearchParams(search);
  const promoCode = values.get("promoCode")?.trim() || null;
  const promoCampaign = promoCode == null ? values.get("promo_campaign")?.trim() || null : null;
  const interval = values.get("price_interval") ?? values.get("selectedPlan") ?? (promoCampaign == null ? BILLING_INTERVALS.ANNUAL : BILLING_INTERVALS.FLEXIBLE);
  const seats = Number.parseInt(values.get("numSeats") ?? "", 10);
  return { promoCode, promoCampaign, priceInterval: interval === "month" ? "month" : "year", requestedSeatQuantity: Number.isSafeInteger(seats) && seats > 0 ? seats : null };
}

function promotionRequest({ input, metadata, eligibleCampaign }: { input: ReturnType<typeof parseCheckoutInput>; metadata?: { plan_name?: string } | null; eligibleCampaign?: string | null }) {
  return input.promoCode != null && metadata?.plan_name === "chatgptteamplan"
    ? { promo_code: input.promoCode }
    : input.promoCode == null && eligibleCampaign != null && input.priceInterval === "month"
      ? { promo_campaign: { promo_campaign_id: eligibleCampaign, is_coupon_from_query_param: true } }
      : {};
}

function isSeatLineItem(value: unknown): value is { id: string; seatType: SeatType } {
  return value != null && typeof value === "object" && typeof (value as { id?: unknown }).id === "string" && ((value as { seatType?: unknown }).seatType === "default" || (value as { seatType?: unknown }).seatType === "prolite");
}

function lineItemSeatMetadata(session: Record<string, any>): Record<string, { seat_type: SeatType }> | null {
  if (session.info_by_stripe_line_item_id != null) return session.info_by_stripe_line_item_id;
  if (session.checkout_provider !== "open_ai" || !["chatgptteamplan", "self_serve_business_prolite"].includes(session.plan_name)) return null;
  const items = session.checkout_state?.lineItems;
  if (!Array.isArray(items)) return null;
  const result: Record<string, { seat_type: SeatType }> = {};
  for (const candidate of items) {
    const item = candidate as Record<string, any>;
    if (item.lineRole !== "initial_invoice" && item.recurring != null && isSeatLineItem(item)) result[item.id] = { seat_type: item.seatType };
  }
  return Object.keys(result).length ? result : null;
}

function aggregateSeatLineItems(items: RecurringLineItem[], metadata?: Record<string, { seat_type?: string }> | null) {
  const recurring = items.filter((item) => item.recurring?.interval != null);
  const mapped = recurring.flatMap((item) => {
    const seatType = item.id == null ? undefined : metadata?.[item.id]?.seat_type;
    return seatType === "default" || seatType === "prolite" ? [{ lineItem: item, seatType }] : [];
  });
  const isMapped = mapped.length > 0;
  const fallback = !isMapped && recurring.length === 1 ? recurring[0] : undefined;
  const representative = mapped[0]?.lineItem ?? fallback;
  if (representative?.recurring?.interval == null) return undefined;
  const standard = mapped.filter(({ seatType }) => seatType === "default");
  const premium = mapped.filter(({ seatType }) => seatType === "prolite");
  const quantity = (entries: typeof mapped) => entries.reduce((sum, entry) => sum + (entry.lineItem.quantity ?? 0), 0);
  const amount = (entries: typeof mapped) => entries.reduce((sum, entry) => sum + entry.lineItem.subtotal.minorUnitsAmount, 0);
  const standardQuantity = isMapped ? quantity(standard) : fallback?.quantity ?? 0;
  const premiumQuantity = quantity(premium);
  return { interval: representative.recurring.interval === "month" ? "month" : "year", quantity: standardQuantity + premiumQuantity, standardQuantity, premiumQuantity, standardAmountMinorUnits: isMapped ? amount(standard) : fallback?.subtotal.minorUnitsAmount ?? 0, premiumAmountMinorUnits: amount(premium), isMapped };
}

function businessSeatBreakdown({ businessSeatLineItems, lineItems, subtotalMinorUnits }: { businessSeatLineItems?: Record<string, { seat_type?: string }> | null; lineItems: RecurringLineItem[]; subtotalMinorUnits: number }) {
  if (businessSeatLineItems == null || lineItems.length === 0) return null;
  const aggregate = aggregateSeatLineItems(lineItems, businessSeatLineItems);
  if (aggregate == null || !aggregate.isMapped || aggregate.quantity <= 0 || aggregate.standardAmountMinorUnits + aggregate.premiumAmountMinorUnits !== subtotalMinorUnits) return null;
  const result = [];
  if (aggregate.standardQuantity > 0) result.push({ amountMinorUnits: aggregate.standardAmountMinorUnits, quantity: aggregate.standardQuantity, type: "standard" });
  if (aggregate.premiumQuantity > 0) result.push({ amountMinorUnits: aggregate.premiumAmountMinorUnits, quantity: aggregate.premiumQuantity, type: "premium" });
  return result.length ? result : null;
}

function shouldHideSeatPicker({ currentPlan, nextPlan, hasFreeTrialPromo, hideSeatPickerLayerEnabled }: { currentPlan: string; nextPlan: string; hasFreeTrialPromo: boolean; hideSeatPickerLayerEnabled: boolean }): boolean {
  return hideSeatPickerLayerEnabled && hasFreeTrialPromo && currentPlan === "year" && nextPlan === "month";
}

function shouldShowPremiumSeats({ isFreeTrial, isStandardBusinessCheckout, serverEnabled, isEnabledForCheckout }: { isFreeTrial: boolean; isStandardBusinessCheckout: boolean; serverEnabled?: string | null; isEnabledForCheckout(): boolean }): boolean {
  return !isFreeTrial && isStandardBusinessCheckout && (serverEnabled === "true" || (serverEnabled == null && isEnabledForCheckout()));
}

function isCheckoutCountry(country: string): boolean { return CHECKOUT_COUNTRIES.includes(country.toUpperCase()); }
function isVatCountry(country: string): boolean { return VAT_COUNTRIES.has(country.toUpperCase()); }
function isRecurringLineItem(item: RecurringLineItem): boolean { return item.recurring != null; }
function sumDiscounts({ discountAmounts, currency, locale }: { discountAmounts: Array<Money & Record<string, unknown>>; currency: string; locale: string }) {
  const first = discountAmounts[0];
  if (first == null) return null;
  const minorUnitsAmount = discountAmounts.reduce((sum, item) => sum + item.minorUnitsAmount, 0);
  return { ...first, minorUnitsAmount, amount: formatMinorUnits({ amountMinorUnits: minorUnitsAmount, currency, locale }) };
}
function checkoutSubtotal(checkout: Checkout): number | null { return (checkout.lineItems.find(isRecurringLineItem) ?? checkout.lineItems[0])?.subtotal.minorUnitsAmount ?? checkout.total.subtotal.minorUnitsAmount ?? null; }
function checkoutDueBeforeTax(checkout: Checkout): number { return Math.max(0, checkout.total.subtotal.minorUnitsAmount - checkout.total.discount.minorUnitsAmount - checkout.total.taxInclusive.minorUnitsAmount); }
function firstMonthAmounts({ checkout }: { checkout: Checkout }) {
  if (checkout.lineItems.some((item) => item.recurring?.interval === "year")) return null;
  const monthly = checkout.lineItems.find((item) => item.recurring?.interval === "month");
  return monthly == null ? null : { amountMinorUnits: checkoutDueBeforeTax(checkout), renewalAmountMinorUnits: monthly.subtotal.minorUnitsAmount };
}

function checkoutVerifyUrl(response: { checkout_session_id: string; processor_entity: string; confirm_return_url?: string | null }, additional?: Record<string, string> | URLSearchParams | null): string {
  const result = new URLSearchParams({ stripe_session_id: response.checkout_session_id, processor_entity: response.processor_entity });
  const source = response.confirm_return_url == null ? null : new URL(response.confirm_return_url, globalThis.location?.origin ?? "https://chatgpt.com").searchParams;
  const accountId = source?.get("account_id");
  for (const key of ["plan_type", "campaign"]) { const value = source?.get(key); if (value != null) result.set(key, value); }
  if (accountId != null) result.set("account_id", accountId);
  if (additional != null) for (const [key, value] of additional instanceof URLSearchParams ? additional : Object.entries(additional)) result.set(key, value);
  return `/checkout/verify?${result.toString()}`;
}

function CheckoutShell({ children, busy = false, returnPath = "/" }: { children?: unknown; busy?: boolean; returnPath?: string }): unknown {
  initializeCheckoutSession();
  return jsx.jsxs("main", { "aria-busy": busy, className: "flex min-h-full flex-col bg-primary text-primary", "data-checkout-shell": true, children: [jsx.jsx("header", { className: "flex h-12 items-center px-4", children: jsx.jsx("button", { type: "button", "aria-label": "Back", disabled: busy, onClick: () => globalThis.location?.assign(returnPath), children: "←" }) }), jsx.jsx("section", { className: "mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 p-6", children })] });
}

function CheckoutError({ error, onRetry }: { error: unknown; onRetry?: () => void }): unknown {
  initializeCheckoutSession();
  return jsx.jsxs("div", { children: [jsx.jsx("p", { role: "alert", children: error instanceof Error ? error.message : "Checkout could not be completed. Please try again." }), onRetry == null ? null : jsx.jsx("button", { type: "button", onClick: onRetry, children: "Retry" })] });
}

function CheckoutForm(props: { children?: unknown; disabled?: boolean; pending?: boolean; error?: unknown; onSubmit?(): void }): unknown {
  initializeCheckoutSession();
  return jsx.jsxs("form", { "aria-busy": props.pending === true, onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); if (!props.disabled && !props.pending) props.onSubmit?.(); }, children: [props.children, props.error == null ? null : jsx.jsx(CheckoutError, { error: props.error }), jsx.jsx("button", { type: "submit", disabled: props.disabled || props.pending, children: props.pending ? "Processing…" : "Continue" })] });
}

function CheckoutSummary({ checkout, currency = "USD", locale = "en" }: { checkout: Checkout; currency?: string; locale?: string }): unknown {
  initializeCheckoutSession();
  return jsx.jsxs("dl", { children: [jsx.jsx("dt", { children: "Subtotal" }), jsx.jsx("dd", { children: formatMinorUnits({ amountMinorUnits: checkout.total.subtotal.minorUnitsAmount, currency, locale }) }), jsx.jsx("dt", { children: "Total" }), jsx.jsx("dd", { children: formatMinorUnits({ amountMinorUnits: checkout.total.total?.minorUnitsAmount ?? checkoutDueBeforeTax(checkout), currency, locale }) })] });
}

function CheckoutReturn(props: { children?: unknown; busy?: boolean; returnPath?: string }): unknown { return CheckoutShell(props); }
function CheckoutHomeLink(): unknown { initializeCheckoutSession(); return jsx.jsx("a", { href: "/", children: "ChatGPT" }); }
function initializeCheckoutPlanData(): void { initializeCheckoutSession(); }
function initializeCheckoutRoute(): void { initializeCheckoutSession(); }
function initializeCheckoutUi(): void { initializeCheckoutSession(); }
function defaultMinimumSeats(): number { return MINIMUM_SEATS; }
function defaultSeatCount(): number { return DEFAULT_SEATS; }
function planTitle(plan: string): string { return plan === "team" ? "Business" : plan === "go" ? "Go" : plan === "pro" || plan === "pro5x" ? "Pro" : "Plus"; }
function checkoutVariant(input: { walletOptional?: boolean; premiumBusiness?: boolean; standaloneCredit?: boolean }): string { return input.standaloneCredit ? "standaloneCredit" : input.walletOptional ? "wallet" : input.premiumBusiness ? "premiumBusiness" : "standard"; }
function planLineItem(checkout: Checkout): RecurringLineItem | undefined { return checkout.lineItems.find(isRecurringLineItem) ?? checkout.lineItems[0]; }
function annualSavingsAmount({ standardMonthlyAmount, standardAnnualMonthlyAmount, standardQuantity, premiumMonthlyAmount = 0, premiumAnnualMonthlyAmount = 0, premiumQuantity = 0 }: Record<string, number>): number { return (standardMonthlyAmount - standardAnnualMonthlyAmount) * standardQuantity + (premiumMonthlyAmount - premiumAnnualMonthlyAmount) * premiumQuantity; }
function checkoutQueryKey(accountId: string, value: CheckoutReturnValue): unknown[] { return ["subscription-checkout", accountId, value.processorEntity, value.checkoutSessionId]; }
function workspaceMembersQueryKey(accountId: string): unknown[] { return ["checkout-workspace-members", accountId]; }
function mergeTeamPlanData(request: Record<string, any>, options: { checkoutUiMode: string; isPremiumSeatsEnabled(): boolean; getConfiguredDefaultSeats(): unknown; getConfiguredSeatQuantities(): unknown }) {
  const team = request.team_plan_data;
  const campaign = typeof request.promo_campaign === "string" ? request.promo_campaign : request.promo_campaign?.promo_campaign_id;
  if (options.checkoutUiMode !== "custom" || request.plan_name !== "chatgptteamplan" || team?.price_interval !== "month" || team.existing_workspace_id != null || team.seat_quantities != null || campaign === "team-1-month-free" || !options.isPremiumSeatsEnabled() || (team.seat_quantity !== DEFAULT_SEATS && team.seat_quantity !== clampDefaultSeats({ configuredDefaultSeats: options.getConfiguredDefaultSeats(), fallbackDefaultSeats: DEFAULT_SEATS, maxSeats: 200, minimumSeats: MINIMUM_SEATS }))) return team;
  const seats = configuredSeatQuantities({ configuredSeatQuantities: options.getConfiguredSeatQuantities(), maxSeats: 200, minimumSeats: MINIMUM_SEATS });
  return { ...team, seat_quantity: seats.standardSeats + seats.premiumSeats, seat_quantities: [{ seat_type: "default", quantity: seats.standardSeats }, { seat_type: "prolite", quantity: seats.premiumSeats }] };
}

export {
  planTitle as $,
  seatBounds as A,
  annualSavingsPercent as B,
  CHECKOUT_COUNTRIES as C,
  mergeTeamPlanData as D,
  clampDefaultSeats as E,
  defaultMinimumSeats as F,
  initializeCheckoutRoute as G,
  discountPercent as H,
  initializeCheckoutSession as I,
  billingIntervalNoun as J,
  isCheckoutCountry as K,
  shouldHideSeatPicker as L,
  workspaceSeatDefaults as M,
  defaultSeatCount as N,
  parseCheckoutInput as O,
  aggregateSeatLineItems as P,
  checkoutVariant as Q,
  shouldShowPremiumSeats as R,
  CONTACT_SALES_201 as S,
  BILLING_INTERVALS as T,
  initializeCheckoutUi as U,
  annualSavingsAmount as V,
  CHECKOUT_COUNTRIES as W,
  planLineItem as X,
  checkoutSubtotal as Y,
  checkoutDueBeforeTax as Z,
  SEAT_TYPES as _,
  workspaceMembersQueryKey as a,
  initializeCheckoutPlanData as at,
  formatMinorUnits as b,
  CheckoutError as c,
  initializeCheckoutPlanData as d,
  CheckoutSummary as et,
  CheckoutForm as f,
  isVatCountry as g,
  firstMonthAmounts as h,
  checkoutQueryKey as i,
  businessSeatBreakdown as it,
  lineItemSeatMetadata as j,
  promotionRequest as k,
  CheckoutHomeLink as l,
  checkoutVariant as m,
  checkoutVerifyUrl as n,
  MINIMUM_SEATS as nt,
  initializeCheckoutSession as o,
  DEFAULT_SEATS as ot,
  initializeCheckoutUi as p,
  CheckoutForm as q,
  checkoutReturnSchema as r,
  PLAN_NAMES as rt,
  planSchema as s,
  SUPPORTED_PLANS as t,
  BILLING_INTERVALS as tt,
  CheckoutShell as u,
  CheckoutSummary as v,
  CONTACT_SALES_999 as w,
  initializeCheckoutPlanData as x,
  sumDiscounts as y,
  formatIntlAmount as z,
};

initializeCheckoutSession();
