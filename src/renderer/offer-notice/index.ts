import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";

const {
  I3: getJsxRuntime,
  K2: initializeIntlRuntime,
  Y2: FormattedMessage,
} = appSharedChunk;
const {
  CT: initializeCheckoutTheme,
  KG: initializeCheckoutButtons,
  X7: initializeCheckoutDialog,
  l9: CheckoutButton,
  qG: CheckoutDialog,
  wT: checkoutStylesExport,
} = appInitialChunk;

interface CheckoutStyles {
  offerNotice: string;
  offerNoticeTitle: string;
  planChangeDetails: string;
  root: string;
}

interface DialogComponents {
  (props: Record<string, unknown>): unknown;
  Body: unknown;
  Close: unknown;
  Content: unknown;
  Description: unknown;
  Footer: unknown;
  Header: unknown;
  Title: unknown;
}

const checkoutStyles = checkoutStylesExport as unknown as CheckoutStyles;
const Dialog = CheckoutDialog as unknown as DialogComponents;
let jsx: JsxRuntime;

export interface OfferNoticeProps {
  closeLabel: unknown;
  isDarkMode?: boolean;
  message: unknown;
  onClose(): void;
  open: boolean;
  portalClassName?: string;
  retry?: { label: unknown; onClick(): void };
  testId?: string;
  title: unknown;
}

export interface PromotionalPlanChangeDetailsProps {
  billingInterval: "month" | "year";
  currencySign: string;
  currentPlanName?: string | null;
  formattedDiscountedCost: string;
  fullPriceResumeDateFormatted: string;
  planCost: string;
  planName: string;
  renewalDateFormatted: string;
}

export interface PlanChangeDetailsProps {
  currencyCode?: string;
  currencySign?: string;
  currentPlanName: string;
  planCost?: string | null;
  planName: string;
  renewalDateFormatted?: string | null;
  useTreatmentContentStyle?: boolean;
}

function CloseIcon(props: Record<string, unknown>): unknown {
  return jsx.jsx("svg", {
    width: "1em",
    height: "1em",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    ...props,
    children: jsx.jsx("path", {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M5.83071 5.83077C6.33839 5.32309 7.16151 5.32309 7.66919 5.83077L12 10.1615L16.3307 5.83077C16.8384 5.32309 17.6615 5.32309 18.1692 5.83077C18.6769 6.33845 18.6769 7.16157 18.1692 7.66925L13.8384 12L18.1692 16.3308C18.6769 16.8385 18.6769 17.6616 18.1692 18.1693C17.6615 18.6769 16.8384 18.6769 16.3307 18.1693L12 13.8385L7.66919 18.1693C7.16151 18.6769 6.33839 18.6769 5.83071 18.1693C5.32303 17.6616 5.32303 16.8385 5.83071 16.3308L10.1615 12L5.83071 7.66925C5.32303 7.16157 5.32303 6.33845 5.83071 5.83077Z",
    }),
  });
}

function OfferNotice({
  open,
  title,
  message,
  closeLabel,
  onClose,
  retry,
  testId,
  portalClassName,
  isDarkMode,
}: OfferNoticeProps): unknown {
  initializeOfferNotice();
  const header = jsx.jsxs(Dialog.Header, {
    children: [
      jsx.jsx(Dialog.Title, {
        className: checkoutStyles.offerNoticeTitle,
        children: title,
      }),
      jsx.jsx(Dialog.Close, {
        children: jsx.jsx(CheckoutButton, {
          color: "secondary",
          variant: "ghost",
          size: "lg",
          uniform: true,
          type: "button",
          "aria-label": closeLabel,
          children: jsx.jsx(CloseIcon, { "aria-hidden": true }),
        }),
      }),
    ],
  });
  const footer = jsx.jsxs(Dialog.Footer, {
    children: [
      retry == null
        ? null
        : jsx.jsx(CheckoutButton, {
            color: "primary",
            size: "xl",
            type: "button",
            onClick: retry.onClick,
            children: retry.label,
          }),
      jsx.jsx(Dialog.Close, {
        children: jsx.jsx(CheckoutButton, {
          color: "secondary",
          size: "xl",
          type: "button",
          children: closeLabel,
        }),
      }),
    ],
  });
  return jsx.jsx(Dialog, {
    open,
    onOpenChange(nextOpen: boolean) {
      if (!nextOpen) onClose();
    },
    children: jsx.jsxs(Dialog.Content, {
      className: `${checkoutStyles.root} ${checkoutStyles.offerNotice}`,
      "data-checkout-theme": isDarkMode ? "dark" : "light",
      "data-testid": testId,
      portalClassName,
      backdrop: "dim",
      children: [
        header,
        jsx.jsx(Dialog.Body, {
          children: jsx.jsx(Dialog.Description, { children: message }),
        }),
        footer,
      ],
    }),
  });
}

function PromotionalPlanChangeDetails({
  planName,
  renewalDateFormatted,
  fullPriceResumeDateFormatted,
  formattedDiscountedCost,
  billingInterval,
  currencySign,
  planCost,
  currentPlanName,
}: PromotionalPlanChangeDetailsProps): unknown {
  initializeOfferNotice();
  const currentSubscription =
    currentPlanName == null
      ? jsx.jsx(FormattedMessage, {
          id: "planRenewalModal.currentSubscriptionPromo",
          defaultMessage:
            "After the billing cycle for your current plan ends on {renewalDateFormatted}, your promotional subscription will go into effect.",
          values: { renewalDateFormatted },
        })
      : jsx.jsx(FormattedMessage, {
          id: "planDowngradeModal.currentSubscription",
          defaultMessage:
            "Your current {currentPlanType} subscription will remain active until {renewalDateFormatted}, when it will change to {nextPlanType}.",
          values: {
            currentPlanType: currentPlanName,
            renewalDateFormatted,
            nextPlanType: planName,
          },
        });
  return jsx.jsxs(jsx.Fragment, {
    children: [
      jsx.jsx("p", { children: currentSubscription }),
      jsx.jsxs("div", {
        className:
          "mt-4 flex flex-col gap-1 rounded-2xl border border-(--border-default) bg-(--bg-secondary) p-4",
        children: [
          jsx.jsxs("div", {
            className: "flex justify-between text-sm",
            children: [
              jsx.jsx(FormattedMessage, {
                id: "planRenewalModal.newPlan",
                defaultMessage: "ChatGPT {planName}",
                values: { planName },
              }),
              jsx.jsx(FormattedMessage, {
                id: "planRenewalModal.newPlanCostAfterPromo",
                defaultMessage: "{promotionalCost} w/ promo",
                values: { promotionalCost: formattedDiscountedCost },
              }),
            ],
          }),
          jsx.jsxs("div", {
            className:
              "flex items-center justify-between text-xs text-(--text-secondary)",
            children: [
              jsx.jsx(FormattedMessage, {
                id:
                  currentPlanName == null
                    ? "planRenewalModal.billingStartAfterPromo"
                    : "planDowngradeModal.billingResumeAfterPromo",
                defaultMessage:
                  currentPlanName == null
                    ? "Billing will start on {fullPriceResumeDateFormatted}"
                    : "Billing will resume on {fullPriceResumeDateFormatted}",
                values: { fullPriceResumeDateFormatted },
              }),
              jsx.jsx(FormattedMessage, {
                id:
                  billingInterval === "month"
                    ? "planDowngradeModal.newPlanCostAfterPromoMonth"
                    : "planDowngradeModal.newPlanCostAfterPromoYear",
                defaultMessage:
                  billingInterval === "month"
                    ? "{currencySign}{planCost}/month after"
                    : "{currencySign}{planCost}/year after",
                values: { currencySign, planCost },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function PlanChangeDetails({
  currentPlanName,
  planName,
  renewalDateFormatted,
  currencyCode,
  currencySign,
  planCost,
  useTreatmentContentStyle = false,
}: PlanChangeDetailsProps): unknown {
  initializeOfferNotice();
  const current = jsx.jsx(
    FormattedMessage,
    renewalDateFormatted == null
      ? {
          id: "planDowngradeModal.currentSubscriptionWithoutDate",
          defaultMessage:
            "Your current {currentPlanType} subscription will change to {nextPlanType} at the end of your current billing period.",
          values: { currentPlanType: currentPlanName, nextPlanType: planName },
        }
      : {
          id: "planDowngradeModal.currentSubscription",
          defaultMessage:
            "Your current {currentPlanType} subscription will remain active until {renewalDateFormatted}, when it will change to {nextPlanType}.",
          values: {
            currentPlanType: currentPlanName,
            nextPlanType: planName,
            renewalDateFormatted,
          },
        },
  );
  return jsx.jsxs("div", {
    className: checkoutStyles.planChangeDetails,
    children: [
      jsx.jsx("p", {
        className: useTreatmentContentStyle
          ? "text-base leading-[26px] tracking-[-0.32px] text-token-text-primary"
          : "text-token-text-secondary",
        children: current,
      }),
      jsx.jsxs("div", {
        className: `flex flex-col gap-1 rounded-2xl border border-(--border-default) bg-(--main-surface-secondary) p-4 ${useTreatmentContentStyle ? "mt-5" : "mt-4"}`,
        children: [
          jsx.jsxs("div", {
            className: "flex justify-between",
            children: [
              jsx.jsx("span", {
                className: "font-semibold",
                children: jsx.jsx(FormattedMessage, {
                  id: "planDowngradeModal.newPlan",
                  defaultMessage: "ChatGPT {capitalizedUpdatedPlanType}",
                  values: { capitalizedUpdatedPlanType: planName },
                }),
              }),
              planCost == null
                ? null
                : jsx.jsx("span", {
                    className: "text-token-text-secondary",
                    children: jsx.jsx(FormattedMessage, {
                      id: "planDowngradeModal.newPlanCost",
                      defaultMessage:
                        "{currencyCode} {currencySign}{planCost}/month",
                      values: { currencyCode, currencySign, planCost },
                    }),
                  }),
            ],
          }),
          jsx.jsx("div", {
            className: "text-token-text-secondary",
            children: jsx.jsx(
              FormattedMessage,
              renewalDateFormatted == null
                ? {
                    id: "settings.usage.pricingPlanPage.proLiteDowngrade.billingStartWithoutDate",
                    defaultMessage:
                      "Billing will start at the end of your current billing period",
                  }
                : {
                    id: "planDowngradeModal.billingStart",
                    defaultMessage:
                      "Billing will start on {renewalDateFormatted}",
                    values: { renewalDateFormatted },
                  },
            ),
          }),
        ],
      }),
    ],
  });
}

let initialized = false;
function initializeOfferNotice(): void {
  if (initialized) return;
  initializeCheckoutDialog();
  initializeCheckoutButtons();
  initializeIntlRuntime();
  initializeCheckoutTheme();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeOfferNotice();

export {
  initializeOfferNotice as i,
  PromotionalPlanChangeDetails as n,
  PlanChangeDetails as r,
  OfferNotice as t,
};
