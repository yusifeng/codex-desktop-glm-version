import "@rchunk/rolldown-runtime";

export type StripeFailureReason =
  | "authentication_failed"
  | "expired_card"
  | "incorrect_cvc"
  | "incorrect_number"
  | "insufficient_funds"
  | "invalid_cvc"
  | "missing_payment_method"
  | "other"
  | "payment_method_declined"
  | "payment_method_unavailable";

export interface StripeError {
  code?: string | null;
  decline_code?: string | null;
}

export interface StripePaymentIntent {
  last_payment_error?: StripeError | null;
  status: string;
}

export interface StripeConfirmationResult {
  error?: StripeError;
  paymentIntent?: StripePaymentIntent;
}

const LOCK_TIMEOUT = "lock_timeout";
const knownFailureReasons = new Set<StripeFailureReason>([
  "insufficient_funds",
  "expired_card",
  "incorrect_number",
  "incorrect_cvc",
  "invalid_cvc",
  "missing_payment_method",
  "authentication_failed",
  "payment_method_unavailable",
  "payment_method_declined",
  "other",
]);
const authenticationErrors = new Set([
  "authentication_required",
  "payment_intent_authentication_failure",
  "setup_intent_authentication_failure",
]);
const declinedErrorCodes = new Set([
  "card_declined",
  "payment_intent_payment_attempt_failed",
]);
const declinedCardCodes = new Set([
  "approve_with_id",
  "do_not_honor",
  "generic_decline",
  "lost_card",
  "pickup_card",
  "restricted_card",
  "revocation_of_all_authorizations",
  "revocation_of_authorization",
  "stolen_card",
]);

function classifyStripeError(error: StripeError): StripeFailureReason {
  for (const value of [error.decline_code, error.code]) {
    if (value != null && knownFailureReasons.has(value as StripeFailureReason)) {
      return value as StripeFailureReason;
    }
  }
  if (
    authenticationErrors.has(error.decline_code ?? "") ||
    authenticationErrors.has(error.code ?? "")
  ) {
    return "authentication_failed";
  }
  if (
    declinedCardCodes.has(error.decline_code ?? "") ||
    declinedErrorCodes.has(error.code ?? "")
  ) {
    return "payment_method_declined";
  }
  return "other";
}

function paymentIntentFailure(
  intent: StripePaymentIntent,
): StripeFailureReason | null {
  if (intent.status === "requires_payment_method") {
    return classifyStripeError(intent.last_payment_error ?? {});
  }
  return intent.status === "requires_action" ? "authentication_failed" : null;
}

function wait(duration: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

async function confirmPaymentWithRetry<
  Result extends StripeConfirmationResult,
>({
  confirmPaymentIntent,
  shouldRetry,
}: {
  confirmPaymentIntent: () => Promise<Result>;
  shouldRetry: () => boolean;
}): Promise<Result> {
  let result = await confirmPaymentIntent();
  for (const delay of [100, 250]) {
    if (result.error?.code !== LOCK_TIMEOUT || !shouldRetry()) return result;
    await wait(delay);
    if (!shouldRetry()) return result;
    result = await confirmPaymentIntent();
  }
  return result;
}

function initializeStripeErrors(): void {}
function initializeStripeConfirmation(): void {
  initializeStripeErrors();
}

export {
  classifyStripeError as a,
  LOCK_TIMEOUT as i,
  paymentIntentFailure as n,
  initializeStripeErrors as o,
  initializeStripeConfirmation as r,
  confirmPaymentWithRetry as t,
};
