// subscription-update-dialog —— 续订、保存卡升级和计划降级确认弹窗。
// 原版：app/webview/assets/subscription-update-dialog-4a5f993296a4.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as promotionsChunk from "@rchunk/pricing-promotions";
import * as planNamesChunk from "@rchunk/plan-names";
import * as pricingChunk from "@rchunk/pricing";
import * as offerNoticeChunk from "@rchunk/offer-notice";

void runtimeChunk;
const {
  $3: initializeDialogPrimitives,
  Ah: DialogHeader,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeReactRuntime,
  Oh: DialogBody,
  Y2: FormattedMessage,
  Yh: Button,
  h4: initializeClassNames,
  jh: DialogSection,
  kh: DialogActions,
  m4: classNames,
  n4: useIntl,
} = appSharedChunk;
const { TI: formatCurrencyAmount } = appInitialChunk;
const {
  f: initializePromotionMessages,
  m: initializePromotionPricing,
  n: nativeTrialCampaign,
} = promotionsChunk;
const { n: getPlanName, r: initializePlanNames } = planNamesChunk;
const { n: getFormattedPrice } = pricingChunk;
const {
  i: initializeOfferNotice,
  n: RenewalNotice,
  r: PlanChangeNotice,
} = offerNoticeChunk;

type IntlShape = import("@rchunk/app-shared").IntlShape;
type JsxRuntime = import("@rchunk/app-shared").JsxRuntime;
type SubscriptionPlanSlug =
  import("@rchunk/subscription-update-plan").SubscriptionPlanSlug;

interface PaymentMethod {
  card_brand?: string | null;
  card_last4?: string | null;
}

interface AmountDue {
  amount: number;
  amount_excluding_tax: number;
  tax_amount: number;
}

interface SubscriptionPreview {
  amount_due: AmountDue;
  currency: string;
  positive_line_item_total: number;
  renewal_date?: string | number | Date | null;
}

interface PricingInfo {
  currencyCode: string;
  minorUnitExponent: number;
  monthlyAmounts: Record<string, number>;
}

interface SavedCardSubscriptionUpdate {
  fullyCoveredByWallet?: boolean;
  kind: "saved_card_upgrade";
  minorUnitExponent: number;
  paymentMethod?: PaymentMethod;
  paymentMethodLabel?: string;
  preview: SubscriptionPreview;
  promotionDisclaimer?: unknown;
  updatedPlan: SubscriptionPlanSlug;
  upgrade?: { promoCampaign?: string | null };
}

interface ScheduledSubscriptionUpdate {
  currentPlan?: string;
  kind: "scheduled_downgrade";
  preview: Pick<SubscriptionPreview, "renewal_date">;
  updatedPlan: SubscriptionPlanSlug;
}

interface RenewalSubscriptionUpdate {
  renewal: Record<string, unknown>;
}

type SubscriptionUpdate =
  | RenewalSubscriptionUpdate
  | SavedCardSubscriptionUpdate
  | ScheduledSubscriptionUpdate;

interface FormSubmitEvent {
  preventDefault(): void;
}

interface SubscriptionUpdateDialogProps {
  disableConfirm?: boolean;
  error?: unknown;
  isUpdating?: boolean;
  onBack?(): void;
  onCancel(): void;
  onConfirm(): void;
  onGoToWeb?(): void;
  onOpenChange(open: boolean): void;
  onShown?(): void;
  pricingInfo?: PricingInfo | null;
  scheduledPrice?: import("@rchunk/pricing").FormattedPrice | null;
  subscriptionUpdate: SubscriptionUpdate;
}

let jsx: JsxRuntime;
let initialized = false;
function initializeSubscriptionUpdateDialog(): void {
  if (initialized) return;
  initializeDialogPrimitives();
  initializeReactRuntime();
  initializeClassNames();
  initializeOfferNotice();
  initializePlanNames();
  initializePromotionPricing();
  initializePromotionMessages();
  jsx = getJsxRuntime();
  initialized = true;
}

function message(
  id: string,
  defaultMessage: string,
  values?: import("@rchunk/app-shared").MessageValues,
): unknown {
  return jsx.jsx(FormattedMessage, {
    id,
    defaultMessage,
    description: defaultMessage,
    values,
  });
}
function formatAmount(
  intl: IntlShape,
  amount: number,
  currency: string,
  exponent: number,
): unknown {
  const input = {
    intl,
    amount: amount / 10 ** exponent,
    currencyCode: currency.toUpperCase(),
    currencyFractionDigits: exponent,
  };
  return (
    formatCurrencyAmount(input) ??
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: input.currencyCode,
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    }).format(input.amount)
  );
}
function planLabel(plan: string): string {
  switch (plan) {
    case "chatgptgoplan":
      return "Go";
    case "chatgptplusplan":
      return "Plus";
    case "chatgptprolite":
      return "Pro 5x";
    case "chatgptpro":
      return "Pro 20x";
    default:
      return plan;
  }
}
function paymentMethodLabel(paymentMethod?: PaymentMethod): string {
  const brand = paymentMethod?.card_brand?.trim() ?? "";
  const last4 = paymentMethod?.card_last4?.trim() ?? "";
  if (brand && last4) return `${brand.toUpperCase()} *${last4}`;
  return last4 ? `*${last4}` : brand;
}

function SavedCardSummary({
  intl,
  pricingInfo,
  subscriptionUpdate,
}: {
  intl: IntlShape;
  pricingInfo?: PricingInfo | null;
  subscriptionUpdate: SavedCardSubscriptionUpdate;
}): { body: unknown; confirmLabel: unknown; description: unknown } {
  const update = subscriptionUpdate;
  const preview = update.preview;
  const target = planLabel(update.updatedPlan);
  const promoTrial =
    update.upgrade?.promoCampaign === nativeTrialCampaign &&
    pricingInfo != null;
  const description =
    promoTrial ||
    update.fullyCoveredByWallet ||
    update.promotionDisclaimer != null
      ? null
      : message(
          "settings.usage.pricingPlanPage.savedCardUpgrade.description",
          "You're upgrading to ChatGPT {targetPlan}. This will charge your saved payment method.",
          { targetPlan: target },
        );
  const subtotal = formatAmount(
    intl,
    preview.amount_due.amount_excluding_tax,
    preview.currency,
    update.minorUnitExponent,
  );
  const tax = formatAmount(
    intl,
    preview.amount_due.tax_amount,
    preview.currency,
    update.minorUnitExponent,
  );
  const total = formatAmount(
    intl,
    preview.amount_due.amount,
    preview.currency,
    update.minorUnitExponent,
  );
  const billingNotice =
    update.promotionDisclaimer ??
    message(
      "settings.usage.pricingPlanPage.subscriptionUpdate.billingCycle",
      "Billed monthly, starting today",
    );
  const method =
    update.paymentMethodLabel ?? paymentMethodLabel(update.paymentMethod);
  return {
    description,
    confirmLabel:
      preview.amount_due.amount > 0
        ? message(
            "settings.usage.pricingPlanPage.savedCardUpgrade.payNow",
            "Pay now",
          )
        : message(
            "settings.usage.pricingPlanPage.savedCardUpgrade.confirm",
            "Confirm",
          ),
    body: jsx.jsxs("div", {
      className: "flex flex-col text-sm",
      children: [
        jsx.jsxs("div", {
          className: "flex justify-between gap-4 font-semibold",
          children: [
            message(
              "settings.usage.pricingPlanPage.subscriptionUpdate.subscription",
              "ChatGPT {targetPlan} subscription",
              { targetPlan: target },
            ),
            jsx.jsx("span", {
              children: formatAmount(
                intl,
                preview.positive_line_item_total,
                preview.currency,
                update.minorUnitExponent,
              ),
            }),
          ],
        }),
        jsx.jsx("span", {
          className: "mt-0.5 text-xs text-secondary",
          children: billingNotice,
        }),
        jsx.jsx("hr", { className: "my-4 border-default" }),
        preview.amount_due.tax_amount > 0
          ? jsx.jsxs(jsx.Fragment, {
              children: [
                jsx.jsxs("div", {
                  className: "flex justify-between gap-4",
                  children: [
                    message("subscriptionUpdate.subtotal", "Subtotal"),
                    subtotal,
                  ],
                }),
                jsx.jsxs("div", {
                  className: "mt-2 flex justify-between gap-4",
                  children: [message("subscriptionUpdate.tax", "Tax"), tax],
                }),
              ],
            })
          : null,
        jsx.jsxs("div", {
          className: classNames(
            "flex justify-between gap-4 font-semibold",
            preview.amount_due.tax_amount > 0 && "mt-2",
          ),
          children: [
            message("subscriptionUpdate.totalDueToday", "Total due today"),
            total,
          ],
        }),
        method
          ? jsx.jsxs(jsx.Fragment, {
              children: [
                jsx.jsx("hr", { className: "my-4 border-default" }),
                jsx.jsxs("div", {
                  className: "flex items-center justify-between gap-4",
                  children: [
                    message(
                      "subscriptionUpdate.paymentMethod",
                      "Payment method",
                    ),
                    jsx.jsx("span", {
                      className: "truncate text-secondary",
                      children: method,
                    }),
                  ],
                }),
              ],
            })
          : null,
      ],
    }),
  };
}

function ScheduledChangeSummary({
  intl,
  pricingInfo,
  scheduledPrice,
  update,
}: {
  intl: IntlShape;
  pricingInfo?: PricingInfo | null;
  scheduledPrice?: import("@rchunk/pricing").FormattedPrice | null;
  update: ScheduledSubscriptionUpdate;
}): unknown {
  const preview = update.preview;
  const targetKey =
    update.updatedPlan === "chatgptgoplan"
      ? "go"
      : update.updatedPlan === "chatgptplusplan"
        ? "plus"
        : "prolite";
  const currentKey =
    update.currentPlan ?? (targetKey === "go" ? "plus" : "pro");
  const currentPlanName =
    getPlanName({
      planType: currentKey,
      initialPlanType: currentKey,
      updatedPlanType: targetKey,
    }) ?? currentKey;
  const planName =
    getPlanName({
      planType: targetKey,
      initialPlanType: currentKey,
      updatedPlanType: targetKey,
    }) ?? targetKey;
  const computedPrice =
    scheduledPrice ??
    (pricingInfo == null
      ? null
      : getFormattedPrice({
          intl,
          amount: pricingInfo.monthlyAmounts[targetKey],
          currencyCode: pricingInfo.currencyCode,
          minorUnitExponent: pricingInfo.minorUnitExponent,
        }));
  return jsx.jsx(PlanChangeNotice, {
    currentPlanName,
    planName,
    renewalDateFormatted:
      preview.renewal_date == null
        ? null
        : intl.formatDate(preview.renewal_date, {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
    currencyCode: computedPrice?.currencyCodeLabel ?? null,
    currencySign: "",
    planCost: computedPrice?.formatted ?? null,
  });
}

function SubscriptionUpdateDialog(
  props: SubscriptionUpdateDialogProps,
): unknown {
  initializeSubscriptionUpdateDialog();
  const {
    disableConfirm = false,
    error,
    isUpdating,
    onBack,
    onCancel,
    onConfirm,
    onGoToWeb,
    onOpenChange,
    onShown,
    pricingInfo,
    scheduledPrice,
    subscriptionUpdate,
  } = props;
  const intl = useIntl();
  const scheduled =
    "kind" in subscriptionUpdate &&
    subscriptionUpdate.kind === "scheduled_downgrade";
  let description: unknown = null;
  let body: unknown;
  let confirmLabel: unknown = message("planRenewalModal.confirm", "Confirm");
  if ("renewal" in subscriptionUpdate) {
    body = jsx.jsx(RenewalNotice, { ...subscriptionUpdate.renewal });
  } else if (subscriptionUpdate.kind === "saved_card_upgrade") {
    const summary = SavedCardSummary({ intl, pricingInfo, subscriptionUpdate });
    description = summary.description;
    body = summary.body;
    confirmLabel = summary.confirmLabel;
  } else {
    body = ScheduledChangeSummary({
      intl,
      pricingInfo,
      scheduledPrice,
      update: subscriptionUpdate,
    });
    confirmLabel = message("subscriptionUpdate.downgrade.confirm", "Confirm");
  }
  const cancel = onBack ?? onCancel;
  return jsx.jsx(Dialog, {
    open: true,
    contentProps: { onOpenAutoFocus: onShown },
    contentClassName: scheduled ? "w-[500px]!" : undefined,
    variant: scheduled ? "chatgpt" : "default",
    showDialogClose: !isUpdating,
    size: "default",
    onOpenChange,
    children: jsx.jsxs(DialogBody, {
      as: "form",
      variant: scheduled ? "chatgpt" : "default",
      className: scheduled ? "px-6 pb-6" : undefined,
      onSubmit: (event: FormSubmitEvent) => {
        event.preventDefault();
        if (!isUpdating && !disableConfirm) onConfirm();
      },
      children: [
        jsx.jsx(DialogSection, {
          children: jsx.jsx(DialogHeader, {
            title: message("subscriptionUpdate.title", "Confirm plan changes"),
            subtitle: description,
          }),
        }),
        jsx.jsx(DialogSection, {
          className: scheduled ? "pt-0!" : undefined,
          children: body,
        }),
        error == null ? null : jsx.jsx(DialogSection, { children: error }),
        jsx.jsx(DialogSection, {
          className: scheduled ? "pt-8!" : undefined,
          children: jsx.jsxs(DialogActions, {
            className: scheduled ? "gap-2" : undefined,
            children: [
              jsx.jsx(Button, {
                color: scheduled ? "secondary" : "ghost",
                disabled: isUpdating,
                type: "button",
                onClick: cancel,
                children:
                  onBack == null
                    ? message("subscriptionUpdate.cancel", "Cancel")
                    : message("subscriptionUpdate.back", "Back"),
              }),
              scheduled && onGoToWeb != null
                ? jsx.jsx(Button, {
                    color: "secondary",
                    disabled: isUpdating,
                    type: "button",
                    onClick: onGoToWeb,
                    children: message(
                      "subscriptionUpdate.goToWeb",
                      "Go to web",
                    ),
                  })
                : null,
              jsx.jsx(Button, {
                color: "primary",
                disabled: isUpdating || disableConfirm,
                loading: isUpdating,
                type: "submit",
                children: confirmLabel,
              }),
            ],
          }),
        }),
      ],
    }),
  });
}

initializeSubscriptionUpdateDialog();
export {
  initializeSubscriptionUpdateDialog as n,
  SubscriptionUpdateDialog as t,
};
