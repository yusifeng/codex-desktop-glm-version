import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  FX as initializeScopeRuntime,
  I3 as getJsxRuntime,
  LX as useScope,
  Qh as LoadingSpinner,
  Y2 as FormattedMessage,
  Yh as Button,
  ZI as AppScope,
  Zh as initializeButton,
  _L as useQuery,
  dg as initializeThemeSubscription,
  e6 as getReactRuntime,
  fg as useIsDarkTheme,
  gL as initializeQueryRuntime,
  n4 as useIntl,
  sw as CloseIcon,
  vW as expectedAccountIdHeader,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  M6t as initializeAuthentication,
  N6t as useAuthentication,
  Qgn as initializeRouter,
  Sdn as ApiError,
  Ygn as Navigate,
  cJt as initializeApiClient,
  i_n as useLocation,
  ifn as initializeAccountQueries,
  lfn as useStatsig,
  o_n as useNavigate,
  rJt as apiClient,
  rfn as getExperiment,
} from "@rchunk/app-initial";
import { S as initializeCheckoutPolicy } from "@rchunk/checkout-policy";
import {
  n as initializeBillingPricing,
  t as resolvePricingConfig,
} from "@rchunk/billing-pricing";
import "@rchunk/create-workspace-presentation";
import "@rchunk/checkout-session";
import {
  n as HostedCheckoutPage,
  r as initializeCheckoutPage,
} from "@rchunk/checkout-page-core";
// @ts-expect-error The release create-session chunk has no semantic declaration yet.
import { n as initSession, t as createSession } from "@rchunk/create-session";

interface StatsigClient {
  getContext(): { user: { country?: string | null } };
  getLayer(id: string): { get(key: string, fallback: boolean): boolean };
}

const getExperimentWithOptions = getExperiment as unknown as (
  context: unknown,
  id: string,
  options: { disableExposureLog: boolean },
) => { get(key: string, fallback: boolean): boolean };

interface TokenAuthModule {
  getBrowserChatGptAuthSnapshot(): {
    accessToken: string;
    accountId?: string;
    userId?: string;
  } | null;
  readChatGptTokenClaims(token: string): { accountId?: string } | null;
}

interface ProvisioningState {
  checkoutSessionId: string;
  processorEntity: string;
  state: string;
  workspaceId?: string | null;
}

interface PendingWorkspace {
  query_params?: string | null;
  seat_quantity?: number | null;
  status?: string;
  step_name?: string | null;
  workspace_name?: string | null;
}

interface WorkspaceSignupState {
  completed: boolean;
  pendingWorkspace?: PendingWorkspace;
  resumeUrl: string | null;
}

interface CheckoutAccount {
  account: {
    account_user_id: string;
    is_deactivated?: boolean;
    plan_type: string;
    structure?: string;
  };
  can_access_with_session?: boolean;
  eligible_promo_campaigns?: { team?: { id?: string } | null };
  entitlement: {
    billing_currency?: string | null;
    has_active_subscription?: boolean;
  };
  last_active_subscription?: { purchase_origin_platform?: string | null };
}

interface AccountsCheckResponse {
  accounts: Record<string, CheckoutAccount | undefined>;
}

interface PricingConfig {
  currency_config: {
    business_currency_override?: string | null;
    symbol_code?: string | null;
  };
}

interface CheckoutRequest extends Record<string, unknown> {
  billing_details: { country?: string; currency: string };
  checkout_ui_mode: "custom";
  entry_point: "team_direct_signup";
  plan_name: "chatgptteamplan";
  team_plan_data: {
    price_interval: "month" | "year";
    seat_quantity: number;
    workspace_name: string;
  };
}

interface CustomCheckoutSession {
  checkout_session_id: string;
  processor_entity: string;
  tag: "custom_checkout_session";
}

interface HostedCheckoutSession {
  url?: string | null;
}

type CheckoutSession = CustomCheckoutSession | HostedCheckoutSession;
interface CheckoutResult {
  request: CheckoutRequest;
  session: CheckoutSession;
}

interface QueryClient {
  fetchQuery<Data>(options: {
    queryFn(): Promise<Data>;
    queryKey: readonly unknown[];
    retry: boolean;
    staleTime: number;
  }): Promise<Data>;
}

let React: ReactRuntime;
let jsx: JsxRuntime;

async function loadTokenAuth(): Promise<TokenAuthModule> {
  // @ts-expect-error The release token-auth chunk has no semantic declaration yet.
  return import("@rchunk/chatgpt-token-auth.browser") as Promise<TokenAuthModule>;
}

async function fetchWorkspaceSignupState({
  accountId,
  durable,
  signal,
}: {
  accountId: string;
  durable: boolean;
  signal: AbortSignal;
}): Promise<WorkspaceSignupState> {
  const requestOptions = {
    additionalHeaders: {
      "ChatGPT-Account-ID": accountId,
      [expectedAccountIdHeader]: accountId,
    },
    signal,
  };
  let resumeUrl: string | null = null;
  let completed = false;

  if (durable) {
    const provisioning = await apiClient
      .safeGet<ProvisioningState>("/accounts/business_workspace_provisioning", {
        ...requestOptions,
        parameters: { query: { wait_ms: 0 } },
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      });
    signal.throwIfAborted();
    const tokenAuth = await loadTokenAuth();
    const snapshot = tokenAuth.getBrowserChatGptAuthSnapshot();
    const browserAccountId =
      snapshot == null
        ? undefined
        : tokenAuth.readChatGptTokenClaims(snapshot.accessToken)?.accountId;
    if (
      provisioning != null &&
      (provisioning.state !== "succeeded" ||
        provisioning.workspaceId !== browserAccountId)
    ) {
      const parameters = new URLSearchParams({
        durable_business_checkout: "true",
        stripe_session_id: provisioning.checkoutSessionId,
        processor_entity: provisioning.processorEntity,
      });
      if (provisioning.workspaceId != null)
        parameters.set("account_id", provisioning.workspaceId);
      resumeUrl = `/payments/success-team?${parameters}`;
      completed = provisioning.state === "succeeded";
      if (!completed)
        return { pendingWorkspace: undefined, resumeUrl, completed };
    }
  }

  const pendingWorkspace = await apiClient
    .safeGet<PendingWorkspace>(
      "/accounts/pending_team_workspace",
      requestOptions,
    )
    .catch(() => {
      signal.throwIfAborted();
      return undefined;
    });
  return {
    pendingWorkspace:
      pendingWorkspace?.status === "completed" ? undefined : pendingWorkspace,
    resumeUrl,
    completed,
  };
}

function validCountryCode(value: string | null | undefined): value is string {
  return value != null && /^[A-Z]{2}$/u.test(value);
}

function validCurrency(value: string | null | undefined): value is string {
  return value != null && /^[A-Z]{3}$/u.test(value);
}

async function prepareCheckout({
  scope,
  statsig,
  accountId,
  userId,
  pendingWorkspace,
  search,
  cancelUrl,
  isDark,
  attemptId,
  signal,
}: {
  scope: { queryClient: QueryClient };
  statsig: StatsigClient;
  accountId: string;
  userId: string;
  pendingWorkspace?: PendingWorkspace;
  search: string;
  cancelUrl: string;
  isDark: boolean;
  attemptId: string;
  signal: AbortSignal;
}): Promise<CheckoutResult> {
  const additionalHeaders = {
    "ChatGPT-Account-ID": accountId,
    [expectedAccountIdHeader]: accountId,
  };
  if (pendingWorkspace == null) {
    await scope.queryClient.fetchQuery({
      queryKey: [
        "business-workspace-signup-receipt",
        userId,
        accountId,
        attemptId,
      ],
      queryFn: async () => {
        try {
          await apiClient.safePost("/accounts/pending_team_workspace", {
            additionalHeaders,
            signal: AbortSignal.timeout(30_000),
            requestBody: {
              step_name: "configure-plan",
              query_params: search,
              user_segment: "v1",
            },
          });
        } catch {
          return false;
        }
        return true;
      },
      staleTime: Infinity,
      retry: false,
    });
    signal.throwIfAborted();
  }

  const accountResponse = await apiClient.safeGet<AccountsCheckResponse>(
    "/accounts/check/{version}",
    {
      additionalHeaders,
      parameters: { path: { version: "v4-2023-04-27" } },
      signal,
    },
  );
  const checkoutAccount = accountResponse.accounts[accountId];
  if (
    checkoutAccount == null ||
    checkoutAccount.account.account_user_id !== `${userId}__${accountId}` ||
    checkoutAccount.account.is_deactivated === true ||
    checkoutAccount.can_access_with_session === false
  )
    throw new Error("Business checkout account is unavailable");

  const parameters = new URLSearchParams(search);
  const userCountry = statsig.getContext().user.country ?? undefined;
  const requestedCountry = parameters.get("country_code");
  const country = validCountryCode(requestedCountry)
    ? requestedCountry
    : validCountryCode(userCountry)
      ? userCountry
      : "US";
  const pricingEnabled = (gate: string): boolean =>
    statsig.getLayer("3768341700").get(gate, false);
  const initialPricing = (await resolvePricingConfig({
    country,
    signal,
    isPricingEnabled: pricingEnabled,
  })) as unknown as PricingConfig;
  const initialCurrency = initialPricing.currency_config.symbol_code;
  if (!validCurrency(initialCurrency))
    throw new Error("Business checkout currency is unavailable");

  let billingDetails: { country?: string; currency: string } = {
    country,
    currency: initialCurrency,
  };
  const activeSubscription =
    checkoutAccount.entitlement.has_active_subscription === true &&
    checkoutAccount.last_active_subscription?.purchase_origin_platform !==
      "chatgpt_no_payment_trial";
  const multiWorkspaceEnabled = getExperimentWithOptions(
    statsig,
    "3573128711",
    { disableExposureLog: true },
  ).get("enabled", false);
  const preserveSubscriptionCurrency =
    activeSubscription &&
    (!multiWorkspaceEnabled ||
      checkoutAccount.account.structure === "personal");
  const subscriptionCurrency =
    checkoutAccount.entitlement.billing_currency ?? "USD";
  const overrideCurrency =
    initialPricing.currency_config.business_currency_override;
  if (
    preserveSubscriptionCurrency &&
    subscriptionCurrency !== initialCurrency
  ) {
    if (!validCurrency(subscriptionCurrency))
      throw new Error("Subscription billing currency is unavailable");
    billingDetails = { currency: subscriptionCurrency };
  } else if (
    validCurrency(overrideCurrency) &&
    getExperiment(statsig, "2658206886").get(
      "is_business_currency_override_enabled",
      false,
    )
  ) {
    billingDetails = { country, currency: overrideCurrency };
  }
  await resolvePricingConfig({
    country: billingDetails.country,
    currency: billingDetails.currency,
    signal,
    isPricingEnabled: pricingEnabled,
  });

  const pendingParameters = new URLSearchParams(
    pendingWorkspace?.query_params ?? "",
  );
  const requestedCampaign =
    parameters.get("promo_campaign") ?? pendingParameters.get("promo_campaign");
  const coupon =
    requestedCampaign == null
      ? null
      : await apiClient.safeGet<{ coupon?: string }>(
          "/promo_campaign/check_coupon",
          {
            additionalHeaders,
            parameters: {
              query: {
                coupon: requestedCampaign,
                is_coupon_from_query_param: true,
              },
            },
            signal,
          },
        );
  const eligibleCampaign = checkoutAccount.eligible_promo_campaigns?.team?.id;
  const fallbackCampaign =
    requestedCampaign == null &&
    eligibleCampaign != null &&
    !eligibleCampaign.startsWith("resurrection-discount-v1-")
      ? eligibleCampaign
      : undefined;
  const campaign = coupon?.coupon ?? fallbackCampaign;
  const priceInterval =
    parameters.get("selectedPlan") === "year" ? "year" : "month";

  const isFreeWorkspace =
    checkoutAccount.account.plan_type === "free_workspace";
  const users = isFreeWorkspace
    ? await apiClient.safeGet<{ total?: number }>(
        "/accounts/{account_id}/users",
        {
          additionalHeaders,
          parameters: {
            path: { account_id: accountId },
            query: { limit: 1, offset: 0 },
          },
          signal,
        },
      )
    : null;
  const existingMembers =
    isFreeWorkspace && (users?.total ?? 0) > 0 ? users?.total : undefined;
  const minimumSeats = Math.max(existingMembers ?? 2, 2);
  const defaultSeats = Math.max(existingMembers ?? 5, minimumSeats);
  const requestedSeats = Number.parseInt(parameters.get("numSeats") ?? "", 10);
  const seatQuantity = Math.max(
    pendingWorkspace?.seat_quantity ??
      (Number.isNaN(requestedSeats) ? defaultSeats : requestedSeats),
    minimumSeats,
  );

  const request: CheckoutRequest = {
    entry_point: "team_direct_signup",
    plan_name: "chatgptteamplan",
    checkout_ui_mode: "custom",
    team_plan_data: {
      workspace_name: pendingWorkspace?.workspace_name ?? "",
      price_interval: priceInterval,
      seat_quantity: seatQuantity,
    },
    billing_details: billingDetails,
    ...(priceInterval === "month" && campaign != null
      ? {
          promo_campaign: {
            promo_campaign_id: campaign,
            is_coupon_from_query_param: coupon != null,
          },
        }
      : {}),
  };

  const snapshot = (await loadTokenAuth()).getBrowserChatGptAuthSnapshot();
  signal.throwIfAborted();
  if (snapshot?.userId !== userId || snapshot.accountId !== accountId)
    throw new DOMException("Checkout owner changed", "AbortError");
  const session = (await createSession({
    accountId,
    request,
    statsig,
    isDark,
    cancelUrl,
    attemptId,
    signal,
  })) as CheckoutSession;
  return { session, request };
}

function CreateWorkspacePage(): unknown {
  const { userId, accountId, isLoading } = useAuthentication();
  const location = useLocation();
  if (!isLoading && userId == null) {
    const next = `${location.pathname}${location.search}`;
    return jsx.jsx(Navigate, {
      to: `/auth/login?${new URLSearchParams({ next })}`,
      replace: true,
    });
  }
  if (userId == null || accountId == null) return jsx.jsx(CheckoutStatus, {});
  return jsx.jsx(
    AuthenticatedCreateWorkspacePage,
    { userId, accountId },
    `${userId}:${accountId}`,
  );
}

function AuthenticatedCreateWorkspacePage({
  userId,
  accountId,
}: {
  userId: string;
  accountId: string;
}): unknown {
  const statsig = useStatsig() as unknown as StatsigClient;
  const location = useLocation();
  const navigate = useNavigate();
  const [createAfterResume, setCreateAfterResume] = React.useState<
    string | null
  >(null);
  const durable = statsig
    .getLayer("550361471")
    .get("durable_workspace_onboarding_enabled", false);
  const signup = useQuery<WorkspaceSignupState>({
    queryKey: ["business-workspace-signup", userId, accountId, durable],
    queryFn: ({ signal }) =>
      fetchWorkspaceSignupState({ accountId, durable, signal }),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  if (signup.error != null)
    return jsx.jsx(CheckoutStatus, { onRetry: () => signup.refetch() });
  if (signup.data == null) return jsx.jsx(CheckoutStatus, {});
  if (signup.data.resumeUrl != null && !signup.data.completed)
    return jsx.jsx(Navigate, { to: signup.data.resumeUrl, replace: true });
  if (
    signup.data.resumeUrl != null &&
    createAfterResume !== signup.data.resumeUrl
  )
    return jsx.jsx(ResumeWorkspaceChoice, {
      onResume: () => navigate(signup.data?.resumeUrl ?? "/"),
      onCreate: () => setCreateAfterResume(signup.data?.resumeUrl ?? null),
      onClose: () => navigate("/"),
    });

  const parameters = new URLSearchParams(location.search);
  for (const [key, value] of new URLSearchParams(
    signup.data.pendingWorkspace?.query_params ?? "",
  ))
    if (key !== "step" && !parameters.get(key)) parameters.set(key, value);
  parameters.set("step", "configure-plan");
  const search = `?${parameters}`;
  if (search !== location.search)
    return jsx.jsx(Navigate, {
      to: `${location.pathname}${search}`,
      replace: true,
    });
  return jsx.jsx(AutoCheckout, {
    userId,
    accountId,
    pendingWorkspace: signup.data.pendingWorkspace,
  });
}

function AutoCheckout({
  userId,
  accountId,
  pendingWorkspace,
}: {
  userId: string;
  accountId: string;
  pendingWorkspace?: PendingWorkspace;
}): unknown {
  const scope = useScope(AppScope) as unknown as { queryClient: QueryClient };
  const statsig = useStatsig() as unknown as StatsigClient;
  const location = useLocation();
  const isDark = Boolean(useIsDarkTheme());
  const [attemptId] = React.useState(createAttemptId);
  const checkout = useQuery<CheckoutResult>({
    queryKey: [
      "business-workspace-auto-checkout",
      userId,
      accountId,
      attemptId,
    ],
    queryFn: ({ signal }) =>
      prepareCheckout({
        scope,
        statsig,
        accountId,
        userId,
        pendingWorkspace,
        search: location.search,
        cancelUrl: new URL(
          `${location.pathname}${location.search}`,
          window.location.origin,
        ).href,
        isDark,
        attemptId,
        signal,
      }),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  if (checkout.data != null) {
    const { session, request } = checkout.data;
    if ("tag" in session && session.tag === "custom_checkout_session")
      return jsx.jsx(Navigate, {
        to: `/checkout/${session.processor_entity}/${session.checkout_session_id}${location.search}`,
        state: { checkoutRequest: request },
        replace: true,
      });
    if ("url" in session && session.url != null)
      return jsx.jsx(HostedCheckoutPage, { url: session.url });
  }
  return jsx.jsx(CheckoutStatus, {
    onRetry:
      checkout.error == null
        ? undefined
        : () => {
            checkout.refetch();
          },
  });
}

function createAttemptId(): string {
  return crypto.randomUUID();
}

function CheckoutStatus({ onRetry }: { onRetry?: () => void }): unknown {
  const intl = useIntl();
  const title = intl.formatMessage({
    id: "businessWorkspaceCheckout.pageTitle",
    defaultMessage: "Sign up for a Business plan",
    description: "Page title for the Business sign-up page.",
  });
  return jsx.jsxs("div", {
    "data-dark-mode": Boolean(useIsDarkTheme()),
    children: [
      jsx.jsx("title", { children: title }),
      onRetry == null
        ? jsx.jsx(LoadingSpinner, { className: "size-8" })
        : jsx.jsxs("div", {
            children: [
              jsx.jsx("h1", {
                children: jsx.jsx(FormattedMessage, {
                  id: "businessWorkspaceCheckout.errorTitle",
                  defaultMessage: "We couldn't start checkout",
                }),
              }),
              jsx.jsx("p", {
                children: jsx.jsx(FormattedMessage, {
                  id: "businessWorkspaceCheckout.errorDescription",
                  defaultMessage: "Please try again to continue with checkout.",
                }),
              }),
              jsx.jsx(Button, {
                onClick: onRetry,
                children: jsx.jsx(FormattedMessage, {
                  id: "businessWorkspaceCheckout.retry",
                  defaultMessage: "Try again",
                }),
              }),
            ],
          }),
    ],
  });
}

function ResumeWorkspaceChoice({
  onResume,
  onCreate,
  onClose,
}: {
  onResume(): void;
  onCreate(): void;
  onClose(): void;
}): unknown {
  return jsx.jsxs("div", {
    "data-dark-mode": Boolean(useIsDarkTheme()),
    children: [
      jsx.jsx(Button, {
        color: "ghost",
        onClick: onClose,
        "aria-label": "Back to ChatGPT",
        children: jsx.jsx(CloseIcon, {}),
      }),
      jsx.jsx("h1", { children: "Your workspace is ready" }),
      jsx.jsx("p", {
        children:
          "Your previous checkout already created a workspace. You can continue its setup or create another workspace.",
      }),
      jsx.jsx(Button, {
        onClick: onResume,
        children: "Continue previous setup",
      }),
      jsx.jsx(Button, {
        onClick: onCreate,
        children: "Create another workspace",
      }),
    ],
  });
}

initializeCompilerRuntime();
initializeCheckoutPolicy();
initializeQueryRuntime();
initializeScopeRuntime();
React = getReactRuntime();
initializeButton();
initializeRouter();
initializeAuthentication();
initializeApiClient();
initializeAccountQueries();
initializeBillingPricing();
initializeThemeSubscription();
initializeCheckoutPage();
initSession();
jsx = getJsxRuntime();

export { CreateWorkspacePage };
