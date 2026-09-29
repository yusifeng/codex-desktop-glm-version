// billing-settings —— 个人账户账单资格、计划、钱包与付款方式设置。

import * as addPaymentMethodChunk from "@rchunk/add-payment-method";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/billing-cadence-dialog";
import "@rchunk/billing-events";
import "@rchunk/billing-form-options";
import "@rchunk/billing-pricing";
import * as billingQueriesChunk from "@rchunk/billing-queries";
import * as billingQueryErrorChunk from "@rchunk/billing-query-error";
import * as billingStateChunk from "@rchunk/billing-state";
import "@rchunk/cadence-events";
import "@rchunk/chatgpt-subscription-events";
import "@rchunk/checkout-error";
import * as editPaymentMethodChunk from "@rchunk/edit-payment-method";
import * as eligibilityChunk from "@rchunk/eligibility";
import * as formatAmountChunk from "@rchunk/format-amount";
import "@rchunk/offer-notice";
import * as paymentMethodDisplayChunk from "@rchunk/payment-method-display";
import "@rchunk/plan-downgrade-dialog-core";
import "@rchunk/plan-names";
import "@rchunk/pricing";
import "@rchunk/pricing-promotions";
import * as accountBillingQueriesChunk from "@rchunk/queries";
import "@rchunk/rolldown-runtime";
import * as settingsLoadingRowChunk from "@rchunk/settings-loading-row";
import * as subscriptionCancellationChunk from "@rchunk/subscription-cancellation-dialog";
import * as subscriptionPlanStatusChunk from "@rchunk/subscription-plan-status";
import "@rchunk/subscription-platform-dialog";
import * as subscriptionRenewalChunk from "@rchunk/subscription-renewal-dialog";
import "@rchunk/subscription-queries";
import "@rchunk/subscription-update-dialog";
import "@rchunk/stripe-client";
import "@rchunk/stripe-pure";
import "@rchunk/tax-types";
import type { IntlShape, JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type PlanType = "free" | "go" | "plus" | "pro" | "prolite" | string;
type ManagementSource =
  "app_store" | "google_play_store" | "partner_managed" | null;

interface QueryState<Data> {
  data?: Data;
  error?: unknown;
  isError: boolean;
  isFetching?: boolean;
  isLoading?: boolean;
  isPending?: boolean;
  refetch(): Promise<unknown> | unknown;
}

interface BillingAccount {
  account: {
    plan_type?: PlanType;
    processor?: { a001?: { has_customer_object?: boolean } };
  };
  can_access_with_session?: boolean;
  entitlement: {
    billing_currency?: string | null;
    cancels_at?: string | null;
    has_active_subscription?: boolean;
    is_delinquent?: boolean;
    renews_at?: string | null;
  };
  last_active_subscription?: {
    purchase_origin_platform?: string;
    will_renew?: boolean;
  };
  usage?: { label?: string; limit?: number; used?: number } | null;
}

interface WalletData {
  balance: number;
  balances?: { usd?: number };
  currency?: string | null;
  has_redeemed_gift_card?: boolean;
}

interface PaymentMethod {
  card?: {
    brand?: string;
    exp_month?: number;
    exp_year?: number;
    last4?: string;
  };
  id: string;
  type: string;
}

interface PaymentMethodsData {
  default_payment_method_id?: string | null;
  payment_methods: PaymentMethod[];
}

interface ActiveAccount {
  id: string;
  structure: string;
}

interface SharedRuntime {
  $3(): void;
  BX<Data>(query: unknown, input: string): QueryState<Data>;
  FX(): void;
  I3(): JsxRuntime;
  _L<Data>(options: unknown): QueryState<Data>;
  e6: (() => ReactRuntime) & ReactRuntime;
  n4(): IntlShape;
}

interface InitialRuntime {
  N6t(): { accountId: string; userId: string | null };
  Vcn(): void;
  jI(): (input: Record<string, unknown>) => void;
  o_n(): (path: string) => Promise<unknown> | unknown;
  ofn(gateId: string): boolean;
  uht(): QueryState<ActiveAccount>;
}

interface AccountBillingQueriesRuntime {
  i(): void;
  r: unknown;
  t: unknown;
}

interface EligibilityRuntime {
  r(): void;
  t(
    account: BillingAccount,
    wallet: WalletData | undefined,
    restrictions: { countryEligible: boolean; restrictionsEnabled: boolean },
  ): { canRedeem: boolean; showWallet: boolean; usdBalance: number };
}

interface BillingQueriesRuntime {
  n(): void;
  r(accountId: string): unknown;
}

interface BillingStateRuntime {
  n(account: BillingAccount): ManagementSource;
  r(): void;
}

interface LoadingRuntime {
  n(): void;
  t(props: { children?: unknown }): unknown;
}

interface QueryErrorRuntime {
  n(): void;
  t(props: { onRetry(): void }): unknown;
}

interface PlanStatusRuntime {
  n(props: { account: BillingAccount; showProLevels?: boolean }): unknown;
  r(): void;
  t(input: { plan: PlanType; showProLevels?: boolean }): string;
}

interface AmountRuntime {
  n(): void;
  t(intl: IntlShape, amount: number, currencyCode: string): string;
}

interface PaymentDisplayRuntime {
  n(): void;
  t(method: PaymentMethod): { description: unknown; label: unknown };
}

interface AddPaymentRuntime {
  n(): void;
  t(props: Record<string, unknown>): unknown;
}

interface EditPaymentRuntime {
  n(): void;
  t(props: Record<string, unknown>): unknown;
}

interface DialogRuntime {
  CancellationDialog(props: Record<string, unknown>): unknown;
}

interface RenewalRuntime {
  SubscriptionRenewalDialog(props: Record<string, unknown>): unknown;
}

const {
  $3: initializeRuntimeLazy,
  BX: useKeyedQuery,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  _L: useQuery,
  e6: getReactRuntime,
  n4: useIntl,
} = appSharedChunk as unknown as SharedRuntime;
const {
  N6t: useAuthenticatedAccount,
  Vcn: initializeSettingsRuntime,
  jI: useOpenPricing,
  o_n: useOpenExternalPath,
  ofn: isGateEnabled,
  uht: useActiveAccount,
} = appInitialChunk as unknown as InitialRuntime;
const {
  i: initializeAccountBillingQueries,
  r: walletQuery,
  t: billingAccountQuery,
} = accountBillingQueriesChunk as unknown as AccountBillingQueriesRuntime;
const { r: initializeEligibility, t: resolveWalletEligibility } =
  eligibilityChunk as unknown as EligibilityRuntime;
const { n: initializeBillingQueries, r: paymentMethodsQuery } =
  billingQueriesChunk as unknown as BillingQueriesRuntime;
const { n: getManagementSource, r: initializeBillingState } =
  billingStateChunk as unknown as BillingStateRuntime;
const { n: initializeSettingsLoadingRow, t: SettingsLoadingRow } =
  settingsLoadingRowChunk as unknown as LoadingRuntime;
const { n: initializeBillingQueryError, t: BillingQueryError } =
  billingQueryErrorChunk as unknown as QueryErrorRuntime;
const {
  n: SubscriptionPlanStatus,
  r: initializeSubscriptionPlanStatus,
  t: getPlanName,
} = subscriptionPlanStatusChunk as unknown as PlanStatusRuntime;
const { n: initializeAmount, t: formatAmount } =
  formatAmountChunk as unknown as AmountRuntime;
const { n: initializePaymentDisplay, t: displayPaymentMethod } =
  paymentMethodDisplayChunk as unknown as PaymentDisplayRuntime;
const { n: initializeAddPaymentMethod, t: AddPaymentMethod } =
  addPaymentMethodChunk as unknown as AddPaymentRuntime;
const { n: initializeEditPaymentMethod, t: EditPaymentMethod } =
  editPaymentMethodChunk as unknown as EditPaymentRuntime;
const { CancellationDialog } =
  subscriptionCancellationChunk as unknown as DialogRuntime;
const { SubscriptionRenewalDialog } =
  subscriptionRenewalChunk as unknown as RenewalRuntime;

const WALLET_GATE = "200883286";

let jsx: JsxRuntime;
let React: ReactRuntime;

function Section({
  action,
  children,
  title,
}: {
  action?: unknown;
  children: unknown;
  title: string;
}): unknown {
  return jsx.jsxs("section", {
    className: "billing-section",
    children: [
      jsx.jsxs("header", {
        children: [jsx.jsx("h2", { children: title }), action ?? null],
      }),
      children,
    ],
  });
}

function planAction(
  account: BillingAccount,
  source: ManagementSource,
): "change" | "external_manage" | "renew" | "upgrade" {
  if (source != null) return "external_manage";
  if (
    account.entitlement.has_active_subscription === true &&
    account.last_active_subscription?.will_renew === false &&
    account.entitlement.cancels_at == null
  ) {
    return "renew";
  }
  return (account.account.plan_type ?? "free") === "free"
    ? "upgrade"
    : "change";
}

function planActionLabel(
  action: ReturnType<typeof planAction>,
  plan: PlanType,
): string {
  if (action === "external_manage") return "Manage";
  if (action === "renew") return "Renew " + getPlanName({ plan }) + " Plan";
  if (action === "upgrade") return "Upgrade";
  return "Change plan";
}

function ConsumerBillingContent({
  accountId,
  account,
}: {
  accountId: string;
  account: BillingAccount;
}): unknown {
  const intl = useIntl();
  const openPricing = useOpenPricing();
  const openExternalPath = useOpenExternalPath();
  const walletState = useKeyedQuery<WalletData>(walletQuery, accountId);
  const paymentMethodsState = useQuery<PaymentMethodsData>(
    paymentMethodsQuery(accountId),
  );
  const [dialog, setDialog] = React.useState<
    | { kind: "add-payment" }
    | { kind: "cancel" }
    | { kind: "edit-payment"; method: PaymentMethod }
    | { kind: "platform"; source: Exclude<ManagementSource, null> }
    | { kind: "renewal" }
    | null
  >(null);
  const source = getManagementSource(account);
  const action = planAction(account, source);
  const plan = account.account.plan_type ?? "free";
  const walletEnabled = isGateEnabled(WALLET_GATE);
  const walletEligibility = resolveWalletEligibility(
    account,
    walletState.data,
    {
      countryEligible: true,
      restrictionsEnabled: false,
    },
  );
  const hasBillingCustomer =
    source == null &&
    (plan !== "free" ||
      account.account.processor?.a001?.has_customer_object === true);

  const onPlanAction = (): void => {
    if (action === "external_manage" && source != null) {
      setDialog({ kind: "platform", source });
      return;
    }
    if (action === "renew") {
      setDialog({ kind: "renewal" });
      return;
    }
    openPricing({
      currentPlan: plan,
      nativeSurfaceTabOverride: "personal",
      source: "consumer_billing_settings_plan_row",
    });
  };

  const planSection = jsx.jsx(Section, {
    title: "Plan",
    action: jsx.jsx("button", {
      type: "button",
      disabled: walletState.isFetching === true,
      onClick: onPlanAction,
      children: planActionLabel(action, plan),
    }),
    children: jsx.jsxs("div", {
      children: [
        jsx.jsx("strong", { children: getPlanName({ plan }) }),
        jsx.jsx(SubscriptionPlanStatus, { account }),
      ],
    }),
  });

  let walletContent: unknown = null;
  if (walletEnabled && walletEligibility.showWallet) {
    if (
      walletState.isPending ||
      walletState.isLoading ||
      walletState.isFetching
    ) {
      walletContent = jsx.jsx("p", {
        role: "status",
        children: "Loading balance…",
      });
    } else if (walletState.isError || walletState.data == null) {
      walletContent = jsx.jsxs("div", {
        role: "alert",
        children: [
          jsx.jsx("span", { children: "Not available" }),
          jsx.jsx("button", {
            type: "button",
            onClick: () => {
              void walletState.refetch();
            },
            children: "Retry",
          }),
        ],
      });
    } else {
      const balance =
        walletEligibility.usdBalance === 0
          ? walletState.data.balance
          : walletEligibility.usdBalance;
      const currency = walletState.data.currency ?? "usd";
      walletContent = jsx.jsx("p", {
        "data-wallet-balance": true,
        children: formatAmount(intl, Math.max(0, -balance), currency),
      });
    }
  }
  const walletSection =
    walletEnabled && walletEligibility.showWallet
      ? jsx.jsx(Section, {
          title: "Wallet balance",
          action: walletEligibility.canRedeem
            ? jsx.jsx("button", {
                type: "button",
                onClick: () => {
                  void openExternalPath("/redeem?entry_point=billing");
                },
                children: "Redeem gift card",
              })
            : null,
          children: walletContent,
        })
      : null;

  const usage =
    account.usage == null
      ? null
      : jsx.jsx(Section, {
          title: account.usage.label ?? "Usage",
          children: jsx.jsx("p", {
            "data-billing-usage": true,
            children:
              String(account.usage.used ?? 0) +
              (account.usage.limit == null
                ? ""
                : " / " + String(account.usage.limit)),
          }),
        });

  let paymentContent: unknown = null;
  if (hasBillingCustomer) {
    if (paymentMethodsState.isPending || paymentMethodsState.isLoading) {
      paymentContent = jsx.jsx(SettingsLoadingRow, {
        children: "Loading payment methods",
      });
    } else if (
      paymentMethodsState.isError ||
      paymentMethodsState.data == null
    ) {
      paymentContent = jsx.jsx(BillingQueryError, {
        onRetry: () => {
          void paymentMethodsState.refetch();
        },
      });
    } else if (paymentMethodsState.data.payment_methods.length === 0) {
      paymentContent = jsx.jsx("p", {
        children: "No payment methods available",
      });
    } else {
      paymentContent = paymentMethodsState.data.payment_methods.map(
        (method) => {
          const display = displayPaymentMethod(method);
          const isDefault =
            method.id === paymentMethodsState.data?.default_payment_method_id;
          return jsx.jsxs(
            "div",
            {
              "data-payment-method-id": method.id,
              children: [
                jsx.jsxs("span", {
                  children: [
                    display.label,
                    display.description,
                    isDefault ? " Default" : null,
                  ],
                }),
                jsx.jsx("button", {
                  type: "button",
                  disabled: paymentMethodsState.isFetching === true,
                  onClick: () => setDialog({ kind: "edit-payment", method }),
                  children: "Edit",
                }),
              ],
            },
            method.id,
          );
        },
      );
    }
  }
  const paymentSection = hasBillingCustomer
    ? jsx.jsx(Section, {
        title: "Payment methods",
        action: jsx.jsx("button", {
          type: "button",
          disabled:
            paymentMethodsState.isPending === true ||
            paymentMethodsState.isFetching === true,
          onClick: () => setDialog({ kind: "add-payment" }),
          children: "Add new",
        }),
        children: paymentContent,
      })
    : null;

  const cancelSection =
    account.entitlement.has_active_subscription === true &&
    account.last_active_subscription?.will_renew !== false &&
    account.entitlement.cancels_at == null
      ? jsx.jsx(Section, {
          title: "Cancel plan",
          children: jsx.jsxs("div", {
            children: [
              jsx.jsx("p", {
                children:
                  "If you cancel, you'll keep full access to your plan features until the end of your billing period",
              }),
              jsx.jsx("button", {
                type: "button",
                onClick: () => setDialog({ kind: "cancel" }),
                children: "Cancel",
              }),
            ],
          }),
        })
      : null;

  let dialogContent: unknown = null;
  if (dialog?.kind === "add-payment") {
    dialogContent = jsx.jsx(AddPaymentMethod, {
      accountId,
      onClose: () => setDialog(null),
      onSuccess: () => {
        setDialog(null);
        void paymentMethodsState.refetch();
      },
    });
  } else if (dialog?.kind === "edit-payment") {
    dialogContent = jsx.jsx(EditPaymentMethod, {
      accountId,
      method: dialog.method,
      methodId: dialog.method.id,
      onClose: () => setDialog(null),
      onSave: async () => {
        await paymentMethodsState.refetch();
        setDialog(null);
      },
    });
  } else if (dialog?.kind === "cancel") {
    dialogContent = jsx.jsx(CancellationDialog, {
      account,
      accountId,
      onClose: () => setDialog(null),
    });
  } else if (dialog?.kind === "renewal") {
    dialogContent = jsx.jsx(SubscriptionRenewalDialog, {
      account,
      accountId,
      onClose: () => setDialog(null),
    });
  } else if (dialog?.kind === "platform") {
    dialogContent = jsx.jsxs("div", {
      role: "dialog",
      "data-management-source": dialog.source,
      children: [
        jsx.jsx("p", {
          children:
            dialog.source === "app_store"
              ? "Manage this subscription in the App Store"
              : dialog.source === "google_play_store"
                ? "Manage this subscription in Google Play"
                : "Manage this subscription with your billing partner",
        }),
        jsx.jsx("button", {
          type: "button",
          onClick: () => setDialog(null),
          children: "Close",
        }),
      ],
    });
  }

  return jsx.jsxs("div", {
    className: "flex flex-col gap-6",
    children: [
      planSection,
      walletSection,
      usage,
      paymentSection,
      cancelSection,
      dialogContent,
    ],
  });
}

function ConsumerBillingSettings(): unknown {
  const { accountId, userId } = useAuthenticatedAccount();
  const activeAccount = useActiveAccount();
  if (activeAccount.isLoading || activeAccount.isPending) {
    return jsx.jsxs("main", {
      children: [
        jsx.jsx("h1", { children: "Billing" }),
        jsx.jsx(SettingsLoadingRow, { children: "Loading settings…" }),
      ],
    });
  }
  if (
    activeAccount.data?.structure !== "personal" ||
    activeAccount.data.id !== accountId ||
    userId == null
  ) {
    return jsx.jsx("main", {
      children: jsx.jsx("h1", { children: "Billing" }),
    });
  }

  const billingState = useKeyedQuery<BillingAccount>(
    billingAccountQuery,
    accountId,
  );
  let content: unknown;
  if (billingState.isPending || billingState.isLoading) {
    content = jsx.jsx(SettingsLoadingRow, { children: "Loading settings…" });
  } else if (
    billingState.isError ||
    billingState.data == null ||
    billingState.data.can_access_with_session === false
  ) {
    content = jsx.jsx(BillingQueryError, {
      onRetry: () => {
        void billingState.refetch();
      },
    });
  } else {
    content = jsx.jsx(ConsumerBillingContent, {
      accountId,
      account: billingState.data,
    });
  }
  return jsx.jsxs("main", {
    children: [jsx.jsx("h1", { children: "Billing" }), content],
  });
}

function initializeBillingSettings(): void {
  initializeRuntimeLazy?.();
  initializeSignalRuntime?.();
  initializeSettingsRuntime?.();
  initializeAccountBillingQueries?.();
  initializeEligibility?.();
  initializeBillingQueries?.();
  initializeBillingState?.();
  initializeSettingsLoadingRow?.();
  initializeBillingQueryError?.();
  initializeSubscriptionPlanStatus?.();
  initializeAmount?.();
  initializePaymentDisplay?.();
  initializeAddPaymentMethod?.();
  initializeEditPaymentMethod?.();
  React =
    typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
  jsx = typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

initializeBillingSettings();

export { ConsumerBillingSettings };
