// purchase-page — Pricing route validation and subscription checkout preparation.

import * as accountIntegrityChunk from "@rchunk/account-action-integrity";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as checkoutLatencyChunk from "@rchunk/checkout-confirm-latency";
import * as checkoutPageChunk from "@rchunk/checkout-page-core";
import * as checkoutPolicyChunk from "@rchunk/checkout-policy";
import * as checkoutSessionChunk from "@rchunk/checkout-session";
// @ts-ignore -- semantic dependency exists in the published renderer asset graph.
import * as checkoutTelemetryChunk from "@rchunk/checkout-telemetry";
import * as creditPurchaseChunk from "@rchunk/credit-purchase-page-core";
import * as offerQueriesChunk from "@rchunk/offer-queries";
import * as promoFunnelChunk from "@rchunk/promo-funnel-context";
import * as queriesChunk from "@rchunk/queries";
import "@rchunk/rolldown-runtime";
// @ts-ignore -- semantic dependency exists in the published renderer asset graph.
import * as workspaceNameChunk from "@rchunk/workspace-auto-generated-name";

type PurchasePlan = "go" | "plus" | "pro" | "pro5x" | "team";

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: unknown, key?: string): unknown;
  jsxs(type: unknown, props: unknown, key?: string): unknown;
}

interface ReactRuntime {
  useEffect(effect: () => void, dependencies: readonly unknown[]): void;
  useRef<Value>(value: Value): { current: Value };
  useState<Value>(value: Value): [Value, (next: Value) => void];
}

interface AbortSignalLike {
  aborted?: boolean;
  throwIfAborted(): void;
}

interface LocationLike {
  pathname: string;
  search: string;
  state?: Record<string, unknown> | null;
}

interface Account {
  account_user_role?: string | null;
  id: string;
  plan_type: string;
}

interface QueryResult<Value> {
  data?: Value | null;
  error?: unknown;
  isPending?: boolean;
  refetch(): Promise<unknown> | unknown;
}

interface CheckoutResponse extends Record<string, unknown> {
  checkout_session_id?: string;
  tag?: string;
  url?: string | null;
}

interface SubscriptionState {
  eligible_offers?: unknown[];
  entitlement: { has_active_subscription: boolean };
  last_active_subscription?: { purchase_origin_platform?: string | null } | null;
}

interface PromotionState {
  is_eligible?: boolean;
  metadata?: { plan_name?: string; metadata?: { plan_name?: string } } | null;
}

interface ConfigurationClient {
  checkGate(key: string): boolean;
  getDynamicConfig(key: string): { get<Value>(name: string, fallback: Value): Value };
  getLayer(key: string): { get<Value>(name: string, fallback: Value): Value };
}

interface CheckoutPreparation {
  cancelHref?: string;
  checkoutEntryPoint?: string;
  loadingContent?: unknown;
  onPrepared(response: CheckoutResponse, request: Record<string, unknown>): Promise<unknown> | unknown;
  pricingCheckoutId?: string;
  upsellContextId?: string;
}

interface PricingCheckoutPreparationProps extends CheckoutPreparation {
  route: string;
}

interface CheckoutFlowProps {
  accountId: string;
  location: LocationLike;
  plan: PurchasePlan;
  preparation?: CheckoutPreparation;
  userId: string;
}

interface AppSharedApi {
  $3(): void;
  BX<Value>(family: unknown, parameter: unknown): { data?: Value; error?: unknown; isLoading?: boolean };
  FX(): void;
  I3(): JsxRuntime;
  K2(): void;
  LX(scope: unknown): { queryClient: { invalidateQueries(input: { queryKey: unknown[] }): unknown } };
  QI(): void;
  Y2: unknown;
  Yh: unknown;
  ZI: unknown;
  Zh(): void;
  _L<Value>(options: Record<string, unknown>): QueryResult<Value>;
  e6(): ReactRuntime;
  fg(): boolean;
  gL(): void;
  vW: string;
  wL(): void;
}

interface ApiClient {
  safePost(path: string, input: Record<string, unknown>): Promise<CheckoutResponse>;
}

interface AppInitialApi {
  M6t(): void;
  N6t(): { accountId: string | null; userId: string | null };
  Qgn(): void;
  XP(scope: unknown, attempt: unknown): void;
  Ygn: unknown;
  _0(input?: { search?: string }): string;
  cJt(): void;
  i_n(): LocationLike;
  ifn(): void;
  l_n(): { plan?: string };
  lfn(): ConfigurationClient;
  mC: unknown;
  o_n(): (destination: unknown, options?: Record<string, unknown>) => void;
  rJt: ApiClient;
  rht(): void;
  uht(accountId?: string, options?: { preview: boolean }): { data?: Account | null; isError?: boolean; isLoading?: boolean };
}

interface CheckoutSessionApi {
  I(): void;
  d(): void;
  o(): void;
  u: unknown;
}

interface IntegrityApi {
  i(surface: string): Promise<Record<string, string>>;
  n(): void;
}

const {
  $3: initializeCompilerRuntime,
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  K2: initializeIntlRuntime,
  LX: useScope,
  QI: initializeScopeRuntime,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: applicationScope,
  Zh: initializeButton,
  _L: useQuery,
  e6: getReactRuntime,
  fg: useDarkMode,
  gL: initializeUseQuery,
  vW: accountHeaderName,
  wL: initializeQueryRuntime,
} = appSharedChunk as unknown as AppSharedApi;

const {
  M6t: initializeAccountModels,
  N6t: useSessionIdentity,
  Qgn: initializeAuthentication,
  XP: resetCheckoutAttempt,
  Ygn: Redirect,
  _0: buildPricingRoute,
  cJt: initializeApiClient,
  i_n: useLocation,
  ifn: initializeFeatureGates,
  l_n: useRouteParams,
  lfn: useConfiguration,
  mC: workspaceNameFamily,
  o_n: useNavigate,
  rJt: apiClient,
  rht: initializeAccountQueries,
  uht: useAccount,
} = appInitialChunk as unknown as AppInitialApi;

interface AppPrimaryApi { ph(): void; sh(): void }
const { ph: initializeCheckoutSelection, sh: initializeWorkspaceCheckout } =
  appPrimaryChunk as unknown as AppPrimaryApi;

const { i: initializeSubscriptionQueries, n: subscriptionQueryOptions } = queriesChunk;
const { E: resolveCheckoutUiMode, S: initializeCheckoutPolicy } = checkoutPolicyChunk;
interface CheckoutTelemetryApi { r(): void; t: { ALL_PLANS_PRICING_MODAL: string } }
const { r: initializeCheckoutTelemetry, t: checkoutEntryPoints } =
  checkoutTelemetryChunk as unknown as CheckoutTelemetryApi;
const { i: getIntegrityHeaders, n: initializeAccountIntegrity } =
  accountIntegrityChunk as unknown as IntegrityApi;
const { I: initializeCheckoutSession, d: initializeCheckoutPlanData, o: initializeCheckoutRoute, u: CheckoutReturn } =
  checkoutSessionChunk as unknown as CheckoutSessionApi;
const { m: initializeCheckoutLoading, p: CheckoutLoadingState } = checkoutLatencyChunk;
const { n: HostedCheckout, r: initializeCheckoutPage } = checkoutPageChunk;
interface OfferQueriesApi {
  n(input: {
    accountId: string;
    code: string;
    kind: string;
    signal: AbortSignalLike;
  }): Promise<PromotionState>;
  r(): void;
}
const { n: checkOffer, r: initializeOfferQueries } =
  offerQueriesChunk as unknown as OfferQueriesApi;
const { n: initializePromoFunnel, r: recordPromoApplied } = promoFunnelChunk;
const { n: initializeCreditPurchase, t: CreditPurchasePage } = creditPurchaseChunk;
interface WorkspaceNameApi { n(): void; t(input: unknown, workspace: unknown, generated: unknown): string }
const { n: initializeWorkspaceName, t: resolveWorkspaceName } =
  workspaceNameChunk as unknown as WorkspaceNameApi;

const ACCOUNT_QUERY_OPTIONS = { preview: false };
const VALID_PLANS = new Set<PurchasePlan>(["go", "plus", "pro", "pro5x", "team"]);
const PLAN_NAMES: Record<PurchasePlan, string> = {
  go: "chatgptgoplan",
  plus: "chatgptplusplan",
  pro: "chatgptpro",
  pro5x: "chatgptpro",
  team: "chatgptteamplan",
};

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

function initializePurchasePage(): void {
  if (initialized) return;
  initializeCompilerRuntime();
  initializeSignalRuntime();
  initializeIntlRuntime();
  initializeScopeRuntime();
  initializeButton();
  initializeUseQuery();
  initializeQueryRuntime();
  initializeAccountModels();
  initializeAuthentication();
  initializeApiClient();
  initializeFeatureGates();
  initializeAccountQueries();
  initializeCheckoutSelection();
  initializeWorkspaceCheckout();
  initializeSubscriptionQueries();
  initializeCheckoutPolicy();
  initializeCheckoutTelemetry();
  initializeAccountIntegrity();
  initializeCheckoutSession();
  initializeCheckoutPlanData();
  initializeCheckoutRoute();
  initializeCheckoutLoading();
  initializeCheckoutPage();
  initializeOfferQueries();
  initializePromoFunnel();
  initializeCreditPurchase();
  initializeWorkspaceName();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

function parsePlan(value: string | undefined): PurchasePlan | null {
  return value != null && VALID_PLANS.has(value as PurchasePlan)
    ? (value as PurchasePlan)
    : null;
}

function returnPath(search: URLSearchParams, preparation?: CheckoutPreparation): string {
  const offerReturnPath = search.get("offer_return_path");
  if (offerReturnPath?.startsWith("/pricing/offers")) return offerReturnPath;
  return preparation?.cancelHref ?? buildPricingRoute();
}

function seatCount(search: URLSearchParams): { premium: number; standard: number } | null {
  const standard = Number(search.get("standardSeats") ?? "0");
  const premium = Number(search.get("premiumSeats") ?? "0");
  if (!Number.isInteger(standard) || !Number.isInteger(premium)) return null;
  if (standard < 0 || premium < 0 || standard + premium < 1 || standard + premium > 200) return null;
  return { standard, premium };
}

function validCheckoutResponse(response: CheckoutResponse): void {
  if (!(response.tag === "custom_checkout_session") && response.url == null)
    throw Error("Checkout URL unavailable");
}

async function createCheckout(input: {
  accountId: string;
  appearance: "dark" | "light";
  cancelUrl: string;
  purchaseAttemptId: string;
  requestBody: Promise<Record<string, unknown>> | Record<string, unknown>;
  signal: AbortSignalLike;
}): Promise<CheckoutResponse> {
  const [requestBody, integrityHeaders] = await Promise.all([
    input.requestBody,
    getIntegrityHeaders("chatgpt_checkout"),
  ]);
  input.signal.throwIfAborted();
  return apiClient.safePost("/payments/checkout", {
    additionalHeaders: {
      ...integrityHeaders,
      "ChatGPT-Account-ID": input.accountId,
      [accountHeaderName]: input.accountId,
    },
    signal: input.signal,
    requestBody: {
      ...requestBody,
      checkout_appearance: input.appearance,
      cancel_url: input.cancelUrl,
      purchase_attempt_id: input.purchaseAttemptId,
    },
  });
}

function checkoutRoute(response: CheckoutResponse): string {
  const sessionId = typeof response.checkout_session_id === "string"
    ? response.checkout_session_id
    : "session";
  return `/checkout/${sessionId}`;
}

function planFromPromotion(promotion: PromotionState | null | undefined): string | null {
  return promotion?.metadata?.metadata?.plan_name ?? promotion?.metadata?.plan_name ?? null;
}

function CheckoutFlow({ accountId, plan, userId, location, preparation }: CheckoutFlowProps): unknown {
  const scope = useScope(applicationScope);
  const navigate = useNavigate();
  const darkMode = useDarkMode();
  const configuration = useConfiguration();
  const accountQuery = useAccount(undefined, ACCOUNT_QUERY_OPTIONS);
  const accountReady = !accountQuery.isLoading && !accountQuery.isError && accountQuery.data?.id === accountId;
  const account = accountReady ? accountQuery.data ?? null : null;
  const requiresSubscriptionCheck = plan !== "team" && account != null && account.plan_type !== "free";
  const subscriptionOptions = subscriptionQueryOptions<SubscriptionState>(accountId);
  const subscriptionQuery = useQuery<SubscriptionState>({
    ...subscriptionOptions,
    enabled: requiresSubscriptionCheck,
    staleTime: 0,
  });
  const subscriptionReady =
    accountReady &&
    (!requiresSubscriptionCheck ||
      (!subscriptionQuery.isPending && subscriptionQuery.error == null && subscriptionQuery.data != null));
  const purchaseEligible =
    subscriptionReady &&
    (!requiresSubscriptionCheck ||
      subscriptionQuery.data?.entitlement.has_active_subscription !== true ||
      subscriptionQuery.data?.last_active_subscription?.purchase_origin_platform === "chatgpt_no_payment_trial");
  const isTeam = plan === "team";
  const teamOwnerBlocked =
    isTeam &&
    account?.plan_type === "free_workspace" &&
    account.account_user_role !== "account-owner";
  const workspaceQuery = useSignalFamilyValue<string>(workspaceNameFamily, { accountId, userId });
  const workspaceName = resolveWorkspaceName(null, account?.plan_type === "free_workspace" ? account : null, workspaceQuery.data);
  const search = new URLSearchParams(location.search);
  const promoCode = search.get("promoCode");
  const referralCode = search.get("referralCode");
  const promotionCode = isTeam ? null : promoCode ?? referralCode;
  const promotionKind = promoCode == null ? "referral" : "promo";
  const promotionQuery = useQuery<PromotionState>({
    queryKey: ["purchase-promotion", accountId, userId, promotionKind, promotionCode],
    enabled: !isTeam && promotionCode != null,
    queryFn: ({ signal }: { signal: AbortSignalLike }) =>
      checkOffer({ accountId, code: promotionCode ?? "", kind: promotionKind, signal }),
    retry: false,
    staleTime: 0,
  });
  const eligiblePromotion =
    promotionCode == null ||
    (promotionQuery.data?.is_eligible === true &&
      planFromPromotion(promotionQuery.data) === PLAN_NAMES[plan]);
  const seats = seatCount(search);
  const shouldCreateWorkspace =
    isTeam &&
    accountReady &&
    account?.plan_type !== "free_workspace" &&
    seats == null &&
    configuration
      .getDynamicConfig("1069053961")
      .get("redirect_team_purchase_to_create_workspace", false);
  const request: Record<string, unknown> | null = isTeam
    ? accountReady && !teamOwnerBlocked && !shouldCreateWorkspace
      ? {
          entry_point: "team_workspace_purchase_modal",
          plan_name: PLAN_NAMES.team,
          team_plan_data: {
            workspace_name: workspaceName,
            price_interval: search.get("price_interval") ?? "month",
            existing_workspace_id: account?.plan_type === "free_workspace" ? account.id : undefined,
            seat_quantity: seats == null ? 1 : seats.standard + seats.premium,
            seat_quantities: seats?.premium
              ? [
                  { seat_type: "default", quantity: seats.standard },
                  { seat_type: "prolite", quantity: seats.premium },
                ]
              : undefined,
          },
        }
      : null
    : purchaseEligible && eligiblePromotion
      ? {
          plan_name: PLAN_NAMES[plan],
          promo_code: promoCode ?? undefined,
          referral_code: referralCode ?? undefined,
          promo_campaign: search.get("promo_campaign")?.trim() || undefined,
        }
      : null;
  if (request != null && preparation != null) {
    request.entry_point =
      request.entry_point ?? preparation.checkoutEntryPoint ?? checkoutEntryPoints.ALL_PLANS_PRICING_MODAL;
    if (plan === "plus" && preparation.upsellContextId != null)
      request.upsell_context_id = preparation.upsellContextId;
  }
  const purchaseAttemptId = React.useRef(crypto.randomUUID());
  const cancelUrl = new URL(
    returnPath(search, preparation),
    typeof window === "undefined" ? "https://chatgpt.com" : window.location.origin,
  ).href;
  const checkoutQuery = useQuery<CheckoutResponse>({
    queryKey: ["subscription-checkout-create", purchaseAttemptId.current, location.pathname, request],
    enabled: request != null && !shouldCreateWorkspace,
    queryFn: async ({ signal }: { signal: AbortSignalLike }) => {
      if (request == null) throw Error("Checkout selection missing");
      const checkoutUiMode = resolveCheckoutUiMode(request, {
        isServerOwnedModeEnabled: () => configuration.checkGate("2065253865"),
        isCustomModeEnabled: (gate: string) =>
          configuration.getDynamicConfig("3950229590").get(gate, true),
      });
      const response = await createCheckout({
        accountId,
        requestBody: { ...request, checkout_ui_mode: checkoutUiMode },
        appearance: darkMode ? "dark" : "light",
        cancelUrl,
        purchaseAttemptId: purchaseAttemptId.current,
        signal,
      });
      signal.throwIfAborted();
      validCheckoutResponse(response);
      if (promotionCode != null)
        recordPromoApplied({
          accountId,
          location: "PricingColumnPrimaryCtaButton",
          promoCode: promoCode ?? undefined,
          referralCode: referralCode ?? undefined,
        });
      if (!signal.aborted && preparation != null)
        await preparation.onPrepared(response, request);
      return response;
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const checkoutUnavailable =
    location.search.includes("beacon_upgrade=1") ||
    (typeof checkoutQuery.error === "object" &&
      checkoutQuery.error != null &&
      "status" in checkoutQuery.error &&
      checkoutQuery.error.status === 403);
  const resolvedReturnPath = returnPath(search, preparation);
  if (checkoutUnavailable)
    return jsx.jsx(CheckoutReturn, {
      returnPath: resolvedReturnPath,
      children: jsx.jsx("p", {
        role: "alert",
        children: jsx.jsx(FormattedMessage, {
          id: "checkout.unavailable",
          defaultMessage: "Checkout isn’t available for this account right now. Close checkout to choose another plan or switch accounts.",
          description: "Checkout account denied",
        }),
      }),
    });
  if (shouldCreateWorkspace)
    return jsx.jsx(Redirect, { to: `/create-workspace${location.search}`, replace: true });
  if (!isTeam && !subscriptionReady)
    return jsx.jsx(CheckoutLoadingState, {
      returnPath: resolvedReturnPath,
      loadingContent: preparation?.loadingContent,
      loading: accountQuery.isLoading || (requiresSubscriptionCheck && subscriptionQuery.isPending),
      error: subscriptionQuery.error,
      onRetry: () => {
        if (accountReady) void subscriptionQuery.refetch();
        else scope.queryClient.invalidateQueries({ queryKey: ["accounts", "check"] });
      },
    });
  if (!isTeam && !purchaseEligible) {
    const pricingSearch = new URLSearchParams(location.search);
    pricingSearch.set("plan", plan);
    return jsx.jsx(Redirect, {
      to: buildPricingRoute({ search: `?${pricingSearch}` }),
      state: location.state,
      replace: true,
    });
  }
  if (teamOwnerBlocked) return jsx.jsx(Redirect, { to: buildPricingRoute(), replace: true });
  if (promotionCode != null && promotionQuery.isPending)
    return jsx.jsx(CheckoutLoadingState, {
      returnPath: resolvedReturnPath,
      loadingContent: preparation?.loadingContent,
      loading: true,
      onRetry: () => void promotionQuery.refetch(),
    });
  if (promotionCode != null && (promotionQuery.error != null || !eligiblePromotion))
    return jsx.jsxs(CheckoutReturn, {
      returnPath: resolvedReturnPath,
      children: [
        jsx.jsx("p", {
          role: "alert",
          children: jsx.jsx(FormattedMessage, {
            id: "checkout.offerUnavailable",
            defaultMessage: "This promotion isn’t available for this checkout",
            description: "Invalid promotion before checkout",
          }),
        }),
        promotionQuery.error == null
          ? null
          : jsx.jsx(Button, {
              onClick: () => void promotionQuery.refetch(),
              children: jsx.jsx(FormattedMessage, {
                id: "checkout.offers.retry",
                defaultMessage: "Try again",
                description: "Retry promotion eligibility",
              }),
            }),
      ],
    });
  if (checkoutQuery.data != null) {
    if (preparation != null && request != null) return preparation.loadingContent;
    if (checkoutQuery.data.tag === "custom_checkout_session")
      return jsx.jsx(Redirect, {
        to: `${checkoutRoute(checkoutQuery.data)}${location.search}`,
        state: {
          checkoutRequest: request ?? undefined,
          checkoutLoadingValuePropMessages: location.state?.checkoutLoadingValuePropMessages,
        },
        replace: true,
      });
    if (checkoutQuery.data.url != null)
      return jsx.jsx(HostedCheckout, { url: checkoutQuery.data.url, returnPath: resolvedReturnPath });
  }
  return jsx.jsx(CheckoutLoadingState, {
    returnPath: resolvedReturnPath,
    loadingContent: preparation?.loadingContent,
    loading: checkoutQuery.isPending,
    error: checkoutQuery.error,
    onRetry: () => {
      resetCheckoutAttempt(scope, purchaseAttemptId.current);
      void checkoutQuery.refetch();
    },
  });
}

function PricingCheckoutPreparation(props: PricingCheckoutPreparationProps): unknown {
  const currentLocation = useLocation();
  const { accountId, userId } = useSessionIdentity();
  const routeUrl = new URL(props.route, "https://chatgpt.com");
  const plan = parsePlan(routeUrl.pathname.split("/").at(-1));
  if (plan == null)
    return jsx.jsx(Redirect, { to: buildPricingRoute(), replace: true });
  if (accountId == null || userId == null) return props.loadingContent;
  const location = {
    ...currentLocation,
    pathname: routeUrl.pathname,
    search: routeUrl.search,
  };
  const preparation: CheckoutPreparation = {
    cancelHref: props.cancelHref,
    onPrepared: props.onPrepared,
    loadingContent: props.loadingContent,
    upsellContextId: props.upsellContextId,
    checkoutEntryPoint: props.checkoutEntryPoint,
    pricingCheckoutId: props.pricingCheckoutId,
  };
  const key = `${userId}:${accountId}:${props.route}`;
  return jsx.jsx(CheckoutFlow, { accountId, plan, userId, location, preparation }, key);
}

function PurchasePage(): unknown {
  const { plan: routePlan } = useRouteParams();
  const location = useLocation();
  const { accountId, userId } = useSessionIdentity();
  if (routePlan === "credits") return jsx.jsx(CreditPurchasePage, {});
  const plan = parsePlan(routePlan);
  if (plan == null) return jsx.jsx(Redirect, { to: buildPricingRoute(), replace: true });
  if (accountId == null || userId == null)
    return jsx.jsx(CheckoutLoadingState, { loading: true, onRetry: () => undefined });
  const key = `${userId}:${accountId}:${plan}`;
  return jsx.jsx(CheckoutFlow, { accountId, plan, userId, location }, key);
}

initializePurchasePage();
export { PricingCheckoutPreparation, PurchasePage };
