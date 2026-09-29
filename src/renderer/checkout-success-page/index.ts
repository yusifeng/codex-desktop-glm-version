// checkout-success-page — personal and Business checkout fulfillment routes.

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as subscriptionEventsChunk from "@rchunk/chatgpt-subscription-events";
import * as checkoutPolicyChunk from "@rchunk/checkout-policy";
import * as checkoutLatencyChunk from "@rchunk/checkout-confirm-latency";
import * as documentTitleChunk from "@rchunk/document-title";
import * as workspacePresentationChunk from "@rchunk/create-workspace-presentation";
import * as promoFunnelChunk from "@rchunk/promo-funnel-context";
import * as queriesChunk from "@rchunk/queries";
import * as subscriptionQueriesChunk from "@rchunk/subscription-queries";
import "@rchunk/rolldown-runtime";
import * as checkoutSessionChunk from "@rchunk/checkout-session";
import * as subscriptionOnboardingChunk from "@rchunk/subscription-onboarding-content";
// @ts-ignore -- published dependency is resolved by the renderer chunk manifest.
import * as workspaceNameChunk from "@rchunk/workspace-auto-generated-name";

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useRef<Value>(value: Value): { current: Value };
}

interface AbortSignalLike {
  aborted?: boolean;
  throwIfAborted(): void;
}

interface LocationLike {
  hash?: string;
  pathname: string;
  search: string;
}

interface Identity {
  accountId: string | null;
  isLoading?: boolean;
  userId: string | null;
}

interface QueryResult<Value> {
  data?: Value | null;
  error?: unknown;
  isFetching?: boolean;
  isPending?: boolean;
  refetch(): Promise<unknown> | unknown;
}

interface MutationResult {
  error?: unknown;
  isPending?: boolean;
  mutate(): void;
}

interface CheckoutReturn {
  checkoutSessionId: string;
  processorEntity: string;
}

interface FulfillmentResponse extends Record<string, unknown> {
  auto_top_up_enabled_after_checkout?: boolean;
  checkout_kind?: string | null;
  entry_point?: string | null;
  kind?: string | null;
  workspace_id?: string | null;
  workspace_provisioning?: boolean;
}

interface ProvisioningResponse {
  retryable?: boolean;
  status?: "pending" | "succeeded" | "failed";
  workspace_id?: string | null;
}

interface ScopeLike {
  queryClient?: { fetchQuery?(options: unknown): Promise<unknown> };
}

interface AppSharedApi {
  $3(): void;
  I3(): JsxRuntime;
  LX(scope: unknown): ScopeLike;
  QI(): void;
  Y2: unknown;
  Yh: unknown;
  ZI: unknown;
  _L<Value>(options: Record<string, unknown>): QueryResult<Value>;
  e6(): ReactRuntime;
  iL(options: { mutationFn(): Promise<void>; onSettled(): void }): MutationResult;
  n4(): { formatMessage(descriptor: { defaultMessage: string }): string };
  wL(): void;
}

interface ApiClient {
  safeGet(path: string, options: Record<string, unknown>): Promise<ProvisioningResponse>;
  safePost(path: string, options: Record<string, unknown>): Promise<FulfillmentResponse>;
}

interface ConfigurationClient {
  getLayer(key: string): { get<Value>(name: string, fallback: Value): Value };
}

interface AppInitialApi {
  F6t(): () => void;
  M6t(): void;
  N6t(): Identity;
  Qgn(): void;
  Ygn: unknown;
  _0(): string;
  cJt(): void;
  d_n(): [URLSearchParams];
  i_n(): LocationLike;
  lfn(): ConfigurationClient;
  rJt: ApiClient;
  r_n(path: string): string;
}

interface CheckoutSessionApi {
  d(): void;
  o(): void;
  r: { safeParse(value: unknown): { success: boolean; data?: CheckoutReturn } };
  u: unknown;
}

interface CheckoutLatencyApi {
  c(): void;
  m(): void;
  p: unknown;
  r(): void;
}

interface WorkspaceAccessModule {
  prepareWorkspaceAccess(options: {
    checkoutSessionId: string;
    scope: ScopeLike;
    signal: AbortSignalLike;
    statsig: ConfigurationClient;
    userId: string;
    workspaceId: string;
  }): Promise<unknown>;
}

interface TokenAuthModule {
  getChatGptTokenAuthHeaders?: (options: Record<string, unknown>) => Promise<Record<string, string>>;
}

interface PendingImageModule {
  resumePendingCheckoutImageDownload(options: {
    hasPaidSubscription: boolean;
    intl: { formatMessage(descriptor: { defaultMessage: string }): string };
    signal: AbortSignalLike;
  }): Promise<void>;
}

const {
  $3: initializeCompilerRuntime,
  I3: getJsxRuntime,
  LX: useScope,
  QI: initializeScopeRuntime,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: applicationScope,
  _L: useQuery,
  e6: getReactRuntime,
  iL: useMutation,
  n4: useIntl,
  wL: initializeQueryRuntime,
} = appSharedChunk as unknown as AppSharedApi;

const {
  F6t: useRefreshApplication,
  M6t: initializeAccountModels,
  N6t: useSessionIdentity,
  Qgn: initializeAuthentication,
  Ygn: Redirect,
  _0: getPricingRoute,
  cJt: initializeApiClient,
  d_n: useSearchParams,
  i_n: useLocation,
  lfn: useConfiguration,
  rJt: apiClient,
  r_n: buildChatGptUrl,
} = appInitialChunk as unknown as AppInitialApi;

interface AppPrimaryApi { ih(search: URLSearchParams, homeUrl: URL): string | null; sh(): void }
const { ih: resolveBeaconReturnHref, sh: initializeCheckoutPrimary } =
  appPrimaryChunk as unknown as AppPrimaryApi;

interface InitializerApi { i(): void }
const { i: initializeSubscriptionEvents } = subscriptionEventsChunk as unknown as InitializerApi;
const { S: initializeCheckoutPolicy } = checkoutPolicyChunk as unknown as { S(): void };
const { c: initializeBusinessLatency, m: initializeCheckoutLoading, p: CheckoutStatus, r: initializeCheckoutLatency } =
  checkoutLatencyChunk as unknown as CheckoutLatencyApi;
const { r: initializeDocumentTitle, t: DocumentTitle } = documentTitleChunk as unknown as { r(): void; t: unknown };
const { T: initializeWorkspacePresentation } = workspacePresentationChunk as unknown as { T(): void };
const { n: initializePromoFunnel, t: readPromoFunnel } = promoFunnelChunk as unknown as { n(): void; t(): unknown };
const { i: initializeQueries, n: accountQueryOptions } = queriesChunk as unknown as { i(): void; n(accountId: string): unknown };
const { i: initializeSubscriptionQueries, o: subscriptionQueryOptions } = subscriptionQueriesChunk as unknown as { i(): void; o(accountId: string): unknown };
const { d: initializeCheckoutPlanData, o: initializeCheckoutSession, r: checkoutReturnSchema, u: CheckoutShell } =
  checkoutSessionChunk as unknown as CheckoutSessionApi;
const { o: recordStudentOnboarding, t: initializeSubscriptionOnboarding } =
  subscriptionOnboardingChunk as unknown as { o(input: Record<string, unknown>): void; t(): void };
const { n: initializeWorkspaceName, t: resolveWorkspaceName } =
  workspaceNameChunk as unknown as { n(): void; t(intl: unknown, workspace: unknown, generated: unknown): string };

const SUCCESSFUL_PROVISIONING_POLL_MS = 1_000;
let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

function initializeCheckoutSuccessPage(): void {
  if (initialized) return;
  initializeCompilerRuntime();
  initializeScopeRuntime();
  initializeQueryRuntime();
  initializeAccountModels();
  initializeAuthentication();
  initializeApiClient();
  initializeCheckoutPrimary();
  initializeSubscriptionEvents();
  initializeCheckoutPolicy();
  initializeBusinessLatency();
  initializeCheckoutLoading();
  initializeCheckoutLatency();
  initializeDocumentTitle();
  initializeWorkspacePresentation();
  initializePromoFunnel();
  initializeQueries();
  initializeSubscriptionQueries();
  initializeCheckoutPlanData();
  initializeCheckoutSession();
  initializeSubscriptionOnboarding();
  initializeWorkspaceName();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

async function loadWorkspaceAccess(): Promise<WorkspaceAccessModule> {
  return import("@rchunk/workspace-access.browser") as Promise<WorkspaceAccessModule>;
}

async function loadTokenAuth(): Promise<TokenAuthModule> {
  // @ts-expect-error -- published dynamic dependency is supplied by the chunk graph.
  return import("@rchunk/chatgpt-token-auth.browser") as Promise<TokenAuthModule>;
}

async function loadPendingImageDownload(): Promise<PendingImageModule> {
  return import("@rchunk/pending-image-download") as Promise<PendingImageModule>;
}

function message(defaultMessage: string, id: string): unknown {
  return jsx.jsx(FormattedMessage, { defaultMessage, id });
}

function retryView(loading: boolean, error: unknown, onRetry: () => void): unknown {
  return jsx.jsx(CheckoutStatus, { error, loading, onRetry });
}

function parseCheckoutReturn(search: URLSearchParams): { success: boolean; data?: CheckoutReturn } {
  return checkoutReturnSchema.safeParse({
    checkoutSessionId: search.get("stripe_session_id"),
    processorEntity: search.get("processor_entity"),
  });
}

function fulfillCheckout(returnValue: CheckoutReturn, signal: AbortSignalLike, walletCovered: boolean): Promise<FulfillmentResponse> {
  return apiClient.safePost("/payments/checkout_session", {
    requestBody: {
      payment_method_behavior: walletCovered ? "skip_if_wallet_covered" : undefined,
      processor_entity: returnValue.processorEntity,
      stripe_checkout_session_id: returnValue.checkoutSessionId,
    },
    signal,
  });
}

function fulfillmentOptions(
  accountId: string | null,
  returnValue: { success: boolean; data?: CheckoutReturn },
  walletCovered: boolean,
): Record<string, unknown> {
  return {
    enabled: returnValue.success && accountId != null,
    gcTime: 0,
    queryFn: ({ signal }: { signal: AbortSignalLike }) => {
      if (!returnValue.success || returnValue.data == null) throw Error("Invalid checkout return");
      return fulfillCheckout(returnValue.data, signal, walletCovered);
    },
    queryKey: [
      "checkout-fulfillment",
      accountId,
      returnValue.data?.processorEntity,
      returnValue.data?.checkoutSessionId,
      walletCovered,
    ],
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  };
}

function CheckoutSuccessPage(): unknown {
  const location = useLocation();
  const [search] = useSearchParams();
  return location.pathname.endsWith("/payments/success-team") ||
    search.get("durable_business_checkout") === "true"
    ? jsx.jsx(BusinessCheckoutSuccessPage, {})
    : jsx.jsx(PersonalCheckoutSuccessPage, {});
}

function BusinessCheckoutSuccessPage(): unknown {
  const identity = useSessionIdentity();
  const location = useLocation();
  const [search] = useSearchParams();
  const checkoutReturn = parseCheckoutReturn(search);

  if (!checkoutReturn.success || checkoutReturn.data == null) {
    return jsx.jsx(Redirect, { replace: true, to: getPricingRoute() });
  }
  if (!identity.isLoading && identity.userId == null) {
    const next = `${location.pathname}${location.search}${location.hash ?? ""}`;
    return jsx.jsx(Redirect, { replace: true, to: `/auth/login?${new URLSearchParams({ next })}` });
  }
  if (identity.isLoading || identity.userId == null || identity.accountId == null) {
    return jsx.jsx(CheckoutStatus, { stage: "confirming_payment" });
  }
  return jsx.jsx(BusinessCheckoutFulfillment, {
    accountId: identity.accountId,
    checkoutReturn: checkoutReturn.data,
    userId: identity.userId,
  }, `${identity.userId}:${checkoutReturn.data.checkoutSessionId}`);
}

function BusinessCheckoutFulfillment(props: {
  accountId: string;
  checkoutReturn: CheckoutReturn;
  userId: string;
}): unknown {
  const { accountId, checkoutReturn, userId } = props;
  const scope = useScope(applicationScope);
  const statsig = useConfiguration();
  const [search] = useSearchParams();
  const walletCovered = search.get("wallet_covered") === "true";
  const fulfillment = useQuery<FulfillmentResponse>(
    fulfillmentOptions(accountId, { success: true, data: checkoutReturn }, walletCovered),
  );
  const durable =
    search.get("durable_business_checkout") === "true" ||
    statsig.getLayer("550361471").get("durable_workspace_onboarding_enabled", false);
  const workspaceId = fulfillment.data?.workspace_id ?? search.get("account_id");
  const accessEnabled = fulfillment.data != null && workspaceId != null;
  const access = useQuery<unknown>({
    enabled: accessEnabled,
    gcTime: 0,
    queryFn: async ({ signal }: { signal: AbortSignalLike }) => {
      const tokenAuth = await loadTokenAuth();
      await tokenAuth.getChatGptTokenAuthHeaders?.({ accountId, signal });
      const { prepareWorkspaceAccess } = await loadWorkspaceAccess();
      return prepareWorkspaceAccess({
        checkoutSessionId: checkoutReturn.checkoutSessionId,
        scope,
        signal,
        statsig,
        userId,
        workspaceId: workspaceId ?? accountId,
      });
    },
    queryKey: [
      "business-checkout-access",
      userId,
      checkoutReturn.checkoutSessionId,
      accountId,
      durable,
    ],
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  });

  if (fulfillment.isPending) return jsx.jsx(CheckoutStatus, { stage: "confirming_payment" });
  if (fulfillment.error != null) {
    return jsx.jsxs(CheckoutShell, {
      children: [
        jsx.jsx("p", { role: "alert", children: message("Your workspace needs attention", "businessWorkspaceRecovery.title") }),
        jsx.jsx(Button, { onClick: () => fulfillment.refetch(), children: message("Try again", "businessWorkspaceRecovery.retry") }),
      ],
    });
  }
  if (access.isPending || access.data == null && access.error == null) {
    return jsx.jsx(CheckoutStatus, { stage: durable ? "preparing_workspace" : "setting_up_access" });
  }
  if (access.error != null) {
    return jsx.jsxs(CheckoutShell, {
      children: [
        jsx.jsx("p", { role: "alert", children: message("Your payment succeeded, but we couldn’t finish setting up your workspace", "checkout.workspacePreparationFailed") }),
        jsx.jsx(Button, { onClick: () => access.refetch(), children: message("Retry workspace setup", "checkout.retryWorkspacePreparation") }),
      ],
    });
  }
  const workspaceName = resolveWorkspaceName(useIntl(), access.data, null);
  return jsx.jsxs(CheckoutShell, {
    children: [
      jsx.jsx("p", { role: "status", children: message("Your workspace is ready", "checkout.workspaceReady") }),
      jsx.jsx("p", { children: workspaceName }),
      jsx.jsx(Button, { children: message("Continue to ChatGPT", "checkout.return"), onClick: () => window.location.assign(buildChatGptUrl("/")) }),
    ],
  });
}

function PersonalCheckoutSuccessPage(): unknown {
  const scope = useScope(applicationScope);
  const [search] = useSearchParams();
  const homeHref = buildChatGptUrl("/");
  const beaconReturnHref = resolveBeaconReturnHref(search, new URL(homeHref, window.location.origin));
  const identity = useSessionIdentity();
  const intl = useIntl();
  const refreshApplication = useRefreshApplication();
  const returnValue = parseCheckoutReturn(search);
  const walletCovered = search.get("wallet_covered") === "true";
  const fulfillment = useQuery<FulfillmentResponse>(
    fulfillmentOptions(identity.accountId, returnValue, walletCovered),
  );
  const activeController = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => activeController.current?.abort(), []);
  const provisioning = useQuery<ProvisioningResponse>({
    enabled: fulfillment.data?.workspace_provisioning === true,
    gcTime: 0,
    queryFn: ({ signal }: { signal: AbortSignalLike }) =>
      apiClient.safeGet("/accounts/business_workspace_provisioning", {
        parameters: { query: { checkout_session_id: returnValue.data?.checkoutSessionId, wait_ms: 25_000 } },
        signal,
      }),
    queryKey: [
      "checkout-workspace-provisioning",
      identity.accountId,
      returnValue.data?.checkoutSessionId,
    ],
    refetchInterval: (query: { state?: { data?: ProvisioningResponse; error?: unknown } }) =>
      query.state?.error == null && query.state?.data?.status === "pending"
        ? SUCCESSFUL_PROVISIONING_POLL_MS
        : false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  });

  const complete = async (): Promise<void> => {
    if (identity.accountId == null || activeController.current != null) return;
    const controller = new AbortController();
    activeController.current = controller;
    try {
      await scope.queryClient?.fetchQuery?.(accountQueryOptions(identity.accountId));
      await scope.queryClient?.fetchQuery?.(subscriptionQueryOptions(identity.accountId));
      controller.signal.throwIfAborted();
      const { resumePendingCheckoutImageDownload } = await loadPendingImageDownload();
      await resumePendingCheckoutImageDownload({ hasPaidSubscription: true, intl, signal: controller.signal });
      controller.signal.throwIfAborted();
      if (search.get("campaign") === "students_2026") {
        recordStudentOnboarding({ accountId: identity.accountId, isPaidPlus: true });
      }
      readPromoFunnel();
      const destination = beaconReturnHref ?? `${homeHref.replace(/\/$/, "")}/?refresh_account=true`;
      window.history.replaceState(null, "", destination);
      refreshApplication();
    } finally {
      activeController.current = null;
    }
  };
  const mutation = useMutation({ mutationFn: complete, onSettled() { activeController.current = null; } });

  if (!returnValue.success || returnValue.data == null) {
    return jsx.jsx(Redirect, { replace: true, to: getPricingRoute() });
  }
  if (fulfillment.data?.workspace_provisioning === true) {
    const next = new URLSearchParams(search);
    next.set("durable_business_checkout", "true");
    return jsx.jsx(Redirect, { replace: true, to: `/payments/success-team?${next}` });
  }
  if (fulfillment.data == null || fulfillment.error != null) {
    return retryView(Boolean(fulfillment.isPending), fulfillment.error, () => fulfillment.refetch());
  }

  const plan = search.get("plan_type");
  const pageTitle = intl.formatMessage({ defaultMessage: "Account - Payment success" });
  const alert = fulfillment.data.auto_top_up_enabled_after_checkout === false
    ? jsx.jsx("p", { role: "alert", children: message("Your credits were purchased, but automatic top-ups could not be enabled. Review automatic top-ups in Settings.", "checkout.autoTopUpFailed") })
    : null;

  return jsx.jsxs(jsx.Fragment, {
    children: [
      jsx.jsx(DocumentTitle, { title: pageTitle }),
      jsx.jsx(CheckoutShell, {
        returnPath: beaconReturnHref ?? undefined,
        children: jsx.jsxs(jsx.Fragment, {
          children: [
            jsx.jsx("p", { role: "status", children: message("Your purchase is complete", "checkout.success") }),
            plan == null ? null : jsx.jsx("p", { children: plan }),
            alert,
            mutation.error == null ? null : jsx.jsx("p", { role: "alert", children: message("Something went wrong. Please try again.", "checkout.returnFailed") }),
            jsx.jsx(Button, {
              color: "primary",
              disabled: Boolean(mutation.isPending) || provisioning.isFetching === true,
              onClick: () => mutation.mutate(),
              children: message("Continue to ChatGPT", "checkout.return"),
            }),
          ],
        }),
      }),
    ],
  });
}

initializeCheckoutSuccessPage();

export { CheckoutSuccessPage };
