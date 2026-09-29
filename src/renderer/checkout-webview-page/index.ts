import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as surfaceChunk from "@rchunk/surface";

type CheckoutLoadState = "failed" | "loading" | "ready";
type CheckoutCacheState = "available" | "discarded" | "presented";
type CurrentPlan = "free" | "go" | "plus" | "pro" | "prolite";

interface CheckoutQuery {
  accountId?: string;
  currentPlan?: CurrentPlan;
  url: string;
}
interface ParseResult {
  data?: CheckoutQuery;
  success: boolean;
}
interface PricingCacheState {
  generation: number;
  loadState: CheckoutLoadState;
  retryCount: number;
  search: string | null;
  state: CheckoutCacheState;
  userId?: string;
}
interface Account {
  id: string;
  plan_type?: string | null;
  structure: string;
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}
interface ReactRuntime {
  useEffect(
    effect: () => (() => void) | void,
    dependencies: readonly unknown[],
  ): void;
  useLayoutEffect(
    effect: () => (() => void) | void,
    dependencies: readonly unknown[],
  ): void;
  useRef<Value>(initialValue: Value): { current: Value };
  useState<Value>(
    initialValue: Value,
  ): [Value, (value: Value | ((previous: Value) => Value)) => void];
}
interface WebviewEvent {
  errorCode?: number;
  isMainFrame?: boolean;
  url?: string;
  validatedURL?: string;
}
interface WebviewElement {
  addEventListener(name: string, listener: (event: WebviewEvent) => void): void;
  getURL(): string;
  isLoading(): boolean;
  reloadIgnoringCache(): void;
  removeEventListener(
    name: string,
    listener: (event: WebviewEvent) => void,
  ): void;
}
interface ScopeApi {
  get(family: unknown, partition: string): PricingCacheState;
  set(family: unknown, partition: string, value: PricingCacheState): void;
}
interface Experiment {
  get<Value>(key: string, fallback: Value): Value;
}
interface TelemetrySession {}
interface Schema {
  safeParse(value: unknown): ParseResult;
}
interface SurfaceProps {
  isLoading: boolean;
  partition: string;
  src: string;
  webviewRef(element: unknown): void;
}

const sharedRuntime = appSharedChunk as unknown as {
  $3?(): void;
  BX?<Value>(family: unknown, partition: string): Value;
  CG?: string;
  FX?(): void;
  G3?: {
    dispatchMessage(type: string, payload: Record<string, unknown>): void;
  };
  H4?(shape: Record<string, unknown>): Schema;
  HX?<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  LX?(scope: unknown): ScopeApi;
  NX?: string;
  Q4?(): unknown;
  QI?(): void;
  SG?: string;
  W3?(): void;
  ZI?: unknown;
  __?<Handler extends (...arguments_: never[]) => unknown>(
    handler: Handler,
  ): Handler;
  e6(): ReactRuntime;
  g4?(): void;
  g_?(): void;
  h4?(): void;
  m4?(...values: unknown[]): string;
  oZ?(scope: unknown, initialValue: () => PricingCacheState): unknown;
  q4?(): { min(length: number): { optional(): unknown } };
  wL?(): void;
  x4?(values: readonly string[]): { optional(): unknown };
  xG?: string;
};
const initialRuntime = appInitialChunk as unknown as {
  II?(): void;
  Kzt?(signal: unknown): boolean;
  LI?(options: { logExposure: boolean }): () => string;
  M6t?(): void;
  MP?(): void;
  N6t?(): {
    authMethod?: string | null;
    isLoading?: boolean;
    userId?: string | null;
  };
  Qgn?(): void;
  Udn?(): void;
  Vzt?(): void;
  Wdn?(): boolean;
  Ygn?: (props: { replace: boolean; to: string }) => unknown;
  c$t?: unknown;
  d_n?(): [URLSearchParams];
  dfn?(): boolean;
  h0?(): void;
  i_n?(): { pathname: string; search: string };
  ifn?(): void;
  jP?: unknown;
  l$t?(): void;
  lfn?(): TelemetrySession;
  rfn?(
    session: TelemetrySession | undefined,
    experimentId: string,
    options: { disableExposureLog: boolean },
  ): Experiment;
  rht?(): void;
  uht?(): { data?: Account; isLoading: boolean };
};
const webviewRuntime = surfaceChunk as unknown as {
  n?(): void;
  t?: (props: SurfaceProps) => unknown;
};

const {
  $3: initializeSharedRuntime,
  BX: useSignalFamilyValue,
  CG: pricingPartitionPrefix,
  FX: initializeSignalRuntime,
  G3: messageBridge,
  H4: objectSchema,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  NX: codexWebUrl,
  Q4: urlSchema,
  QI: initializeSharedQueries,
  SG: creditPartitionPrefix,
  W3: initializeMessageBridge,
  ZI: appScope,
  __: useStableCallback,
  e6: getReactRuntime,
  g4: initializeDialogRuntime,
  g_: initializeStableCallback,
  h4: initializeClassNames,
  m4: classNames,
  oZ: createSignalFamily,
  q4: stringSchema,
  wL: initializeWebRuntime,
  x4: enumSchema,
  xG: defaultCheckoutPartition,
} = sharedRuntime;
const {
  II: initializeCheckoutRuntime,
  Kzt: useBooleanSignal,
  LI: useCheckoutUrl,
  M6t: initializeAccountState,
  MP: initializeCheckoutQueries,
  N6t: useAccountState,
  Qgn: initializeQueries,
  Udn: initializeAccountQueries,
  Vzt: initializeCheckoutState,
  Wdn: isUnsupportedEnvironment,
  Ygn: Navigate,
  c$t: authOriginSignal,
  d_n: useSearchParams,
  dfn: useStatsigLoading,
  h0: initializeCheckoutNavigation,
  i_n: useLocation,
  ifn: initializeRouteState,
  jP: creditCheckoutSignal,
  l$t: initializeTelemetry,
  lfn: useTelemetrySession,
  rfn: experimentForSession,
  rht: initializeWorkspaceRuntime,
  uht: useCurrentAccount,
} = initialRuntime;
const { n: initializeWebviewSurface, t: WebviewSurface } = webviewRuntime;

initializeSharedRuntime?.();
initializeClassNames?.();
initializeSignalRuntime?.();
initializeWebRuntime?.();
const React = getReactRuntime();
initializeQueries?.();
initializeDialogRuntime?.();
initializeAccountState?.();
initializeWorkspaceRuntime?.();
initializeAccountQueries?.();
initializeCheckoutState?.();
initializeWebviewSurface?.();
initializeCheckoutRuntime?.();
initializeCheckoutQueries?.();
initializeTelemetry?.();
initializeMessageBridge?.();
initializeSharedQueries?.();
initializeRouteState?.();
initializeStableCallback?.();
initializeCheckoutNavigation?.();
const jsx = getJsxRuntime();

const querySchema = objectSchema?.({
  accountId: stringSchema?.().min(1).optional() ?? {},
  currentPlan:
    enumSchema?.(["free", "go", "plus", "prolite", "pro"]).optional() ?? {},
  url: urlSchema?.() ?? {},
});
const codexUrl = new URL(codexWebUrl ?? "https://chatgpt.com/codex");
const codexOrigin = codexUrl.origin;
const codexPurchasePath = `${codexUrl.pathname}/purchase/`;
const creditPurchasePath = `${codexPurchasePath}credits`;
const paymentOrigin = "https://pay.openai.com";
const paymentPath = "/c/pay/";
const checkoutPath = "/checkout/";
const successPaths = new Set([
  "/payments/success",
  "/payments/success-ind",
  "/payments/success-credit-purchase",
  "/payments/success-rate-limit-reset",
]);
const teamSuccessPath = "/payments/success-team";
const pricingPath = "/pricing/";
const rootPath = "/";
const pricingHash = "#pricing";
const pricingRetryDelays = [1_000, 3_000, 10_000] as const;
const creditRetryDelays = [5_000, 10_000, 20_000] as const;
const checkoutExperimentId = "1112993408";
let pricingPartition: string | null = null;
let creditPartition: string | null = null;
let cachedPricingWebview: WebviewElement | null = null;
const pricingStateFamily =
  createSignalFamily?.(appScope, () => initialPricingState()) ??
  Symbol("checkout-pricing-state");

function initialPricingState(): PricingCacheState {
  return {
    generation: 0,
    loadState: "loading",
    retryCount: 0,
    search: null,
    state: "available",
    userId: undefined,
  };
}
function getPricingPartition(): string {
  pricingPartition ??= `${pricingPartitionPrefix ?? "persist:checkout-pricing-"}${crypto.randomUUID()}`;
  return pricingPartition;
}
function getCreditPartition(): string {
  creditPartition ??= `${creditPartitionPrefix ?? "persist:checkout-credit-"}${crypto.randomUUID()}`;
  return creditPartition;
}

function parseCheckoutQuery(params: URLSearchParams): ParseResult {
  if (querySchema != null)
    return querySchema.safeParse(Object.fromEntries(params.entries()));
  const url = params.get("url");
  if (url == null) return { success: false };
  try {
    new URL(url);
  } catch {
    return { success: false };
  }
  const accountId = params.get("accountId") ?? undefined;
  const currentPlanValue = params.get("currentPlan");
  const currentPlan =
    currentPlanValue == null
      ? undefined
      : normalizeCurrentPlan(currentPlanValue);
  if (currentPlanValue != null && currentPlan == null)
    return { success: false };
  return { success: true, data: { accountId, currentPlan, url } };
}

function CheckoutWebviewPage(): unknown {
  const [params] = useSearchParams?.() ?? [new URLSearchParams()];
  const parsed = parseCheckoutQuery(params);
  if (parsed.success && parsed.data != null) {
    const url = new URL(parsed.data.url);
    if (isPricingUrl(url) || url.pathname === creditPurchasePath) return null;
  }
  return jsx.jsx(CheckoutWebview, { search: params.toString() });
}

function CheckoutPricingWebviewHost(): unknown {
  const scope = useScope?.(appScope);
  const authOriginQuery =
    useSignalValue?.<{
      data?: { chatGptDesktopAuthOrigin?: string };
      isLoading?: boolean;
    }>(authOriginSignal) ?? {};
  const authOrigin =
    authOriginQuery.data?.chatGptDesktopAuthOrigin ?? codexOrigin;
  const {
    authMethod,
    isLoading: authLoading = false,
    userId,
  } = useAccountState?.() ?? {};
  const { data: account, isLoading: accountLoading = false } =
    useCurrentAccount?.() ?? { isLoading: false };
  const location = useLocation?.() ?? { pathname: "/", search: "" };
  const telemetry = useTelemetrySession?.();
  const statsigLoading = useStatsigLoading?.() ?? false;
  const checkoutUrl = useCheckoutUrl?.({ logExposure: false });
  const partition = getPricingPartition();
  const routeSearch =
    location.pathname === "/checkout/web" ? location.search : null;
  const routeParsed =
    routeSearch == null
      ? null
      : parseCheckoutQuery(new URLSearchParams(routeSearch));
  const pricingRouteSearch =
    routeParsed?.success === true &&
    routeParsed.data != null &&
    isPricingUrl(new URL(routeParsed.data.url))
      ? routeSearch
      : null;

  React.useLayoutEffect(() => {
    if (authOriginQuery.isLoading === true) return;
    const url =
      pricingRouteSearch == null
        ? null
        : new URLSearchParams(pricingRouteSearch).get("url");
    messageBridge?.dispatchMessage("checkout-webview-presentation-changed", {
      partition,
      url: rebaseUrl(url, authOrigin),
    });
    return () =>
      messageBridge?.dispatchMessage("checkout-webview-presentation-changed", {
        partition,
        url: null,
      });
  }, [authOrigin, authOriginQuery.isLoading, partition, pricingRouteSearch]);

  const eligiblePrewarmSearch =
    !isUnsupportedEnvironment?.() &&
    authMethod === "chatgpt" &&
    !authLoading &&
    userId != null &&
    !statsigLoading &&
    account?.structure === "personal" &&
    experimentForSession?.(telemetry, checkoutExperimentId, {
      disableExposureLog: true,
    }).get<boolean>("use_embedded_checkout", false) === true &&
    checkoutUrl != null
      ? buildPricingSearch({
          currentPlan: normalizeCurrentPlan(account.plan_type),
          url: checkoutUrl(),
        })
      : null;
  const desiredSearch = pricingRouteSearch ?? eligiblePrewarmSearch;
  const desiredCacheKey =
    desiredSearch == null ? null : checkoutCacheKey(desiredSearch, userId);
  const stored =
    useSignalFamilyValue?.<PricingCacheState>(pricingStateFamily, partition) ??
    initialPricingState();
  const cachedCacheKey =
    stored.search == null
      ? null
      : checkoutCacheKey(stored.search, stored.userId);
  const nonPricingCheckoutRoute =
    routeSearch != null && pricingRouteSearch == null;
  const matchingCachedPricingRoute =
    pricingRouteSearch != null &&
    stored.search != null &&
    (stored.loadState !== "failed" || stored.state === "presented") &&
    stored.state !== "discarded" &&
    checkoutCacheKey(pricingRouteSearch, userId) === cachedCacheKey;

  const onPricingLoadStateChange = (loadState: CheckoutLoadState) => {
    if (scope == null) return;
    const current = scope.get(pricingStateFamily, partition);
    if (
      current.generation !== stored.generation ||
      current.search !== stored.search ||
      current.loadState === loadState
    )
      return;
    scope.set(pricingStateFamily, partition, {
      ...current,
      loadState,
      retryCount: loadState === "ready" ? 0 : current.retryCount,
    });
    if (loadState !== "failed" || current.state === "discarded") return;
    const delay = pricingRetryDelays[current.retryCount];
    if (delay == null) return;
    window.setTimeout(() => {
      const latest = scope.get(pricingStateFamily, partition);
      if (
        latest.generation !== current.generation ||
        latest.search !== current.search ||
        latest.state === "discarded" ||
        latest.loadState !== "failed"
      )
        return;
      scope.set(pricingStateFamily, partition, {
        ...latest,
        generation: latest.generation + 1,
        loadState: "loading",
        retryCount: latest.retryCount + 1,
      });
    }, delay);
  };

  React.useLayoutEffect(() => {
    if (scope == null) return;
    const current = scope.get(pricingStateFamily, partition);
    const next = transitionPricingState(current, {
      cachedCacheKey,
      desiredCacheKey,
      desiredSearch,
      hasPricingRoute: pricingRouteSearch != null,
      isAuthLoading: authLoading,
      isCurrentAccountLoading: accountLoading,
      isMatchingCachedPricingRoute: matchingCachedPricingRoute,
      isNonPricingCheckoutRoute: nonPricingCheckoutRoute,
      isStatsigLoading: statsigLoading,
      userId: userId ?? undefined,
    });
    if (next !== current) scope.set(pricingStateFamily, partition, next);
  }, [
    accountLoading,
    authLoading,
    cachedCacheKey,
    desiredCacheKey,
    desiredSearch,
    matchingCachedPricingRoute,
    nonPricingCheckoutRoute,
    partition,
    pricingRouteSearch,
    scope,
    statsigLoading,
    userId,
  ]);

  if (pricingRouteSearch != null && !matchingCachedPricingRoute)
    return jsx.jsx("div", {
      className: "fixed inset-0 z-30",
      children: jsx.jsx(
        CheckoutWebview,
        { partition, search: pricingRouteSearch },
        checkoutCacheKey(pricingRouteSearch, userId) ?? undefined,
      ),
    });
  if (stored.search == null) return null;
  const hidden = !matchingCachedPricingRoute;
  return jsx.jsx("div", {
    "aria-hidden": hidden,
    inert: hidden,
    className:
      classNames?.(
        "fixed inset-0 z-30",
        hidden ? "pointer-events-none invisible" : false,
      ) ?? "fixed inset-0 z-30",
    children: jsx.jsx(
      CheckoutWebview,
      {
        forcePricingRefreshInBackground: hidden,
        onPricingWebviewLoadStateChange: onPricingLoadStateChange,
        partition,
        search: stored.search,
      },
      `${cachedCacheKey}|${stored.generation}`,
    ),
  });
}

function CheckoutCreditWebviewHost(): unknown {
  const authOriginQuery =
    useSignalValue?.<{
      data?: { chatGptDesktopAuthOrigin?: string };
      isLoading?: boolean;
    }>(authOriginSignal) ?? {};
  const authOrigin =
    authOriginQuery.data?.chatGptDesktopAuthOrigin ?? codexOrigin;
  const {
    authMethod,
    isLoading: authLoading = false,
    userId,
  } = useAccountState?.() ?? {};
  const { data: account } = useCurrentAccount?.() ?? { isLoading: false };
  const location = useLocation?.() ?? { pathname: "/", search: "" };
  const telemetry = useTelemetrySession?.();
  const statsigLoading = useStatsigLoading?.() ?? false;
  const creditEnabled = useBooleanSignal?.(creditCheckoutSignal) ?? false;
  const partition = getCreditPartition();
  const routeParsed =
    location.pathname === "/checkout/web"
      ? parseCheckoutQuery(new URLSearchParams(location.search))
      : null;
  const isCreditRoute =
    routeParsed?.success === true &&
    routeParsed.data != null &&
    new URL(routeParsed.data.url).pathname === creditPurchasePath;
  const routeUrl =
    isCreditRoute && routeParsed?.data != null ? routeParsed.data.url : null;
  const creditUrl = new URL(creditPurchasePath, codexOrigin);
  creditUrl.searchParams.set("source", "codex-embedded-checkout");
  const prewarmSearch = new URLSearchParams({
    url: creditUrl.toString(),
    accountId: "personal",
  }).toString();
  const search = isCreditRoute
    ? new URLSearchParams(location.search).toString()
    : prewarmSearch;

  React.useLayoutEffect(() => {
    if (authOriginQuery.isLoading === true) return;
    messageBridge?.dispatchMessage("checkout-webview-presentation-changed", {
      partition,
      url: rebaseUrl(routeUrl, authOrigin),
    });
    return () =>
      messageBridge?.dispatchMessage("checkout-webview-presentation-changed", {
        partition,
        url: null,
      });
  }, [authOrigin, authOriginQuery.isLoading, partition, routeUrl]);

  const eligible =
    !isUnsupportedEnvironment?.() &&
    authMethod === "chatgpt" &&
    !authLoading &&
    userId != null &&
    !statsigLoading &&
    account?.structure === "personal" &&
    creditEnabled &&
    experimentForSession?.(telemetry, checkoutExperimentId, {
      disableExposureLog: true,
    }).get<boolean>("use_embedded_credit_checkout", false) === true;
  if (!isCreditRoute && !eligible) return null;
  const hidden = !isCreditRoute;
  return jsx.jsx("div", {
    "aria-hidden": hidden,
    inert: hidden,
    className:
      classNames?.(
        "fixed inset-0 z-30",
        hidden ? "pointer-events-none invisible" : false,
      ) ?? "fixed inset-0 z-30",
    children: jsx.jsx(
      CheckoutWebview,
      { isPrewarm: hidden, partition, search },
      `${userId ?? ""}|${search}`,
    ),
  });
}

function transitionPricingState(
  state: PricingCacheState,
  input: {
    cachedCacheKey: string | null;
    desiredCacheKey: string | null;
    desiredSearch: string | null;
    hasPricingRoute: boolean;
    isAuthLoading: boolean;
    isCurrentAccountLoading: boolean;
    isMatchingCachedPricingRoute: boolean;
    isNonPricingCheckoutRoute: boolean;
    isStatsigLoading: boolean;
    userId?: string;
  },
): PricingCacheState {
  if (input.isNonPricingCheckoutRoute)
    return state.search == null && state.state === "discarded"
      ? state
      : { ...state, loadState: "loading", search: null, state: "discarded" };
  if (input.hasPricingRoute) {
    if (input.desiredCacheKey === input.cachedCacheKey)
      return !input.isMatchingCachedPricingRoute || state.state === "presented"
        ? state
        : { ...state, state: "presented" };
    return {
      generation: state.generation + 1,
      loadState: "loading",
      retryCount: 0,
      search: input.desiredSearch,
      state: "presented",
      userId: input.userId,
    };
  }
  let {
    generation,
    loadState,
    retryCount,
    search,
    state: cacheState,
    userId,
  } = state;
  if (cacheState === "presented") {
    const cachedUrl =
      cachedPricingWebview == null
        ? null
        : safeWebviewUrl(cachedPricingWebview);
    if (cachedUrl == null || !isPricingUrl(cachedUrl)) {
      generation += 1;
      loadState = "loading";
      retryCount = 0;
    }
    cacheState = "available";
  } else if (cacheState === "discarded") {
    loadState = "loading";
    retryCount = 0;
    cacheState = "available";
  }
  if (
    input.desiredSearch != null &&
    input.desiredCacheKey !== input.cachedCacheKey
  ) {
    loadState = "loading";
    retryCount = 0;
    search = input.desiredSearch;
    cacheState = "available";
    userId = input.userId;
  } else if (
    input.desiredSearch == null &&
    search != null &&
    !input.isAuthLoading &&
    !input.isCurrentAccountLoading &&
    !input.isStatsigLoading
  ) {
    loadState = "loading";
    retryCount = 0;
    search = null;
    userId = undefined;
  }
  return generation === state.generation &&
    loadState === state.loadState &&
    retryCount === state.retryCount &&
    search === state.search &&
    cacheState === state.state &&
    userId === state.userId
    ? state
    : { generation, loadState, retryCount, search, state: cacheState, userId };
}

function CheckoutWebview({
  forcePricingRefreshInBackground = false,
  isPrewarm = false,
  onPricingWebviewLoadStateChange,
  partition = defaultCheckoutPartition ?? "persist:checkout",
  search,
}: {
  forcePricingRefreshInBackground?: boolean;
  isPrewarm?: boolean;
  onPricingWebviewLoadStateChange?(state: CheckoutLoadState): void;
  partition?: string;
  search: string;
}): unknown {
  const authOriginQuery =
    useSignalValue?.<{
      data?: { chatGptDesktopAuthOrigin?: string };
      isLoading?: boolean;
    }>(authOriginSignal) ?? {};
  const authOrigin =
    authOriginQuery.data?.chatGptDesktopAuthOrigin ?? codexOrigin;
  const [isLoading, setIsLoading] = React.useState(true);
  const [webview, setWebview] = React.useState<WebviewElement | null>(null);
  const failedNavigation = React.useRef(false);
  const parsed = parseCheckoutQuery(new URLSearchParams(search));
  const checkoutRoutePath =
    parsed.success && parsed.data != null
      ? checkoutRoute(new URL(parsed.data.url))
      : null;
  const pricing =
    parsed.success && parsed.data != null
      ? isPricingUrl(new URL(parsed.data.url))
      : false;
  const credit =
    parsed.success &&
    parsed.data != null &&
    new URL(parsed.data.url).pathname === creditPurchasePath;
  const setWebviewRef =
    useStableCallback?.((element: unknown) => {
      const candidate = isWebviewElement(element) ? element : null;
      failedNavigation.current = false;
      if (pricing) cachedPricingWebview = candidate;
      setWebview(candidate);
    }) ??
    ((element: unknown) => {
      const candidate = isWebviewElement(element) ? element : null;
      failedNavigation.current = false;
      if (pricing) cachedPricingWebview = candidate;
      setWebview(candidate);
    });

  React.useEffect(() => {
    if (webview == null) return;
    let disposed = false;
    let backgroundRetryIndex = 0;
    let backgroundTimer: number | null = null;
    let creditRetryIndex = 0;
    let creditTimer: number | null = null;
    const scheduleBackgroundRefresh = () => {
      if (
        !forcePricingRefreshInBackground ||
        backgroundTimer != null ||
        pricingReady(webview)
      )
        return;
      const delay = creditRetryDelays[backgroundRetryIndex];
      if (delay == null) return;
      backgroundTimer = window.setTimeout(() => {
        backgroundTimer = null;
        if (disposed || pricingReady(webview)) return;
        if (webview.isLoading()) {
          scheduleBackgroundRefresh();
          return;
        }
        backgroundRetryIndex += 1;
        webview.reloadIgnoringCache();
        scheduleBackgroundRefresh();
      }, delay);
    };
    const hideLoading = () => {
      if (!disposed) {
        if (creditTimer != null) {
          window.clearTimeout(creditTimer);
          creditTimer = null;
        }
        setIsLoading(false);
      }
    };
    const showLoading = () => {
      if (!disposed) setIsLoading(true);
    };
    const isAuthNavigation = (event: WebviewEvent) => {
      if (event.isMainFrame === false) return false;
      const url = safeUrl(event.url);
      if (url == null || !isSuccessUrl(url, authOrigin)) return false;
      showLoading();
      return true;
    };
    const finish = () => {
      if (failedNavigation.current) return;
      const url = safeWebviewUrl(webview);
      if (
        url == null ||
        url.protocol === "about:" ||
        isSuccessUrl(url, authOrigin)
      )
        return;
      if (url.pathname === teamSuccessPath) {
        if (!webview.isLoading()) hideLoading();
        return;
      }
      if (pricing) {
        if (!pricingReady(webview)) {
          onPricingWebviewLoadStateChange?.("loading");
          scheduleBackgroundRefresh();
          return;
        }
        onPricingWebviewLoadStateChange?.("ready");
        hideLoading();
        return;
      }
      if (isPaymentProviderUrl(url)) {
        if (!webview.isLoading()) hideLoading();
        return;
      }
      if (checkoutRoutePath != null) {
        if (url.pathname !== checkoutRoutePath || webview.isLoading()) return;
        hideLoading();
        return;
      }
      if (isAllowedCheckoutUrl(url, authOrigin) && !webview.isLoading())
        hideLoading();
    };
    const onStart = (event: WebviewEvent) => {
      if (event.isMainFrame !== false) {
        failedNavigation.current = false;
        if (creditTimer != null) {
          window.clearTimeout(creditTimer);
          creditTimer = null;
        }
        if (pricing) onPricingWebviewLoadStateChange?.("loading");
        isAuthNavigation(event);
      }
    };
    const onFailure = (event: WebviewEvent) => {
      if (event.isMainFrame === false || event.errorCode === -3) return;
      failedNavigation.current = true;
      if (pricing) {
        onPricingWebviewLoadStateChange?.("failed");
        showLoading();
        return;
      }
      if (!credit || isPrewarm || creditTimer != null) return;
      const failedUrl = safeUrl(event.validatedURL);
      if (
        failedUrl == null ||
        !(
          (failedUrl.origin === authOrigin &&
            failedUrl.pathname === creditPurchasePath) ||
          isPaymentProviderUrl(failedUrl)
        )
      )
        return;
      const delay = pricingRetryDelays[creditRetryIndex];
      if (delay == null) {
        hideLoading();
        return;
      }
      showLoading();
      creditTimer = window.setTimeout(() => {
        creditTimer = null;
        const current = safeWebviewUrl(webview);
        if (
          !disposed &&
          !webview.isLoading() &&
          current != null &&
          current.origin === failedUrl.origin &&
          current.pathname === failedUrl.pathname
        ) {
          creditRetryIndex += 1;
          webview.reloadIgnoringCache();
        }
      }, delay);
    };
    const onNavigateInPage = (event: WebviewEvent) => {
      if (!isAuthNavigation(event)) finish();
    };
    for (const eventName of [
      "dom-ready",
      "did-finish-load",
      "did-stop-loading",
    ])
      webview.addEventListener(eventName, finish);
    webview.addEventListener("did-start-navigation", onStart);
    webview.addEventListener("did-fail-load", onFailure);
    webview.addEventListener("did-navigate-in-page", onNavigateInPage);
    finish();
    return () => {
      disposed = true;
      if (backgroundTimer != null) window.clearTimeout(backgroundTimer);
      if (creditTimer != null) window.clearTimeout(creditTimer);
      for (const eventName of [
        "dom-ready",
        "did-finish-load",
        "did-stop-loading",
      ])
        webview.removeEventListener(eventName, finish);
      webview.removeEventListener("did-start-navigation", onStart);
      webview.removeEventListener("did-fail-load", onFailure);
      webview.removeEventListener("did-navigate-in-page", onNavigateInPage);
    };
  }, [
    authOrigin,
    checkoutRoutePath,
    credit,
    forcePricingRefreshInBackground,
    isPrewarm,
    onPricingWebviewLoadStateChange,
    pricing,
    webview,
  ]);

  if (authOriginQuery.isLoading === true) return null;
  if (!parsed.success || parsed.data == null)
    return jsx.jsx(Navigate ?? "a", { to: "/pricing-plan", replace: true });
  const target = new URL(parsed.data.url);
  if (!isAllowedCheckoutUrl(target, authOrigin))
    return jsx.jsx(Navigate ?? "a", { to: "/pricing-plan", replace: true });
  const src = new URL("about:blank");
  src.searchParams.set(
    "toUrl",
    `${target.pathname}${target.search}${target.hash}`,
  );
  if (parsed.data.accountId != null)
    src.searchParams.set("accountId", parsed.data.accountId);
  if (parsed.data.currentPlan != null)
    src.searchParams.set("currentPlan", parsed.data.currentPlan);
  if (isPrewarm) src.searchParams.set("prewarm", "true");
  return jsx.jsx(WebviewSurface ?? "webview", {
    isLoading,
    partition,
    src: src.toString(),
    webviewRef: setWebviewRef,
  });
}

function buildPricingSearch({
  currentPlan,
  url,
}: {
  currentPlan?: CurrentPlan;
  url: string;
}): string {
  const target = new URL(url);
  target.searchParams.set("source", "codex-embedded-checkout");
  const params = new URLSearchParams({
    accountId: "personal",
    url: target.toString(),
  });
  if (currentPlan != null) params.set("currentPlan", currentPlan);
  return params.toString();
}
function checkoutCacheKey(
  search: string,
  userId: string | null | undefined,
): string | null {
  const parsed = parseCheckoutQuery(new URLSearchParams(search));
  if (!parsed.success || parsed.data == null) return null;
  const url = new URL(parsed.data.url);
  if (!isPricingUrl(url)) return null;
  url.searchParams.sort();
  return [
    userId ?? "",
    url.origin,
    url.pathname,
    url.search,
    url.hash,
    parsed.data.accountId ?? "",
    parsed.data.currentPlan ?? "",
  ].join("|");
}
function normalizeCurrentPlan(
  value: string | null | undefined,
): CurrentPlan | undefined {
  switch (value) {
    case "free":
    case "go":
    case "plus":
    case "prolite":
    case "pro":
      return value;
    default:
      return undefined;
  }
}
function rebaseUrl(value: string | null, origin: string): string | null {
  if (value == null) return null;
  const url = new URL(value);
  return new URL(`${url.pathname}${url.search}${url.hash}`, origin).toString();
}
function isAllowedCheckoutUrl(url: URL, authOrigin: string): boolean {
  return (
    ((url.origin === codexOrigin || url.origin === authOrigin) &&
      (url.pathname.startsWith(codexPurchasePath) ||
        url.pathname.startsWith(checkoutPath) ||
        url.pathname === "/admin/billing" ||
        url.pathname === "/admin/billing/manage_member_usage_limit" ||
        isPricingUrl(url))) ||
    isPaymentProviderUrl(url)
  );
}
function isPaymentProviderUrl(url: URL): boolean {
  return url.origin === paymentOrigin && url.pathname.startsWith(paymentPath);
}
function isPricingUrl(url: URL): boolean {
  return (
    url.pathname === pricingPath ||
    (url.pathname === rootPath && url.hash === pricingHash)
  );
}
function isSuccessUrl(url: URL, origin: string): boolean {
  return url.origin === origin && successPaths.has(url.pathname);
}
function checkoutRoute(url: URL): string | null {
  try {
    return url.pathname.startsWith(checkoutPath) ? url.pathname : null;
  } catch {
    return null;
  }
}
function pricingReady(webview: WebviewElement): boolean {
  try {
    const url = safeWebviewUrl(webview);
    return url != null && isPricingUrl(url) && !webview.isLoading();
  } catch {
    return false;
  }
}
function safeWebviewUrl(webview: WebviewElement): URL | null {
  try {
    return new URL(webview.getURL());
  } catch {
    return null;
  }
}
function safeUrl(value: string | undefined): URL | null {
  if (value == null) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
function isWebviewElement(value: unknown): value is WebviewElement {
  return (
    value != null &&
    typeof value === "object" &&
    "getURL" in value &&
    typeof value.getURL === "function" &&
    "isLoading" in value &&
    typeof value.isLoading === "function"
  );
}

export {
  CheckoutCreditWebviewHost,
  CheckoutPricingWebviewHost,
  CheckoutWebviewPage,
};
