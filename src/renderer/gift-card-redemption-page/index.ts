// gift-card-redemption-page — authenticated gift-card eligibility and redemption flow.

import * as accountIntegrityChunk from "@rchunk/account-action-integrity";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as assertNeverChunk from "@rchunk/assert-never";
import * as billingQueriesChunk from "@rchunk/billing-queries";
import * as billingQueryErrorChunk from "@rchunk/billing-query-error";
import * as eligibilityChunk from "@rchunk/eligibility";
import * as formatAmountChunk from "@rchunk/format-amount";
import * as accountQueriesChunk from "@rchunk/queries";
import "@rchunk/rolldown-runtime";

type RedemptionError =
  | "already_redeemed"
  | "attempt_limit"
  | "currency_ineligible"
  | "daily_limit"
  | "generic"
  | "serial_number_required"
  | "temporarily_unavailable";

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useRef<Value>(value: Value): { current: Value };
  useState<Value>(value: Value): [Value, (next: Value) => void];
}

interface QueryResult<Value> {
  data?: Value | null;
  isPending?: boolean;
  refetch(): Promise<unknown> | unknown;
}

interface GiftCardAccount {
  account: {
    account_user_role?: string | null;
    plan_type: string;
    structure: string;
  };
  can_access_with_session?: boolean;
}

interface RedemptionResult {
  amount: number;
  currency: string;
  status: "already_redeemed" | "redeemed";
}

interface AbortSignalLike {
  aborted: boolean;
  throwIfAborted(): void;
}

interface ApiClient {
  safePost<Response>(path: string, input: Record<string, unknown>): Promise<Response>;
}

interface ConfigurationClient {
  getLayer(key: string): { get<Value>(name: string, fallback: Value): Value };
}

interface AppSharedRuntime {
  $3(): void;
  BX<Value>(family: unknown, parameter: string): QueryResult<Value>;
  FX(): void;
  I3(): JsxRuntime;
  LX(scope: unknown): { queryClient: { invalidateQueries(input: { queryKey: unknown[] }): unknown } };
  ZI: unknown;
  e6(): ReactRuntime;
  n4(): { formatNumber(value: number, options: Intl.NumberFormatOptions): string };
}

interface AppInitialRuntime {
  N6t(): { accountId: string | null; isLoading?: boolean; userId: string | null };
  Ygn: unknown;
  cJt(): void;
  cfn(): { client: ConfigurationClient; isLoading?: boolean };
  jI(): (input: Record<string, unknown>) => void;
  o_n(): (destination: string) => void;
  ofn(gateId: string): boolean;
  rJt: ApiClient;
  Sdn: new (message: string, status?: number, errorCode?: string) => Error & { errorCode?: string };
}

interface EligibilityRuntime {
  a(): void;
  i(value?: string): RedemptionError;
  n(client: ConfigurationClient): { countryEligible: boolean; usOnly: boolean };
  o(value?: string): boolean;
  r(): void;
}

interface AccountQueriesRuntime {
  i(): void;
  t: unknown;
}

interface IntegrityRuntime {
  r(): void;
  t(action: string): Promise<Record<string, string>>;
}

interface BillingRuntime {
  i(context: { queryClient: { invalidateQueries(input: { queryKey: unknown[] }): unknown } }, accountId: string): Promise<void>;
  n(): void;
}

interface QueryErrorRuntime {
  n(): void;
  t(props: { onRetry(): void }): unknown;
}

interface AmountRuntime {
  n(): void;
  t(intl: { formatNumber(value: number, options: Intl.NumberFormatOptions): string }, amount: number, currency: string): string;
}

interface AssertNeverRuntime {
  n(): void;
  t(value: never): never;
}

const {
  $3: initializeCompilerRuntime,
  BX: useKeyedQuery,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: applicationScope,
  e6: getReactRuntime,
  n4: useIntl,
} = appSharedChunk as unknown as AppSharedRuntime;
const {
  N6t: useSessionIdentity,
  Sdn: ApiError,
  Ygn: Redirect,
  cJt: initializeApiClient,
  cfn: useConfigurationClient,
  jI: useOpenPricing,
  o_n: useNavigate,
  ofn: isGateEnabled,
  rJt: apiClient,
} = appInitialChunk as unknown as AppInitialRuntime;
const {
  a: initializeEligibilityMessages,
  i: normalizeRedemptionError,
  n: resolveLocationEligibility,
  o: isExpectedRedemptionError,
  r: initializeEligibility,
} = eligibilityChunk as unknown as EligibilityRuntime;
const { i: initializeAccountQueries, t: giftCardAccountQuery } =
  accountQueriesChunk as unknown as AccountQueriesRuntime;
const { r: initializeIntegrity, t: getIntegrityHeaders } =
  accountIntegrityChunk as unknown as IntegrityRuntime;
const { i: invalidateBillingQueries, n: initializeBillingQueries } =
  billingQueriesChunk as unknown as BillingRuntime;
const { n: initializeQueryError, t: BillingQueryError } =
  billingQueryErrorChunk as unknown as QueryErrorRuntime;
const { n: initializeAmountFormatter, t: formatAmount } =
  formatAmountChunk as unknown as AmountRuntime;
const { n: initializeAssertNever, t: assertNever } =
  assertNeverChunk as unknown as AssertNeverRuntime;

initializeCompilerRuntime();
initializeSignalRuntime();
initializeApiClient();
initializeAccountQueries();
initializeEligibilityMessages();
initializeEligibility();
initializeIntegrity();
initializeBillingQueries();
initializeQueryError();
initializeAmountFormatter();
initializeAssertNever();

const jsxRuntime = getJsxRuntime();
const reactRuntime = getReactRuntime();

const errorMessages: Record<RedemptionError, string> = {
  already_redeemed: "This gift card has already been redeemed",
  attempt_limit: "Too many redemption attempts. Try again later.",
  currency_ineligible: "This gift card cannot be redeemed for your account currency",
  daily_limit: "This gift card would exceed your daily redemption limit",
  generic: "This gift card is invalid or unavailable",
  serial_number_required: "Enter the card number printed on your gift card",
  temporarily_unavailable: "Gift card redemption is temporarily unavailable. Try again later.",
};

function PageFrame(props: Record<string, unknown>): unknown {
  return jsxRuntime.jsx("main", {
    ...props,
    "data-page": "gift-card-redemption",
  });
}

async function redeemGiftCard(
  body: { account_id: string; pin: string; serial_number?: string },
  signal: AbortSignalLike,
): Promise<RedemptionResult> {
  const headers = await getIntegrityHeaders("chatgpt_gift_card_redemption");
  signal.throwIfAborted();
  return apiClient.safePost<RedemptionResult>("/gift-cards/redeem", {
    additionalHeaders: headers,
    isExpectedError: (error: { errorCode?: string; status: number }) =>
      error.status >= 400 && error.status < 500 && isExpectedRedemptionError(error.errorCode),
    requestBody: body,
    signal,
  });
}

function errorFrom(reason: unknown): RedemptionError {
  return normalizeRedemptionError(
    reason instanceof ApiError && isExpectedRedemptionError(reason.errorCode)
      ? reason.errorCode
      : undefined,
  );
}

function Unavailable(props: { usOnly: boolean; workspaceNonOwner: boolean }): unknown {
  const heading = props.workspaceNonOwner
    ? "Gift card redemption is only available to workspace owners"
    : "Gift card redemption isn’t available in your location";
  const body = props.workspaceNonOwner
    ? "Switch accounts or ask a workspace owner to redeem this gift card."
    : props.usOnly
      ? "Gift cards can currently be redeemed only while you’re in the United States."
      : "Gift cards can currently be redeemed only while you’re in an eligible country.";
  return PageFrame({
    "data-state": "unavailable",
    children: jsxRuntime.jsxs("section", {
      children: [jsxRuntime.jsx("h1", { children: heading }), jsxRuntime.jsx("p", { children: body })],
    }),
  });
}

function RedemptionForm(props: {
  account: GiftCardAccount;
  accountId: string;
  serialNumberRequired: boolean;
}): unknown {
  const scope = useScope(applicationScope);
  const intl = useIntl();
  const navigate = useNavigate();
  const openPricing = useOpenPricing();
  const [pin, setPin] = reactRuntime.useState("");
  const [serialNumber, setSerialNumber] = reactRuntime.useState("");
  const [serverRequiresSerial, setServerRequiresSerial] = reactRuntime.useState(false);
  const [state, setState] = reactRuntime.useState<
    | { phase: "failed"; error: RedemptionError }
    | { phase: "idle" }
    | { phase: "redeemed"; result: RedemptionResult }
    | { phase: "submitting" }
  >({ phase: "idle" });
  const activeRequest = reactRuntime.useRef<AbortController | null>(null);
  reactRuntime.useEffect(() => () => activeRequest.current?.abort(), []);

  const requiresSerial = props.serialNumberRequired || serverRequiresSerial;
  const submitting = state.phase === "submitting";
  const canSubmit = pin.length === 16 && (!requiresSerial || serialNumber.length === 20) && !submitting;

  async function submit(): Promise<void> {
    if (!canSubmit || activeRequest.current != null) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setState({ phase: "submitting" });
    try {
      const result = await redeemGiftCard({
        account_id: props.accountId,
        pin,
        ...(requiresSerial ? { serial_number: serialNumber } : {}),
      }, controller.signal);
      if (controller.signal.aborted) return;
      if (result.status === "redeemed") {
        setPin("");
        setSerialNumber("");
        setState({ phase: "redeemed", result });
        await invalidateBillingQueries(scope, props.accountId);
      } else if (result.status === "already_redeemed") {
        setState({ phase: "failed", error: "already_redeemed" });
      } else {
        assertNever(result.status);
      }
    } catch (reason) {
      if (controller.signal.aborted) return;
      const error = errorFrom(reason);
      if (error === "serial_number_required") setServerRequiresSerial(true);
      setState({ phase: "failed", error });
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }

  if (state.phase === "redeemed") {
    const amount = formatAmount(intl, state.result.amount, state.result.currency);
    const canUpgrade = props.account.account.structure !== "workspace"
      && props.account.account.plan_type !== "pro";
    return PageFrame({
      "data-state": "redeemed",
      children: jsxRuntime.jsxs("section", {
        children: [
          jsxRuntime.jsx("h1", { children: "Added " + amount + " to your Wallet" }),
          canUpgrade
            ? jsxRuntime.jsxs(jsxRuntime.Fragment, {
                children: [
                  jsxRuntime.jsx("button", {
                    "data-action": "upgrade",
                    onClick: (event: unknown) => openPricing({
                      currentPlan: props.account.account.plan_type,
                      event,
                      scope,
                      source: "gift_card_redemption",
                    }),
                    children: "Upgrade plan",
                  }),
                  jsxRuntime.jsx("button", {
                    "data-action": "continue",
                    onClick: () => navigate("/"),
                    children: "Continue to ChatGPT",
                  }),
                ],
              })
            : jsxRuntime.jsx("button", {
                "data-action": "continue",
                onClick: () => navigate("/"),
                children: "Continue to ChatGPT",
              }),
        ],
      }),
    });
  }

  const error = state.phase === "failed" ? state.error : null;
  return PageFrame({
    "data-state": submitting ? "submitting" : pin.length > 0 || serialNumber.length > 0 ? "editing" : "idle",
    children: jsxRuntime.jsxs("section", {
      children: [
        jsxRuntime.jsx("h1", { children: "Redeem your gift" }),
        error == null ? null : jsxRuntime.jsx("div", {
          "data-error": error,
          role: "alert",
          children: errorMessages[error],
        }),
        jsxRuntime.jsxs("form", {
          "data-view": "redemption-form",
          onSubmit: (event: { preventDefault(): void }) => {
            event.preventDefault();
            void submit();
          },
          children: [
            jsxRuntime.jsx("input", {
              "aria-label": "PIN",
              disabled: submitting,
              maxLength: 16,
              onChange: (event: { target: { value: string } }) => {
                setPin(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                setState({ phase: "idle" });
              },
              value: pin,
            }),
            requiresSerial ? jsxRuntime.jsx("input", {
              "aria-label": "Card number",
              disabled: submitting,
              inputMode: "numeric",
              maxLength: 20,
              onChange: (event: { target: { value: string } }) => {
                setSerialNumber(event.target.value.replace(/\D/g, ""));
                setState({ phase: "idle" });
              },
              value: serialNumber,
            }) : null,
            jsxRuntime.jsx("button", {
              disabled: !canSubmit,
              type: "submit",
              children: submitting ? "Redeeming…" : "Redeem",
            }),
          ],
        }),
      ],
    }),
  });
}

function GiftCardAccountGate(props: { accountId: string }): unknown {
  const accountQuery = useKeyedQuery<GiftCardAccount>(giftCardAccountQuery, props.accountId);
  const configuration = useConfigurationClient();
  if (accountQuery.isPending || configuration.isLoading) {
    return PageFrame({ "data-state": "loading", children: "Loading" });
  }
  if (accountQuery.data == null || accountQuery.data.can_access_with_session === false) {
    return PageFrame({
      "data-state": "error",
      children: jsxRuntime.jsx(BillingQueryError, { onRetry: () => void accountQuery.refetch() }),
    });
  }

  const location = resolveLocationEligibility(configuration.client);
  const workspaceNonOwner = accountQuery.data.account.structure === "workspace"
    && accountQuery.data.account.account_user_role !== "account-owner";
  if (workspaceNonOwner || !location.countryEligible) {
    return Unavailable({
      usOnly: location.usOnly,
      workspaceNonOwner: workspaceNonOwner && location.countryEligible,
    });
  }

  const serialNumberRequired = configuration.client
    .getLayer("225453312")
    .get("serial_number_required", false);
  return jsxRuntime.jsx(RedemptionForm, {
    account: accountQuery.data,
    accountId: props.accountId,
    serialNumberRequired,
  });
}

function GiftCardRedemptionPage(): unknown {
  const identity = useSessionIdentity();
  if (identity.isLoading) return PageFrame({ "data-state": "loading", children: "Loading" });
  if (!isGateEnabled("200883286")) {
    return jsxRuntime.jsx(Redirect, { replace: true, to: "/" });
  }
  if (identity.accountId == null || identity.userId == null) {
    return PageFrame({
      "data-state": "error",
      children: jsxRuntime.jsx(BillingQueryError, { onRetry: () => undefined }),
    });
  }
  return jsxRuntime.jsx(GiftCardAccountGate, { accountId: identity.accountId });
}

export { GiftCardRedemptionPage };
