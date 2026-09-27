// confirm-subscription-upgrade —— 套餐更新、支付确认与失败补偿状态机。
// 原版：app/webview/assets/confirm-subscription-upgrade-f595e87039bb.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as stripeConfirmationChunk from "@rchunk/stripe-payment-confirmation";

void runtimeChunk;

const { vW: expectedAccountIdHeader, wL: initializeAppSharedRuntime } =
  appSharedChunk;
const {
  NF: updateSubscription,
  Sdn: ApiResponseError,
  Sun: initializeSubscriptionState,
  _un: currentUserIdSignal,
  cJt: initializeApiClient,
  jF: clearPendingSubscriptionUpdate,
  kF: initializePendingSubscriptionUpdate,
  mun: currentAccountIdSignal,
  rJt: subscriptionApiClient,
  wdn: initializeSubscriptionUpdate,
} = appInitialChunk;
const {
  a: getStripeErrorReason,
  n: getPaymentIntentFailureReason,
  o: initializeStripeIntentHelpers,
  r: initializeStripeErrorHelpers,
  t: confirmStripePaymentWithRetry,
} = stripeConfirmationChunk;

const UPI_NEXT_ACTION = "upi_handle_redirect_or_display_qr_code";
const PIX_NEXT_ACTION = "pix_display_qr_code";

type UpgradeResult =
  | { status: "complete" | "pending" | "closed" | "unknown" }
  | { status: "setup_required"; setupIntentClientSecret: string }
  | {
      status: "payment_method_failed";
      reason: string;
      detail?: string | null;
      source: "update" | "confirmation";
    }
  | { status: "request_failed"; error: Error };

type SubscriptionPlan = import("@rchunk/app-initial").SubscriptionPlan;
type SubscriptionUpdateResult =
  import("@rchunk/app-initial").SubscriptionUpdateResult;
type StripeConfirmationResult =
  import("@rchunk/stripe-payment-confirmation").StripeConfirmationResult;

interface StripeClient {
  confirmCardPayment(clientSecret: string): Promise<StripeConfirmationResult>;
  confirmPayment(input: {
    clientSecret: string;
    confirmParams: { return_url: string };
    redirect: "if_required";
  }): Promise<StripeConfirmationResult>;
  confirmPixPayment(clientSecret: string): Promise<StripeConfirmationResult>;
  confirmSetup(input: {
    clientSecret: string;
    confirmParams: { return_url: string };
    redirect: "if_required";
  }): Promise<import("@rchunk/stripe-payment-confirmation").StripeSetupResult>;
}

interface UpgradeScope {
  get(
    signal: import("@rchunk/app-shared").ReadableSignal<string | null>,
  ): string | null;
}

interface ConfirmUpgradeOptions {
  accountId: string;
  updatedPlan: SubscriptionPlan;
  userId: string;
  isActive(): boolean;
  signal?: AbortSignal;
  stripe: StripeClient;
  willRenew: boolean;
  promoCode?: string | null;
  promoCampaign?: string | null;
  paymentMethodId?: string | null;
  isPaymentMethodRecoveryEnabled?: boolean;
  mandateRecovery?: boolean;
  onSubmit?(): void;
  revalidatePaymentMethod(): Promise<boolean>;
  isPendingUpdateError(error: unknown): boolean;
}

function confirmPaymentIntent(
  stripe: StripeClient,
  clientSecret: string,
  nextActionType: string | null,
  recoveryEnabled: boolean,
): Promise<StripeConfirmationResult> {
  if (recoveryEnabled && nextActionType === PIX_NEXT_ACTION) {
    return stripe.confirmPixPayment(clientSecret);
  }
  if (recoveryEnabled && nextActionType === UPI_NEXT_ACTION) {
    return stripe.confirmPayment({
      clientSecret,
      redirect: "if_required",
      confirmParams: { return_url: window.location.href },
    });
  }
  return stripe.confirmCardPayment(clientSecret);
}

interface ConfirmRequiredActionOptions {
  cleanupPendingSubscriptionUpdate(
    paymentIntentId: string | undefined,
    invoiceId: string | undefined,
  ): void;
  isOpen(): boolean;
  isPaymentMethodRecoveryEnabled: boolean;
  isStripeClientBootstrapError: boolean;
  stripePromise: Promise<StripeClient> | null;
  updateResult: SubscriptionUpdateResult;
}

async function confirmRequiredAction({
  updateResult,
  stripePromise,
  isStripeClientBootstrapError,
  isPaymentMethodRecoveryEnabled,
  isOpen,
  cleanupPendingSubscriptionUpdate,
}: ConfirmRequiredActionOptions): Promise<UpgradeResult> {
  if (updateResult.status !== "requires_action") return { status: "complete" };
  const paymentFailed = (reason: string): UpgradeResult => {
    cleanupPendingSubscriptionUpdate(
      updateResult.payment_intent.id,
      updateResult.pending_update_invoice_id,
    );
    return { status: "payment_method_failed", reason, source: "confirmation" };
  };
  try {
    const clientSecret = updateResult.payment_intent?.client_secret;
    const nextActionType =
      updateResult.payment_intent != null &&
      "next_action_type" in updateResult.payment_intent &&
      typeof updateResult.payment_intent.next_action_type === "string"
        ? updateResult.payment_intent.next_action_type
        : null;
    if (
      isStripeClientBootstrapError ||
      stripePromise == null ||
      clientSecret == null
    ) {
      throw new Error(
        "Payment confirmation is still loading. Please try again.",
      );
    }
    const stripe = await stripePromise;
    if (stripe == null) {
      throw new Error(
        "Payment confirmation is still loading. Please try again.",
      );
    }
    if (!isOpen()) {
      cleanupPendingSubscriptionUpdate(
        updateResult.payment_intent.id,
        updateResult.pending_update_invoice_id,
      );
      return { status: "closed" };
    }
    const confirmation = await confirmStripePaymentWithRetry({
      confirmPaymentIntent: () =>
        confirmPaymentIntent(
          stripe,
          clientSecret,
          nextActionType,
          isPaymentMethodRecoveryEnabled,
        ),
      shouldRetry: isOpen,
    });
    if (!isOpen()) {
      cleanupPendingSubscriptionUpdate(
        updateResult.payment_intent.id,
        updateResult.pending_update_invoice_id,
      );
      return { status: "closed" };
    }
    if (confirmation.error) {
      if (confirmation.error.code === "lock_timeout") {
        throw new Error(confirmation.error.message);
      }
      if (isPaymentMethodRecoveryEnabled) {
        return paymentFailed(getStripeErrorReason(confirmation.error));
      }
      throw new Error(confirmation.error.message);
    }
    const paymentIntent =
      "paymentIntent" in confirmation ? confirmation.paymentIntent : null;
    if (
      paymentIntent?.status === "processing" ||
      (isPaymentMethodRecoveryEnabled &&
        paymentIntent?.status === "requires_action" &&
        nextActionType === PIX_NEXT_ACTION)
    ) {
      return { status: "pending" };
    }
    if (paymentIntent != null) {
      const reason = getPaymentIntentFailureReason(paymentIntent);
      if (
        reason != null &&
        (paymentIntent.status === "requires_payment_method" ||
          isPaymentMethodRecoveryEnabled)
      ) {
        return paymentFailed(reason);
      }
    }
    if (isPaymentMethodRecoveryEnabled) {
      if (paymentIntent?.status === "requires_action") {
        return paymentFailed("authentication_failed");
      }
      if (paymentIntent?.status !== "succeeded") return paymentFailed("other");
    }
  } catch (error) {
    cleanupPendingSubscriptionUpdate(
      updateResult.payment_intent.id,
      updateResult.pending_update_invoice_id,
    );
    throw error;
  }
  return { status: "complete" };
}

async function classifyUpdateResult(
  input: ConfirmRequiredActionOptions,
): Promise<UpgradeResult> {
  const updateResult = input.updateResult;
  if (updateResult.status === "pending") return { status: "pending" };
  if (updateResult.status === "payment_method_failed") {
    input.cleanupPendingSubscriptionUpdate(
      updateResult.pending_update_payment_intent_id,
      updateResult.pending_update_invoice_id,
    );
    return {
      status: "payment_method_failed",
      reason: updateResult.payment_method_failure_reason ?? "other",
      detail: updateResult.payment_method_failure_detail ?? null,
      source: "update",
    };
  }
  if (updateResult.status === "setup_required") {
    return {
      status: "setup_required",
      setupIntentClientSecret: updateResult.setup_intent_client_secret,
    };
  }
  const result = await confirmRequiredAction(input);
  return result.status === "payment_method_failed"
    ? { ...result, source: "confirmation" }
    : result;
}

async function confirmSubscriptionUpgrade(
  scope: UpgradeScope,
  options: ConfirmUpgradeOptions,
): Promise<UpgradeResult> {
  const { accountId, updatedPlan, userId } = options;
  let renewedSubscription = false;
  let submitted = false;
  let updateReturned = false;
  let setupIntentId: string | undefined;
  let cleanupError: Error | undefined;
  const cancelCompensatingRenewal = async () => {
    if (
      renewedSubscription &&
      scope.get(currentAccountIdSignal) === accountId &&
      scope.get(currentUserIdSignal) === userId
    ) {
      renewedSubscription = false;
      await subscriptionApiClient.safePost("/subscriptions/cancel", {
        requestBody: { account_id: accountId },
        additionalHeaders: { [expectedAccountIdHeader]: accountId },
      });
    }
  };

  try {
    for (;;) {
      submitted = false;
      updateReturned = false;
      if (!options.isActive()) return { status: "closed" };
      if (!options.willRenew && !options.promoCode) {
        await subscriptionApiClient.safePost("/subscriptions/renew", {
          requestBody: { account_id: accountId },
          signal: options.signal,
          additionalHeaders: { [expectedAccountIdHeader]: accountId },
        });
        renewedSubscription = true;
        if (!options.isActive()) return { status: "closed" };
        if (!(await options.revalidatePaymentMethod())) {
          await cancelCompensatingRenewal();
          return {
            status: "payment_method_failed",
            reason: "payment_method_unavailable",
            source: "update",
          };
        }
      }

      options.onSubmit?.();
      submitted = true;
      const updateResult = await updateSubscription({
        accountId,
        updatedPlan,
        promoCampaign: options.promoCampaign,
        promoCode: options.promoCode,
        paymentMethodId:
          setupIntentId == null ? options.paymentMethodId : undefined,
        setupIntentId,
        signal: options.signal,
        expectedAccountId: accountId,
      });
      updateReturned = true;
      let cleanupPromise: Promise<void> | undefined;
      const result = await classifyUpdateResult({
        updateResult,
        stripePromise: Promise.resolve(options.stripe),
        isStripeClientBootstrapError: false,
        isPaymentMethodRecoveryEnabled:
          options.isPaymentMethodRecoveryEnabled === true,
        isOpen: options.isActive,
        cleanupPendingSubscriptionUpdate: (
          paymentIntentId: string | undefined,
          invoiceId: string | undefined,
        ) => {
          if (
            scope.get(currentAccountIdSignal) === accountId &&
            scope.get(currentUserIdSignal) === userId
          ) {
            cleanupPromise = clearPendingSubscriptionUpdate({
              accountId,
              expectedPaymentIntentId: paymentIntentId,
              pendingUpdateInvoiceId: invoiceId,
              expectedAccountId: accountId,
            }).then(
              () => undefined,
              (error: unknown) => {
                cleanupError =
                  error instanceof Error
                    ? error
                    : new Error("Unable to clear pending subscription update", {
                        cause: error,
                      });
              },
            );
          }
        },
      }).finally(() => cleanupPromise);
      if (!options.isActive()) return { status: "closed" };
      if (cleanupError != null) throw cleanupError;
      if (result.status === "setup_required") {
        await cancelCompensatingRenewal();
        if (!options.isActive()) return { status: "closed" };
        if (!options.mandateRecovery || setupIntentId != null) {
          return {
            status: "payment_method_failed",
            reason: "other",
            source: "update",
          };
        }
        const confirmation = await options.stripe.confirmSetup({
          clientSecret: result.setupIntentClientSecret,
          redirect: "if_required",
          confirmParams: { return_url: window.location.href },
        });
        if (!options.isActive()) return { status: "closed" };
        if (confirmation.error) {
          return {
            status: "payment_method_failed",
            reason: getStripeErrorReason(confirmation.error),
            source: "confirmation",
          };
        }
        if (confirmation.setupIntent?.status !== "succeeded") {
          return {
            status: "payment_method_failed",
            reason: "authentication_failed",
            source: "confirmation",
          };
        }
        setupIntentId = confirmation.setupIntent.id;
        continue;
      }
      if (result.status === "payment_method_failed") {
        await cancelCompensatingRenewal();
      }
      return result;
    }
  } catch (error) {
    if (!options.isActive()) return { status: "closed" };
    if (cleanupError != null) return { status: "unknown" };
    const isClientHttpError =
      error instanceof ApiResponseError &&
      error.status >= 400 &&
      error.status < 500 &&
      error.status !== 408;
    if (
      submitted &&
      !updateReturned &&
      (options.isPendingUpdateError(error) || !isClientHttpError)
    ) {
      return { status: "unknown" };
    }
    await cancelCompensatingRenewal().catch(() => undefined);
    return {
      status: "request_failed",
      error:
        error instanceof Error
          ? error
          : new Error("Unable to confirm subscription update", {
              cause: error,
            }),
    };
  } finally {
    if (!submitted) await cancelCompensatingRenewal().catch(() => undefined);
  }
}

function initializePaymentActionConstants(): void {
  initializeStripeErrorHelpers();
  initializeStripeIntentHelpers();
}

function initializeConfirmSubscriptionUpgrade(): void {
  initializePaymentActionConstants();
  initializeAppSharedRuntime();
  initializeSubscriptionState();
  initializeApiClient();
  initializePendingSubscriptionUpdate();
  initializeSubscriptionUpdate();
}

export {
  initializeConfirmSubscriptionUpgrade as n,
  initializePaymentActionConstants as r,
  confirmSubscriptionUpgrade as t,
};
