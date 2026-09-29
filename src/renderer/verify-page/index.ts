import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as checkoutPolicyChunk from "@rchunk/checkout-policy";
// @ts-expect-error Published checkout error chunk has no standalone declaration yet.
import * as errorChunk from "@rchunk/error";
// @ts-expect-error Published Stripe loader chunk has no standalone declaration yet.
import * as stripeLoaderChunk from "@rchunk/pure";
// @ts-expect-error Published integrity chunk has no standalone declaration yet.
import * as integrityChunk from "@rchunk/chatgpt-account-action-integrity";
// @ts-expect-error Published checkout session chunk has no standalone declaration yet.
import * as sessionChunk from "@rchunk/session";

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}
interface ParsedRoute {
  checkoutSessionId: string;
  processorEntity: string;
}
interface ParseResult {
  data?: ParsedRoute;
  success: boolean;
}
interface AccountState {
  accountId?: string | null;
}
interface CheckoutSession {
  checkout_kind?: string;
  confirm_return_url?: string | null;
  credit_payment_state?: string | null;
  publishable_key?: string;
  processor_entity?: string;
  checkout_session_id?: string;
  status?: "complete" | "expired" | "open" | string;
  tag?: string;
}
interface ContinuationResult {
  accountId: string;
  failed: boolean;
  response: Record<string, unknown> | null;
}
interface QueryResult<Value> {
  data?: Value;
  error?: unknown;
  isFetching?: boolean;
  isPending?: boolean;
  refetch(): Promise<unknown> | unknown;
}
interface ApiClient {
  safeGet(
    path: string,
    options: Record<string, unknown>,
  ): Promise<CheckoutSession>;
  safePost(
    path: string,
    options: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}
interface RouteSchema {
  safeParse(value: {
    checkoutSessionId: string | null;
    processorEntity: string | null;
  }): ParseResult;
}
interface ErrorViewProps {
  error?: unknown;
  kind: "payment";
  loading?: boolean;
  onRetry(): void;
}
interface WrapperProps {
  children: unknown;
  returnPath?: string;
}

const sharedRuntime = appSharedChunk as unknown as {
  $3?(): void;
  I3(): JsxRuntime;
  K2?(): void;
  Mh?: (props: { children?: unknown }) => unknown;
  Ph?(): void;
  Y2?: (props: Record<string, unknown>) => unknown;
  Yh?: (props: Record<string, unknown>) => unknown;
  Zh?(): void;
  _L?<Value>(options: Record<string, unknown>): QueryResult<Value>;
  gL?(): void;
};
const initialRuntime = appInitialChunk as unknown as {
  M6t?(): void;
  N6t?(): AccountState;
  Qgn?(): void;
  Ygn?: (props: { replace?: boolean; to: string }) => unknown;
  _0?(): string;
  _T?: (props: Record<string, unknown>) => unknown;
  cJt?(): void;
  d_n?(): [URLSearchParams];
  o_n?(): (destination: string, options?: { replace?: boolean }) => void;
  rJt?: ApiClient;
  r_n?(path: string): string;
  v0?(): void;
  vT?(): void;
};
const primaryRuntime = appPrimaryChunk as unknown as {
  ch?(
    params: URLSearchParams,
    source: URLSearchParams,
    baseUrl: URL,
  ): URLSearchParams;
  ih?(params: URLSearchParams, url: URL): string | null;
  sh?(): void;
};
const policyRuntime = checkoutPolicyChunk as unknown as {
  A?(input: URLSearchParams, output: URLSearchParams): URLSearchParams;
  S?(): void;
  f?(value: string | null): string;
  k?(): void;
  l?(
    checkout: Record<string, unknown>,
    query: URLSearchParams,
    successPath?: string,
  ): string | null;
  n?: { StandaloneCredit: string };
};
const errorRuntime = errorChunk as unknown as {
  a?: (props: ErrorViewProps) => unknown;
  o?(): void;
};
const stripeRuntime = stripeLoaderChunk as unknown as {
  r?(publishableKey: string): Promise<{
    confirmPayment(
      options: Record<string, unknown>,
    ): Promise<{ error?: unknown }>;
  } | null>;
  t?(): void;
};
const integrityRuntime = integrityChunk as unknown as {
  n?(action: string): Promise<Record<string, string>>;
  r?(): void;
};
const sessionRuntime = sessionChunk as unknown as {
  d?(): void;
  i?(accountId: string, route: ParsedRoute): Record<string, unknown>;
  o?(): void;
  r?: RouteSchema;
  u?: (props: WrapperProps) => unknown;
};
const {
  $3: initializeSharedRuntime,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  Mh: Page,
  Ph: initializePage,
  Y2: Message,
  Yh: Button,
  Zh: initializeSharedMessages,
  _L: useQuery,
  gL: initializeQueryRuntime,
} = sharedRuntime;
const {
  M6t: initializeAccountState,
  N6t: useAccountState,
  Qgn: initializeQueries,
  Ygn: Navigate,
  _0: fallbackPath,
  _T: LoadingPage,
  cJt: initializeNavigation,
  d_n: useSearchParams,
  o_n: useNavigate,
  rJt: api,
  r_n: resolvePath,
  v0: initializeRoutes,
  vT: initializeCheckoutState,
} = initialRuntime;
const {
  ch: mergeReturnParams,
  ih: beaconReturnPath,
  sh: initializePrimaryPayments,
} = primaryRuntime;
const {
  A: copyCheckoutSource,
  S: initializeCheckoutPolicy,
  f: paymentState,
  k: initializeCheckoutKinds,
  l: teamSuccessPath,
  n: CheckoutKind,
} = policyRuntime;
const { a: ErrorView, o: initializeErrorView } = errorRuntime;
const { r: loadStripe, t: initializeStripeLoader } = stripeRuntime;
const { n: getIntegrityHeaders, r: initializeIntegrity } = integrityRuntime;
const {
  d: initializeSessionState,
  i: sessionQueryOptions,
  o: initializeSessionUi,
  r: routeSchema,
  u: CheckoutSessionWrapper,
} = sessionRuntime;

initializeSharedRuntime?.();
initializeCheckoutPolicy?.();
initializeCheckoutKinds?.();
initializeStripeLoader?.();
initializeQueryRuntime?.();
initializeSharedUi?.();
initializeQueries?.();
initializeAccountState?.();
initializeIntegrity?.();
initializeNavigation?.();
initializeSharedMessages?.();
initializePage?.();
initializePrimaryPayments?.();
initializeRoutes?.();
initializeCheckoutState?.();
initializeErrorView?.();
initializeSessionUi?.();
initializeSessionState?.();

const jsx = getJsxRuntime();

function parseRoute(params: URLSearchParams): ParseResult {
  const input = {
    processorEntity: params.get("processor_entity"),
    checkoutSessionId: params.get("stripe_session_id"),
  };
  if (routeSchema != null) return routeSchema.safeParse(input);
  return input.processorEntity && input.checkoutSessionId
    ? {
        success: true,
        data: {
          processorEntity: input.processorEntity,
          checkoutSessionId: input.checkoutSessionId,
        },
      }
    : { success: false };
}
function navigate(to: string): unknown {
  return Navigate == null
    ? jsx.jsx("a", { href: to, children: "Continue" })
    : jsx.jsx(Navigate, { to, replace: true });
}
function loading(): unknown {
  return LoadingPage == null
    ? jsx.jsx("main", { role: "status", children: "Verifying payment…" })
    : jsx.jsx(LoadingPage, {});
}
function errorView(
  error: unknown,
  loadingState: boolean,
  retry: () => void,
): unknown {
  return ErrorView == null
    ? jsx.jsxs("section", {
        role: "alert",
        children: [
          jsx.jsx("p", {
            children:
              error instanceof Error
                ? error.message
                : "Payment verification failed",
          }),
          jsx.jsx("button", {
            type: "button",
            disabled: loadingState,
            onClick: retry,
            children: loadingState ? "Retrying…" : "Retry",
          }),
        ],
      })
    : jsx.jsx(ErrorView, {
        kind: "payment",
        loading: loadingState,
        error,
        onRetry: retry,
      });
}
function emptyQuery<Value>(): QueryResult<Value> {
  return { refetch: () => undefined };
}
function waitForPoll(resolve: () => void): number {
  return window.setTimeout(resolve, 500);
}

async function confirmConditionalOffer(
  route: ParsedRoute,
  signal: AbortSignal,
): Promise<void> {
  if (api == null) throw new Error("Payment service unavailable");
  const checkout = await api.safeGet(
    "/payments/checkout/{processor_entity}/{checkout_session_id}",
    {
      parameters: {
        path: {
          processor_entity: route.processorEntity,
          checkout_session_id: route.checkoutSessionId,
        },
      },
      signal,
    },
  );
  if (
    checkout.tag === "custom_checkout_session" &&
    checkout.status === "complete"
  )
    return;
  const stripe = await loadStripe?.(checkout.publishable_key ?? "");
  if (stripe == null) throw new Error("Stripe failed to load");
  const headers =
    (await getIntegrityHeaders?.("checkout_session_approval")) ?? {};
  signal.throwIfAborted();
  const response = await api.safePost("/payments/checkout/confirm", {
    additionalHeaders: headers,
    requestBody: { checkout_session_id: route.checkoutSessionId },
    signal,
  });
  if (
    response.status !== "success" ||
    response.type !== "payment_intent" ||
    response.conditional_offer_preflight !== true ||
    typeof response.client_secret !== "string"
  )
    throw new Error("Conditional offer did not return a payment intent");
  signal.throwIfAborted();
  const result = await stripe.confirmPayment({
    clientSecret: response.client_secret,
    redirect: "if_required",
  });
  if (result.error != null)
    throw new Error("Conditional offer payment confirmation failed");
}

function VerificationContent({
  accountId,
  appBaseUrl,
  beaconPath,
  params,
  route,
}: {
  accountId: string;
  appBaseUrl: URL;
  beaconPath: string | null;
  params: URLSearchParams;
  route: ParsedRoute;
}): unknown {
  const navigateTo = useNavigate?.() ?? (() => undefined);
  const redirectResult = params.get("redirectResult");
  const conditionalOffer = params.get("conditional_offer_preflight") === "true";
  const walletCovered = params.get("wallet_covered") === "true";
  const continuationRequested = redirectResult != null || conditionalOffer;
  const continuation =
    useQuery?.<ContinuationResult>({
      queryKey: [
        "checkout-payment-continuation",
        route.processorEntity,
        route.checkoutSessionId,
        redirectResult,
        conditionalOffer,
      ],
      enabled: continuationRequested,
      retry: false,
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        if (conditionalOffer) {
          try {
            await confirmConditionalOffer(route, signal);
            return {
              accountId,
              response: { status: "pending" },
              failed: false,
            };
          } catch {
            return { accountId, response: null, failed: true };
          }
        }
        if (redirectResult == null || api == null)
          throw new Error("Invalid payment return");
        try {
          const response = await api.safePost(
            "/payments/checkout/custom_payment_method/continue",
            {
              requestBody: {
                checkout_session_id: route.checkoutSessionId,
                action_result: { redirectResult },
              },
              signal,
            },
          );
          return { accountId, response, failed: false };
        } catch {
          return { accountId, response: null, failed: true };
        }
      },
    }) ?? emptyQuery<ContinuationResult>();
  const accountMismatch =
    continuation.data != null && continuation.data.accountId !== accountId;
  const continuationAccepted =
    continuation.data?.response?.status === "pending" ||
    continuation.data?.response?.status === "success";
  const pendingFromReturn =
    (redirectResult != null && continuationAccepted) ||
    params.get("pending") === "true";
  const verificationEnabled =
    !walletCovered &&
    !accountMismatch &&
    (!continuationRequested || continuationAccepted);
  const baseOptions = sessionQueryOptions?.(accountId, route) ?? {
    queryKey: [
      "checkout-session",
      accountId,
      route.processorEntity,
      route.checkoutSessionId,
    ],
  };
  const verification =
    useQuery?.<CheckoutSession>({
      ...baseOptions,
      queryKey: [
        ...((baseOptions.queryKey as unknown[] | undefined) ?? []),
        "verification",
      ],
      enabled: verificationEnabled,
      staleTime: 0,
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        if (api == null) throw new Error("Payment service unavailable");
        for (let attempt = 0; ; attempt += 1) {
          signal.throwIfAborted();
          const checkout = await api.safeGet(
            "/payments/checkout/{processor_entity}/{checkout_session_id}",
            {
              parameters: {
                path: {
                  processor_entity: route.processorEntity,
                  checkout_session_id: route.checkoutSessionId,
                },
              },
              signal,
            },
          );
          const creditState =
            checkout.credit_payment_state == null
              ? null
              : (paymentState?.(checkout.credit_payment_state) ??
                checkout.credit_payment_state);
          if (
            checkout.tag !== "custom_checkout_session" ||
            checkout.status !== "open" ||
            pendingFromReturn ||
            (checkout.checkout_kind === CheckoutKind?.StandaloneCredit &&
              creditState !== "succeeded") ||
            attempt === 2
          )
            return checkout;
          await new Promise<void>(waitForPoll);
        }
      },
      refetchInterval: ({ state }: { state: { data?: CheckoutSession } }) => {
        const current = state.data;
        const currentCreditState =
          current?.credit_payment_state == null
            ? null
            : (paymentState?.(current.credit_payment_state) ??
              current.credit_payment_state);
        if (
          (current?.tag === "custom_checkout_session" &&
            current.checkout_kind === CheckoutKind?.StandaloneCredit &&
            currentCreditState === "processing") ||
          (current == null && continuationAccepted)
        )
          return 5_000;
        if (
          current?.tag !== "custom_checkout_session" ||
          current.status !== "open"
        )
          return false;
        return pendingFromReturn ? 5_000 : false;
      },
    }) ?? emptyQuery<CheckoutSession>();
  const checkout = verification.data;
  const status =
    checkout?.tag === "custom_checkout_session" ? checkout.status : undefined;
  const creditState =
    checkout?.credit_payment_state == null
      ? null
      : (paymentState?.(checkout.credit_payment_state) ??
        checkout.credit_payment_state);
  const source =
    copyCheckoutSource?.(
      params,
      new URLSearchParams({
        processor_entity: route.processorEntity,
        stripe_session_id: route.checkoutSessionId,
      }),
    ) ??
    new URLSearchParams({
      processor_entity: route.processorEntity,
      stripe_session_id: route.checkoutSessionId,
    });
  const query =
    mergeReturnParams?.(params, source, appBaseUrl) ??
    new URLSearchParams(source);
  if (walletCovered) query.set("wallet_covered", "true");
  const confirmParams =
    checkout?.tag === "custom_checkout_session" &&
    checkout.confirm_return_url != null
      ? new URL(checkout.confirm_return_url, window.location.origin)
          .searchParams
      : null;
  for (const key of ["plan_type", "campaign"]) {
    const value = confirmParams?.get(key) ?? params.get(key);
    if (value != null) query.set(key, value);
  }
  const accountParam = params.get("account_id");
  if (accountParam != null) query.set("account_id", accountParam);
  const successful =
    !accountMismatch &&
    (walletCovered ||
      (status === "complete" &&
        (creditState == null || creditState === "succeeded")) ||
      (continuation.data?.response?.status === "success" &&
        checkout?.tag === "custom_checkout_session" &&
        checkout.status !== "expired"));
  if (successful) {
    const successTeamPath =
      resolvePath?.("/payments/success-team") ?? "/payments/success-team";
    const teamPath =
      checkout?.tag === "custom_checkout_session"
        ? teamSuccessPath?.(
            checkout as Record<string, unknown>,
            params,
            successTeamPath,
          )
        : null;
    return navigate(teamPath ?? `/payments/success?${query.toString()}`);
  }
  const failed =
    accountMismatch ||
    (continuation.data != null && !continuationAccepted) ||
    status === "expired" ||
    creditState === "failed" ||
    creditState === "requires_action";
  const busy = continuationRequested
    ? continuation.isPending === true
    : verification.isPending === true;
  if (!failed && verification.error == null && busy) return loading();
  let main: unknown;
  if (
    !failed &&
    (pendingFromReturn || creditState === "processing") &&
    (verification.error == null || continuationAccepted)
  )
    main = jsx.jsx("p", {
      role: "status",
      children: jsx.jsx(Message ?? "span", {
        id: "checkout.paymentPending",
        defaultMessage:
          "Your payment is still processing. We’ll check for confirmation automatically.",
        description:
          "The payment provider has not reported a final outcome. The page polls server-owned status without submitting another payment.",
      }),
    });
  else
    main = errorView(
      verification.error ??
        (failed ? new Error("Payment verification failed") : undefined),
      !failed &&
        ((continuationRequested && continuation.isPending === true) ||
          verification.isPending === true ||
          verification.isFetching === true),
      () => {
        if (accountMismatch) navigateTo(fallbackPath?.() ?? "/");
        else if (continuation.data?.failed) void continuation.refetch();
        else void verification.refetch();
      },
    );
  const resume =
    status === "open" &&
    !accountMismatch &&
    !pendingFromReturn &&
    creditState !== "processing" &&
    verification.isFetching !== true
      ? jsx.jsx(Button ?? "button", {
          onClick: () => {
            const resumeQuery =
              mergeReturnParams?.(params, new URLSearchParams(), appBaseUrl) ??
              new URLSearchParams(params);
            const suffix = resumeQuery.toString();
            navigateTo(
              `/checkout/${route.processorEntity}/${route.checkoutSessionId}${suffix.length === 0 ? "" : `?${suffix}`}`,
              { replace: true },
            );
          },
          children: jsx.jsx(Message ?? "span", {
            id: "checkout.resumePayment",
            defaultMessage: "Return to payment details",
            description:
              "Return to the existing unpaid checkout after payment verification did not report completion",
          }),
        })
      : null;
  const body = jsx.jsxs(Page ?? "main", { children: [main, resume] });
  return CheckoutSessionWrapper == null
    ? body
    : jsx.jsx(CheckoutSessionWrapper, {
        returnPath: beaconPath ?? undefined,
        children: body,
      });
}

function CheckoutVerifyPage(): unknown {
  const [params] = useSearchParams?.() ?? [new URLSearchParams()];
  const appBaseUrl = new URL(resolvePath?.("/") ?? "/", window.location.origin);
  const beaconPath = beaconReturnPath?.(params, appBaseUrl) ?? null;
  const { accountId } = useAccountState?.() ?? {};
  const parsed = parseRoute(params);
  if (!parsed.success || parsed.data == null)
    return navigate(fallbackPath?.() ?? "/");
  if (accountId == null) return loading();
  return jsx.jsx(VerificationContent, {
    accountId,
    route: parsed.data,
    params,
    appBaseUrl,
    beaconPath,
  });
}

export { CheckoutVerifyPage };
