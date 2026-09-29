import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as compactEmptyStateChunk from "@rchunk/compact-empty-state";
import * as surfaceChunk from "@rchunk/surface";

type LoadState = "failed" | "loading" | "ready";

interface JsxRuntime {
  Fragment: unknown;
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

interface WorkspaceAccount {
  id: string;
  plan_type?: string | null;
  structure: string;
}

interface WorkspaceWebviewState {
  accountId: string | null;
  failedAttemptCount: number;
  generation: number;
  loadState: LoadState;
  userId?: string;
}

interface FailureDetails {
  failureReason: "load_timeout" | "navigation_failed" | "unexpected_navigation";
  navigationErrorCode?: number;
  navigationPhase:
    "authentication" | "checkout" | "other" | "startup" | "workspace_settings";
}

interface WebviewNavigationEvent {
  errorCode?: number;
  isMainFrame?: boolean;
  validatedURL?: string;
}

interface WebviewElement {
  addEventListener(
    name: string,
    listener: (event: WebviewNavigationEvent) => void,
  ): void;
  getURL(): string;
  isLoading(): boolean;
  removeEventListener(
    name: string,
    listener: (event: WebviewNavigationEvent) => void,
  ): void;
}

interface ScopeApi {
  get(family: unknown, partition: string): WorkspaceWebviewState;
  query: {
    invalidate(family: unknown, accountId: string): Promise<unknown> | unknown;
  };
  queryClient: {
    cancelQueries(options: { queryKey: readonly unknown[] }): Promise<unknown>;
  };
  set(family: unknown, partition: string, value: WorkspaceWebviewState): void;
}

interface Experiment {
  get<Value>(key: string, fallback: Value): Value;
}

interface TelemetrySession {
  getContext(): { user: { customIDs?: { workspace_id?: string } } };
  getDynamicConfig(
    id: string,
    options: { disableExposureLog: boolean },
  ): Experiment;
}

interface RouteSchema {
  safeParse(value: Record<string, string>): {
    data?: { accountId: string };
    success: boolean;
  };
}

interface SurfaceProps {
  isLoading: boolean;
  loadingContent?: unknown;
  partition: string;
  src: string;
  webviewRef(element: unknown): void;
}

const sharedRuntime = appSharedChunk as unknown as {
  $3?(): void;
  BX?<Value>(family: unknown, partition: string): Value;
  FX?(): void;
  G3?: {
    dispatchMessage(type: string, payload: Record<string, unknown>): void;
  };
  H4?<Value extends Record<string, unknown>>(
    shape: Record<string, unknown>,
  ): { safeParse(value: unknown): { data?: Value; success: boolean } };
  HX?<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  K2?(): void;
  LX?(scope: unknown): ScopeApi;
  NX?: string;
  QI?(): void;
  W3?(): void;
  Y2?: (props: Record<string, unknown>) => unknown;
  Yh?: (props: Record<string, unknown>) => unknown;
  ZI?: unknown;
  Zh?(): void;
  e6(): ReactRuntime;
  g4?(): void;
  h4?(): void;
  m4?(...values: unknown[]): string;
  oZ?(
    scope: unknown,
    initialValue: (partition: string) => WorkspaceWebviewState,
  ): unknown;
  q4?(): { min(length: number): unknown };
  wL?(): void;
  yG?: string;
};

const initialRuntime = appInitialChunk as unknown as {
  A9?(): boolean;
  Dft?(): void;
  Dln?: unknown;
  M6t?(): void;
  MTt?: string;
  N6t?(): {
    authMethod?: string | null;
    isLoading?: boolean;
    userId?: string | null;
  };
  Oft?(input: {
    event: unknown;
    href: string;
    initiator: "open_in_browser_bridge";
    openTarget: "external-browser";
  }): void;
  Oln?(): void;
  PTt?: string;
  Qgn?(): void;
  Udn?(): void;
  Wdn?(): boolean;
  Ygn?: (props: { replace: boolean; to: string }) => unknown;
  c$t?: unknown;
  d_n?(): [URLSearchParams];
  dfn?(): boolean;
  eEt?(): void;
  gT?(): void;
  i_n?(): { pathname: string; search: string };
  idn?(accountId: string): Promise<unknown> | unknown;
  ifn?(): void;
  j9?(): void;
  l$t?(): void;
  lfn?(): TelemetrySession;
  oS?(): void;
  rdn?(): void;
  rht?(): void;
  sS?(scope: ScopeApi, event: Record<string, unknown>): void;
  ufn?(id: string, options: { disableExposureLog: boolean }): Experiment;
  uht?(): { data?: WorkspaceAccount; isLoading: boolean };
};

const emptyStateRuntime = compactEmptyStateChunk as unknown as {
  n?(): void;
  t?: (props: Record<string, unknown>) => unknown;
};
const webviewRuntime = surfaceChunk as unknown as {
  n?(): void;
  t?: (props: SurfaceProps) => unknown;
};

const {
  $3: initializeSharedRuntime,
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  G3: messageBridge,
  H4: objectSchema,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  LX: useScope,
  NX: codexWebUrl,
  QI: initializeSharedQueries,
  W3: initializeMessageBridge,
  Y2: Message,
  Yh: Button,
  ZI: appScope,
  Zh: initializeSharedMessages,
  e6: getReactRuntime,
  g4: initializeDialogRuntime,
  h4: initializeClassNames,
  m4: classNames,
  oZ: createSignalFamily,
  q4: stringSchema,
  wL: initializeWebRuntime,
  yG: partitionPrefix,
} = sharedRuntime;
const {
  A9: useCompactToolbar,
  Dft: initializeExternalLinking,
  Dln: workspacePermissionsQuery,
  M6t: initializeAccountState,
  MTt: workspaceSettingsTarget,
  N6t: useAccountState,
  Oft: openExternalLink,
  Oln: initializeWorkspaceSettings,
  PTt: workspaceSettingsBrowserUrl,
  Qgn: initializeQueries,
  Udn: initializeAccountQueries,
  Wdn: isUnsupportedEnvironment,
  Ygn: Navigate,
  c$t: authOriginSignal,
  d_n: useSearchParams,
  dfn: useAccountTransitionPending,
  eEt: initializeApplicationRuntime,
  gT: initializeRoutingRuntime,
  i_n: useLocation,
  idn: releaseAccountSettings,
  ifn: initializeRouteState,
  j9: initializeReactRuntime,
  l$t: initializeTelemetry,
  lfn: useTelemetrySession,
  oS: initializeNavigationRuntime,
  rdn: initializeAccountRuntime,
  rht: initializeWorkspaceRuntime,
  sS: logWorkspaceSettingsEvent,
  ufn: useExperiment,
  uht: useCurrentAccount,
} = initialRuntime;
const { n: initializeEmptyState, t: CompactEmptyState } = emptyStateRuntime;
const { n: initializeWebviewSurface, t: WebviewSurface } = webviewRuntime;

initializeSharedRuntime?.();
initializeClassNames?.();
initializeSignalRuntime?.();
initializeWebRuntime?.();
const React = getReactRuntime();
initializeQueries?.();
initializeDialogRuntime?.();
initializeReactRuntime?.();
initializeAccountRuntime?.();
initializeWorkspaceSettings?.();
initializeAccountState?.();
initializeWorkspaceRuntime?.();
initializeAccountQueries?.();
initializeApplicationRuntime?.();
initializeWebviewSurface?.();
initializeTelemetry?.();
initializeMessageBridge?.();
initializeSharedQueries?.();
initializeRouteState?.();
initializeNavigationRuntime?.();
initializeRoutingRuntime?.();
initializeSharedRuntime?.();
initializeSignalRuntime?.();
initializeSharedUi?.();
initializeApplicationRuntime?.();
initializeSharedMessages?.();
initializeEmptyState?.();
initializeExternalLinking?.();
initializeSharedQueries?.();
initializeNavigationRuntime?.();

const jsx = getJsxRuntime();
const routeSchema = objectSchema?.<{ accountId: string }>({
  accountId: stringSchema?.().min(1) ?? {},
});
const defaultOrigin = new URL(codexWebUrl ?? "https://chatgpt.com/codex")
  .origin;
const authPath = "/api/auth/";
const checkoutPath = "/checkout/";
const creditSuccessPath = "/payments/success-credit-purchase";
const settingsPath = "/admin";
const experimentId = "2493655517";
const inactiveRetryDelay = 240_000;
const navigationTimeout = 30_000;
const retryBaseDelay = 1_000;
const retryMaximumDelay = 60_000;
const maximumAttempts = 5;
const partitionCache = new Map<string, string>();
const webviewStateFamily =
  createSignalFamily?.(appScope, () => initialWebviewState()) ??
  Symbol("workspace-settings-webview-state");

function initialWebviewState(): WorkspaceWebviewState {
  return {
    accountId: null,
    failedAttemptCount: 0,
    generation: 0,
    loadState: "loading",
    userId: undefined,
  };
}

function parseRoute(params: URLSearchParams): { accountId: string } | null {
  const values = Object.fromEntries(params.entries());
  if (routeSchema != null) {
    const parsed = routeSchema.safeParse(values);
    return parsed.success && parsed.data != null ? parsed.data : null;
  }
  const accountId = values.accountId;
  return typeof accountId === "string" && accountId.length > 0
    ? { accountId }
    : null;
}

function partitionFor(
  accountId: string | undefined,
  userId: string | null | undefined,
): string {
  const key = JSON.stringify([userId, accountId]);
  const cached = partitionCache.get(key);
  if (cached != null) return cached;
  const partition = `${partitionPrefix ?? "persist:workspace-settings-"}${crypto.randomUUID()}`;
  partitionCache.set(key, partition);
  return partition;
}

function WorkspaceSettingsWebviewPage(): unknown {
  const [params] = useSearchParams?.() ?? [new URLSearchParams()];
  return parseRoute(params) == null
    ? jsx.jsx(Navigate ?? "a", { to: "/", replace: true })
    : null;
}

function WorkspaceSettingsLoadFailure({
  accountId,
  onRetry,
}: {
  accountId: string;
  onRetry(): void;
}): unknown {
  const scope = useScope?.(appScope);
  const openInBrowser = (event: unknown) => {
    if (scope != null)
      logWorkspaceSettingsEvent?.(scope, {
        action: "browser_fallback_requested",
        destination: "browser_link",
      });
    const url = new URL(
      workspaceSettingsBrowserUrl ?? "https://chatgpt.com/admin",
    );
    url.searchParams.set("account_id", accountId);
    openExternalLink?.({
      event,
      href: url.toString(),
      initiator: "open_in_browser_bridge",
      openTarget: "external-browser",
    });
  };
  const retryButton = jsx.jsx(Button ?? "button", {
    color: "primary",
    onClick: onRetry,
    children: jsx.jsx(Message ?? "span", {
      id: "workspaceSettings.webview.retry",
      defaultMessage: "Try again",
      description:
        "Button that retries loading the current workspace's settings inside Codex after an embedded-page failure",
    }),
  });
  const browserButton = jsx.jsx(Button ?? "button", {
    color: "secondary",
    onClick: openInBrowser,
    children: jsx.jsx(Message ?? "span", {
      id: "workspaceSettings.webview.openInBrowser",
      defaultMessage: "Open in browser",
      description:
        "Button that opens the same workspace's settings in the external browser when the embedded settings page cannot load",
    }),
  });
  return jsx.jsx(CompactEmptyState ?? "section", {
    className: "select-none",
    icon: null,
    title: jsx.jsx(Message ?? "span", {
      id: "workspaceSettings.webview.loadFailed",
      defaultMessage: "Couldn't load workspace settings",
      description:
        "Title shown in Codex when the authenticated workspace-settings page still cannot load after automatic retries",
    }),
    description: jsx.jsx(Message ?? "span", {
      id: "workspaceSettings.webview.loadFailed.description",
      defaultMessage:
        "Try again or open this workspace's settings in your browser",
      description:
        "Recovery guidance for a workspace administrator when embedded settings fail to load; the browser action opens the same workspace",
    }),
    actions: jsx.jsxs(jsx.Fragment, { children: [retryButton, browserButton] }),
  });
}

function WorkspaceSettingsWebviewHost(): unknown {
  const scope = useScope?.(appScope);
  const {
    authMethod,
    isLoading: authLoading = false,
    userId,
  } = useAccountState?.() ?? {};
  const { data: account, isLoading: accountLoading = false } =
    useCurrentAccount?.() ?? { isLoading: false };
  const location = useLocation?.() ?? { pathname: "/", search: "" };
  const experiment = useExperiment?.(experimentId, {
    disableExposureLog: true,
  });
  const accountTransitionPending = useAccountTransitionPending?.() ?? false;
  const telemetry = useTelemetrySession?.();
  const workspaceId = telemetry?.getContext().user.customIDs?.workspace_id;
  const partition = partitionFor(account?.id, userId);
  const routeAccountId =
    location.pathname === "/workspace-settings/web"
      ? (parseRoute(new URLSearchParams(location.search))?.accountId ?? null)
      : null;
  const eligibleAccountId =
    !isUnsupportedEnvironment?.() &&
    authMethod === "chatgpt" &&
    !authLoading &&
    userId != null &&
    !accountTransitionPending &&
    account?.structure === "workspace" &&
    account.plan_type !== "quorum" &&
    workspaceId === account.id &&
    experiment?.get<boolean>("enable_workspace_settings_webview", false) ===
      true
      ? account.id
      : null;
  const loading = authLoading || accountLoading || accountTransitionPending;
  const presentedAccountId =
    !loading && routeAccountId === eligibleAccountId ? routeAccountId : null;
  const routingOverride =
    presentedAccountId != null && workspaceId === presentedAccountId
      ? telemetry
          ?.getDynamicConfig("762342243", { disableExposureLog: true })
          .get("override", "")
          .trim()
          .toLowerCase() || undefined
      : undefined;
  const storedState =
    useSignalFamilyValue?.<WorkspaceWebviewState>(
      webviewStateFamily,
      partition,
    ) ?? initialWebviewState();
  const stateMatches =
    presentedAccountId != null &&
    storedState.accountId === presentedAccountId &&
    storedState.userId === userId;
  const generation = stateMatches
    ? storedState.generation
    : storedState.generation + 1;
  const previousPresentedAccount = React.useRef<string | null>(null);

  React.useLayoutEffect(() => {
    messageBridge?.dispatchMessage(
      "workspace-settings-webview-presentation-changed",
      { partition, presented: presentedAccountId != null },
    );
    return () =>
      messageBridge?.dispatchMessage(
        "workspace-settings-webview-presentation-changed",
        { partition, presented: false },
      );
  }, [partition, presentedAccountId]);

  React.useLayoutEffect(() => {
    if (scope == null) return;
    const current = scope.get(webviewStateFamily, partition);
    if (presentedAccountId == null) {
      if (
        current.accountId != null &&
        !authLoading &&
        !accountLoading &&
        !accountTransitionPending
      )
        scope.set(webviewStateFamily, partition, {
          accountId: null,
          failedAttemptCount: 0,
          generation: current.generation + 1,
          loadState: "loading",
          userId: undefined,
        });
      return;
    }
    if (current.accountId !== presentedAccountId || current.userId !== userId)
      scope.set(webviewStateFamily, partition, {
        accountId: presentedAccountId,
        failedAttemptCount: 0,
        generation,
        loadState: "loading",
        userId: userId ?? undefined,
      });
  }, [
    accountLoading,
    accountTransitionPending,
    authLoading,
    generation,
    partition,
    presentedAccountId,
    scope,
    userId,
  ]);

  React.useLayoutEffect(() => {
    if (scope == null) return;
    const previous = previousPresentedAccount.current;
    const becamePresented =
      presentedAccountId != null && previous !== presentedAccountId;
    previousPresentedAccount.current = presentedAccountId;
    if (previous != null && previous !== presentedAccountId)
      void scope.queryClient
        .cancelQueries({ queryKey: ["accounts", "settings", previous] })
        .then(() => releaseAccountSettings?.(previous))
        .catch(ignore)
        .then(() =>
          scope.query.invalidate(workspacePermissionsQuery, previous),
        );
    if (!becamePresented) return;
    const current = scope.get(webviewStateFamily, partition);
    if (
      current.accountId === presentedAccountId &&
      current.userId === userId &&
      current.loadState === "failed" &&
      current.failedAttemptCount >= maximumAttempts
    )
      scope.set(webviewStateFamily, partition, {
        ...current,
        failedAttemptCount: 0,
        generation: current.generation + 1,
        loadState: "loading",
      });
  }, [partition, presentedAccountId, scope, userId]);

  const onLoadStateChange = (
    loadState: LoadState,
    failure?: FailureDetails,
  ) => {
    if (scope == null) return;
    const current = scope.get(webviewStateFamily, partition);
    if (
      current.accountId !== presentedAccountId ||
      current.generation !== generation ||
      current.userId !== userId ||
      current.loadState === loadState ||
      (loadState === "loading" &&
        current.loadState === "failed" &&
        current.failedAttemptCount >= maximumAttempts)
    )
      return;
    if (loadState === "failed" || loadState === "ready") {
      const failedAttemptCount =
        current.failedAttemptCount + Number(loadState === "failed");
      logWorkspaceSettingsEvent?.(scope, {
        action: loadState === "failed" ? "webview_failed" : "webview_ready",
        destination: "embedded_webview",
        failedAttemptCount,
        retriesExhausted:
          loadState === "failed"
            ? failedAttemptCount >= maximumAttempts
            : undefined,
        failure,
      });
    }
    scope.set(webviewStateFamily, partition, {
      ...current,
      failedAttemptCount:
        loadState === "failed"
          ? current.failedAttemptCount + 1
          : loadState === "ready"
            ? 0
            : current.failedAttemptCount,
      loadState,
    });
  };

  React.useEffect(() => {
    if (
      scope == null ||
      storedState.accountId == null ||
      (presentedAccountId != null && storedState.loadState !== "failed") ||
      (storedState.loadState === "failed" &&
        storedState.failedAttemptCount >= maximumAttempts)
    )
      return;
    const timer = window.setTimeout(
      () => {
        const current = scope.get(webviewStateFamily, partition);
        if (
          current.accountId !== storedState.accountId ||
          current.generation !== storedState.generation ||
          current.userId !== storedState.userId
        )
          return;
        if (current.loadState === "failed")
          logWorkspaceSettingsEvent?.(scope, {
            action: "automatic_retry",
            destination: "embedded_webview",
            failedAttemptCount: current.failedAttemptCount,
          });
        scope.set(webviewStateFamily, partition, {
          ...current,
          generation: current.generation + 1,
          loadState: "loading",
        });
      },
      storedState.loadState === "failed"
        ? Math.min(
            retryBaseDelay *
              2 ** Math.max(0, storedState.failedAttemptCount - 1),
            retryMaximumDelay,
          )
        : inactiveRetryDelay,
    );
    return () => window.clearTimeout(timer);
  }, [
    partition,
    presentedAccountId,
    scope,
    storedState.accountId,
    storedState.failedAttemptCount,
    storedState.generation,
    storedState.loadState,
    storedState.userId,
  ]);

  if (routeAccountId != null && !loading && presentedAccountId == null)
    return jsx.jsx(Navigate ?? "a", { to: "/", replace: true });
  if (presentedAccountId == null || scope == null) return null;

  const presented = presentedAccountId != null;
  const compactToolbar = useCompactToolbar?.() ?? false;
  const hiddenClass = presented ? false : "pointer-events-none invisible";
  const className =
    classNames?.(
      "fixed inset-x-0 bottom-0 z-30",
      compactToolbar ? "top-(--height-toolbar-sm)" : "top-0",
      hiddenClass,
    ) ?? "fixed inset-0";
  const loadingContent =
    stateMatches &&
    storedState.loadState === "failed" &&
    storedState.failedAttemptCount >= maximumAttempts
      ? jsx.jsx(WorkspaceSettingsLoadFailure, {
          accountId: presentedAccountId,
          onRetry: () => {
            const current = scope.get(webviewStateFamily, partition);
            if (
              current.accountId !== presentedAccountId ||
              current.userId !== userId ||
              current.generation !== generation
            )
              return;
            logWorkspaceSettingsEvent?.(scope, {
              action: "manual_retry",
              destination: "embedded_webview",
              failedAttemptCount: current.failedAttemptCount,
            });
            scope.set(webviewStateFamily, partition, {
              ...current,
              failedAttemptCount: 0,
              generation: generation + 1,
              loadState: "loading",
            });
          },
        })
      : undefined;
  const key = `${userId ?? ""}|${presentedAccountId}|${routingOverride ?? ""}|${generation}`;
  return jsx.jsx("div", {
    "aria-hidden": !presented,
    inert: !presented,
    className,
    children: jsx.jsx(
      WorkspaceSettingsWebview,
      {
        accountId: presentedAccountId,
        loadingContent,
        onLoadStateChange,
        partition,
        routingOverride,
      },
      key,
    ),
  });
}

function WorkspaceSettingsWebview({
  accountId,
  loadingContent,
  onLoadStateChange,
  partition,
  routingOverride,
}: {
  accountId: string;
  loadingContent?: unknown;
  onLoadStateChange(loadState: LoadState, failure?: FailureDetails): void;
  partition: string;
  routingOverride?: string;
}): unknown {
  const authOriginQuery =
    useSignalValue?.<{
      data?: { chatGptDesktopAuthOrigin?: string };
      isLoading?: boolean;
    }>(authOriginSignal) ?? {};
  const origin =
    authOriginQuery.data?.chatGptDesktopAuthOrigin ?? defaultOrigin;
  const [isLoading, setIsLoading] = React.useState(true);
  const [webview, setWebview] = React.useState<WebviewElement | null>(null);
  const webviewRef = (element: unknown) =>
    setWebview(isWebviewElement(element) ? element : null);

  React.useEffect(() => {
    if (webview == null || authOriginQuery.isLoading === true) return;
    let ready = false;
    let failed = false;
    let disposed = false;
    let timeout: number | null = null;
    const clearLoadTimeout = () => {
      if (timeout != null) {
        window.clearTimeout(timeout);
        timeout = null;
      }
    };
    const startLoadTimeout = () => {
      clearLoadTimeout();
      timeout = window.setTimeout(() => {
        const url = safeWebviewUrl(webview);
        if (
          failed ||
          url == null ||
          !isAllowedWebviewUrl(url, origin) ||
          webview.isLoading()
        ) {
          onLoadStateChange("failed", {
            failureReason: "load_timeout",
            navigationPhase: navigationPhase(url, origin),
          });
          if (!disposed) setIsLoading(true);
        }
      }, navigationTimeout);
    };
    const finishNavigation = () => {
      if (failed) return;
      const url = safeWebviewUrl(webview);
      if (url == null || url.protocol === "about:") return;
      if (isAllowedWebviewUrl(url, origin)) {
        if (webview.isLoading()) return;
        ready = true;
        clearLoadTimeout();
        onLoadStateChange("ready");
        if (!disposed) setIsLoading(false);
        return;
      }
      if (url.origin === origin && !url.pathname.startsWith(authPath)) {
        onLoadStateChange("failed", {
          failureReason: "unexpected_navigation",
          navigationPhase: navigationPhase(url, origin),
        });
        if (!disposed) setIsLoading(true);
      }
    };
    const onNavigationStart = (event: WebviewNavigationEvent) => {
      if (event.isMainFrame !== false) {
        failed = false;
        startLoadTimeout();
        onLoadStateChange("loading");
        if (!disposed && !ready) setIsLoading(true);
      }
    };
    const onNavigationFailure = (event: WebviewNavigationEvent) => {
      if (event.isMainFrame === false) return;
      if (event.errorCode === -3) {
        finishNavigation();
        return;
      }
      failed = true;
      onLoadStateChange("failed", {
        failureReason: "navigation_failed",
        navigationPhase: navigationPhase(
          safeWebviewUrl(webview, event.validatedURL),
          origin,
        ),
        navigationErrorCode: event.errorCode,
      });
      if (!disposed) setIsLoading(true);
    };
    for (const eventName of [
      "dom-ready",
      "did-finish-load",
      "did-stop-loading",
      "did-navigate-in-page",
    ])
      webview.addEventListener(eventName, finishNavigation);
    webview.addEventListener("did-start-navigation", onNavigationStart);
    webview.addEventListener("did-fail-load", onNavigationFailure);
    startLoadTimeout();
    finishNavigation();
    return () => {
      disposed = true;
      clearLoadTimeout();
      for (const eventName of [
        "dom-ready",
        "did-finish-load",
        "did-stop-loading",
        "did-navigate-in-page",
      ])
        webview.removeEventListener(eventName, finishNavigation);
      webview.removeEventListener("did-start-navigation", onNavigationStart);
      webview.removeEventListener("did-fail-load", onNavigationFailure);
    };
  }, [authOriginQuery.isLoading, onLoadStateChange, origin, webview]);

  if (authOriginQuery.isLoading === true) return null;
  const target = new URL(
    workspaceSettingsTarget ?? "https://chatgpt.com/admin",
  );
  const src = new URL("about:blank");
  src.searchParams.set("toUrl", `${target.pathname}${target.search}`);
  src.searchParams.set("accountId", accountId);
  if (routingOverride != null)
    src.searchParams.set("routingOverride", routingOverride);
  return jsx.jsx(WebviewSurface ?? "webview", {
    isLoading,
    loadingContent,
    partition,
    src: src.toString(),
    webviewRef,
  });
}

function safeWebviewUrl(
  webview: WebviewElement,
  override?: string,
): URL | null {
  try {
    return new URL(override ?? webview.getURL());
  } catch {
    return null;
  }
}

function isAllowedWebviewUrl(url: URL, origin: string): boolean {
  return (
    url.origin === origin &&
    (url.pathname === settingsPath ||
      url.pathname.startsWith(`${settingsPath}/`) ||
      url.pathname.startsWith(checkoutPath) ||
      url.pathname === creditSuccessPath)
  );
}

function navigationPhase(
  url: URL | null,
  origin: string,
): FailureDetails["navigationPhase"] {
  if (url == null || url.protocol === "about:") return "startup";
  if (url.origin !== origin) return "other";
  if (url.pathname.startsWith(authPath)) return "authentication";
  if (isAllowedWebviewUrl(url, origin))
    return url.pathname.startsWith(settingsPath)
      ? "workspace_settings"
      : "checkout";
  return "other";
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

function ignore(): void {}

export { WorkspaceSettingsWebviewHost, WorkspaceSettingsWebviewPage };
