// Pricing-plan upgrade confirmation helpers. Release chunk: confirm-pricing-plan-upgrade-32a0f7010a57.js.
import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as accountQueriesChunk from "@rchunk/queries";
import * as subscriptionPlanChunk from "@rchunk/subscription-update-plan";
import * as billingQueriesChunk from "@rchunk/billing-queries";
import * as stripeClientChunk from "@rchunk/stripe-client";
import * as billingStateChunk from "@rchunk/billing-state";
import * as paymentMethodDisplayChunk from "@rchunk/payment-method-display";
import * as confirmUpgradeChunk from "@rchunk/confirm-subscription-upgrade";
import * as delinquentUpgradeChunk from "@rchunk/delinquent-upgrade-preparation";

type QueryClient = { fetchQuery<T>(options: unknown): Promise<T> };
interface UpgradeScope {
  queryClient: QueryClient;
}
interface PaymentMethod {
  id: string;
  type: string;
  [key: string]: unknown;
}
interface AccountRecord {
  account: {
    account_id: string;
    account_user_id?: string | null;
    plan_type: string;
    structure: string;
  };
  last_active_subscription: { will_renew?: boolean };
}
interface AccountResponse {
  accounts: Record<string, AccountRecord>;
}
interface PaymentMethodsResponse {
  default_payment_method_id?: string | null;
  payment_methods: PaymentMethod[];
}
interface StripeResponse {
  stripe: unknown;
}
interface ExperimentLayer {
  get<Value>(key: string, fallback: Value): Value;
}
interface StatsigClient {
  getLayer(id: string): ExperimentLayer;
}
interface UpgradeInput {
  scope: UpgradeScope;
  accountId: string;
  userId: string;
  initialPlan: string;
  updatedPlan: string;
  promoCampaign?: string | null;
  promoCode?: string | null;
  paymentMethodId?: string | null;
  statsigClient: StatsigClient;
  signal?: AbortSignal;
  isActive(): boolean;
}
type UpgradeResult = Record<string, unknown> & { status?: string };

interface InitialRuntime {
  D0(input: { currentPlan: unknown; targetPlan: unknown }): string;
  O0(plan: string): { pricePlan: unknown } | null | undefined;
  j0(): void;
}
interface ConfirmRuntime {
  n(): void;
  t(
    scope: UpgradeScope,
    input: Record<string, unknown>,
  ): Promise<UpgradeResult>;
}

const initial = appInitialChunk as unknown as InitialRuntime;
const accountQueries = accountQueriesChunk as unknown as {
  i(): void;
  n(accountId: string): unknown;
};
const plans = subscriptionPlanChunk as unknown as {
  n(plan: string): unknown;
  r(): void;
};
const billingQueries = billingQueriesChunk as unknown as {
  n(): void;
  r(accountId: string): unknown;
};
const stripeClient = stripeClientChunk as unknown as {
  n(): void;
  r(accountId: string): unknown;
};
const billingState = billingStateChunk as unknown as {
  i(method: PaymentMethod): boolean;
};
const display = paymentMethodDisplayChunk as unknown as {
  n(): void;
  t(method: PaymentMethod): { label: unknown };
};
const confirmUpgrade = confirmUpgradeChunk as unknown as ConfirmRuntime;
const delinquent = delinquentUpgradeChunk as unknown as {
  n(): void;
  t(error: unknown): string | undefined;
};

async function getPricingPlanPaymentMethod(
  scope: UpgradeScope,
  accountId: string,
  paymentMethodId: string,
): Promise<PaymentMethod | undefined> {
  const result = await scope.queryClient.fetchQuery<PaymentMethodsResponse>(
    billingQueries.r(accountId),
  );
  return result.payment_methods.find(
    (method) =>
      method.id === paymentMethodId &&
      method.type === "card" &&
      !billingState.i(method),
  );
}

async function getPricingPlanDefaultPaymentMethod(
  scope: UpgradeScope,
  accountId: string,
): Promise<unknown | null> {
  const result = await scope.queryClient.fetchQuery<PaymentMethodsResponse>(
    billingQueries.r(accountId),
  );
  const method = result.payment_methods.find(
    (candidate) =>
      candidate.id === result.default_payment_method_id &&
      !billingState.i(candidate),
  );
  return method == null ? null : display.t(method).label;
}

async function confirmPricingPlanUpgrade(
  input: UpgradeInput,
): Promise<UpgradeResult> {
  const {
    scope,
    accountId,
    userId,
    initialPlan,
    updatedPlan,
    promoCampaign,
    promoCode,
    paymentMethodId,
    statsigClient,
    signal,
    isActive,
  } = input;
  if (!isActive()) return { status: "closed" };

  const [accounts, stripe] = await Promise.all([
    scope.queryClient.fetchQuery<AccountResponse>(accountQueries.n(accountId)),
    scope.queryClient.fetchQuery<StripeResponse>(stripeClient.r(accountId)),
  ]);
  if (!isActive()) return { status: "closed" };

  const account = accounts.accounts[accountId];
  if (
    account?.account.structure !== "personal" ||
    account.account.plan_type !== initialPlan ||
    account.account.account_id !== accountId ||
    account.account.account_user_id?.split("__")[0] !== userId
  )
    return { status: "closed" };

  if (
    paymentMethodId != null &&
    (await getPricingPlanPaymentMethod(scope, accountId, paymentMethodId)) ==
      null
  ) {
    return {
      status: "payment_method_failed",
      reason: "payment_method_unavailable",
      source: "update",
    };
  }
  if (!isActive()) return { status: "closed" };

  const currentPlan = initial.O0(initialPlan);
  const isUpgrade =
    currentPlan != null &&
    initial.D0({
      currentPlan: currentPlan.pricePlan,
      targetPlan: plans.n(updatedPlan),
    }) === "upgrade";
  const layer = isUpgrade ? statsigClient.getLayer("2797915223") : null;
  const recoveryEnabled =
    layer?.get("payment_method_recovery_enabled", false) ?? false;
  const recoveryTypes =
    layer?.get<string[]>("mandate_recovery_payment_method_types", []) ?? [];

  return confirmUpgrade.t(scope, {
    accountId,
    userId,
    updatedPlan,
    promoCampaign,
    promoCode,
    paymentMethodId,
    signal,
    stripe: stripe.stripe,
    willRenew: account.last_active_subscription.will_renew === true,
    mandateRecovery:
      recoveryEnabled &&
      Array.isArray(recoveryTypes) &&
      recoveryTypes.length > 0,
    isPaymentMethodRecoveryEnabled: recoveryEnabled,
    isActive,
    revalidatePaymentMethod: async () =>
      (paymentMethodId == null ||
        (await getPricingPlanPaymentMethod(
          scope,
          accountId,
          paymentMethodId,
        )) != null) &&
      isActive(),
    isPendingUpdateError: (error: unknown) =>
      delinquent.t(error) === "subscription_update_pending",
  });
}

accountQueries.i();
initial.j0();
plans.r();
display.n();
billingQueries.n();
stripeClient.n();
confirmUpgrade.n();
delinquent.n();

export {
  confirmPricingPlanUpgrade,
  getPricingPlanDefaultPaymentMethod,
  getPricingPlanPaymentMethod,
};
