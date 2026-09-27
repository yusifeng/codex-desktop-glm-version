// browser-login-handoff-page-core —— 登录/SSO handoff 参数构造、分析和重试视图。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as authHandoffChunk from "@rchunk/auth-handoff-page";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  LX: useScope,
  QI: initializeScopeRuntime,
  ZI: appScope,
  _L: useQuery,
  e6: reactRuntime,
  gL: initializeUseQuery,
} = appSharedChunk;
const {
  Cpn: productAnalyticsSignal,
  Fx: sanitizeAuthTarget,
  Ix: initializeAuthTarget,
  Qgn: initializeAccountContext,
  Rx: performAuthHandoff,
  Ycn: getCookieStore,
  an: accessFlowEntryActions,
  cc: initializeAccessFlowEntryPoints,
  i_n: useLocation,
  in: accessFlowEntryEvent,
  mn: initializeAccessFlowActions,
  on: accessFlowEntryPoints,
  sc: analyticsCounter,
  sn: accessFlowEntryTriggers,
  xpn: trackAnalytics,
  ypn: initializeAnalyticsRuntime,
} = appInitialChunk;
const { n: initializeAuthHandoffPage, t: AuthHandoffPage } = authHandoffChunk;

type LoginHandoffFlow = "login" | "sso";

interface BrowserLoginHandoffPageProps {
  flow: LoginHandoffFlow;
}

let cookieStore: import("@rchunk/app-initial").CookieStore;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function trackSsoPageLoad(
  scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
  authSessionLoggingId: string,
  selectedPlanType: string,
): void {
  trackAnalytics(scope, accessFlowEntryEvent, {
    authSessionLoggingId,
    actionType:
      accessFlowEntryActions.ACCESS_FLOW_ENTRY_ACTION_TYPE_PAGE_LOADED,
    entryPoint: accessFlowEntryPoints.ACCESS_FLOW_ENTRY_POINT_AUTH_LOGIN_PAGE,
    entryTrigger: accessFlowEntryTriggers.ACCESS_FLOW_ENTRY_TRIGGER_AUTOMATIC,
    cta:
      selectedPlanType === "none"
        ? "auto-triggerred"
        : `selected-plan-intent:${selectedPlanType}`,
    selectedPlanType,
  });
  analyticsCounter.count("default", "business.auth_entrypoint_opened", {
    action: "page_loaded",
    entry_point: "auth_login_page",
    entry_trigger: "automatic",
    surface: "core_web",
  });
}

function initializeLoginHandoffAnalytics(): void {
  initializeAccessFlowActions();
  initializeAccessFlowEntryPoints();
  initializeAnalyticsRuntime();
}

function BrowserLoginHandoffPage({
  flow,
}: BrowserLoginHandoffPageProps): unknown {
  const scope = useScope(appScope);
  const location = useLocation();
  const trackedLocationKey = reactRuntime.useRef<string | null>(null);
  const [authSessionLoggingId] = reactRuntime.useState<string>(() => {
    const existing = cookieStore.getCookie("oai-asli");
    return flow === "login" && typeof existing === "string" && existing !== ""
      ? existing
      : crypto.randomUUID();
  });
  const query = useQuery<import("@rchunk/auth-handoff-page").AuthHandoffResult>(
    {
      queryKey: ["browser-login-handoff", flow, location.search, location.hash],
      queryFn: async ({ signal }) => {
        const searchParams = new URLSearchParams(location.search);
        const connection = searchParams.get("connection");
        const parameters: Record<string, string> = {
          auth_session_logging_id: authSessionLoggingId,
        };
        if (connection) parameters.connection = connection;
        if (flow === "sso") {
          if (connection)
            parameters.connection_provider = connection.startsWith("conn_")
              ? "2"
              : "1";
        } else {
          if (cookieStore.getCookie("oai-asli") !== authSessionLoggingId) {
            cookieStore.setCookie("oai-asli", authSessionLoggingId, {
              path: "/",
              sameSite: "lax",
            });
          }
          const loginHint = searchParams.get("login_hint");
          if (loginHint) parameters.login_hint = loginHint;
          const screenHint = searchParams.get("screen_hint");
          parameters.screen_hint =
            screenHint === "signup" || screenHint === "login_or_signup"
              ? screenHint
              : "login";
          if (
            searchParams.get("ext-web-mobile-direct-social-login") === "true" &&
            ["apple", "google-oauth2", "windowslive"].includes(connection ?? "")
          ) {
            parameters["ext-web-mobile-direct-social-login"] = "true";
          }
        }
        const target = new URL(
          flow === "sso"
            ? sanitizeAuthTarget(searchParams.get("next"))
            : sanitizeAuthTarget(
                null,
                searchParams.get("callback_path"),
                "auth-server",
              ),
        );
        if (flow === "sso" && location.hash) target.hash = location.hash;
        if (flow === "sso" && trackedLocationKey.current !== location.key) {
          trackedLocationKey.current = location.key ?? null;
          const segments = target.pathname.split("/").filter(Boolean);
          const candidate = segments[1] ?? "none";
          const selectedPlanType =
            segments.length === 2 &&
            segments[0] === "purchase" &&
            ["go", "plus", "pro", "pro5x"].includes(candidate)
              ? candidate
              : "none";
          trackSsoPageLoad(scope, authSessionLoggingId, selectedPlanType);
          await scope
            .get(productAnalyticsSignal)
            .flush(1_000)
            .catch(() => undefined);
        }
        return performAuthHandoff(target.toString(), parameters, signal, flow);
      },
      staleTime: Infinity,
      gcTime: 0,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );
  const pending = query.isFetching || (query.data == null && !query.isError);
  return jsx.jsx(AuthHandoffPage, {
    result: query.data,
    pending,
    onRetry: () => void query.refetch({ cancelRefetch: false }),
  });
}

function initializeBrowserLoginHandoffPage(): void {
  initializeRuntimeLazy();
  initializeUseQuery();
  cookieStore = getCookieStore();
  initializeSignalRuntime();
  reactRuntime();
  initializeAccountContext();
  initializeAnalyticsRuntime();
  initializeScopeRuntime();
  initializeAuthHandoffPage();
  initializeLoginHandoffAnalytics();
  initializeAuthTarget();
  jsx = getJsxRuntime();
}

export {
  initializeBrowserLoginHandoffPage as n,
  initializeLoginHandoffAnalytics as r,
  BrowserLoginHandoffPage as t,
};
