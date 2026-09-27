// health-oauth-callback-page —— 健康服务 OAuth 回跳确认与窗口关闭兜底。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  $h: initializeLoadingSpinner,
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  FZ: rejectMissingQueryParameter,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  QI: initializeScopeRuntime,
  QX: createQueryFamily,
  Qh: LoadingSpinner,
  Y2: FormattedMessage,
  ZI: appScope,
  e6: reactRuntime,
  jZ: initializeMotionRuntime,
} = appSharedChunk;
const {
  Qgn: initializeAccountContext,
  Sun: initializeHealthProvider,
  cJt: initializeApiClient,
  i_n: useLocation,
  mun: currentAccountIdSignal,
  o_n: useNavigate,
  rJt: apiClient,
} = appInitialChunk;

interface HealthOAuthCallbackResult {
  postAuthRedirectPath: string;
}

interface HealthOAuthCallbackParameter {
  accountId: string | null;
  url: string;
}

let callbackQuery: import("@rchunk/app-shared").ScopedQueryFamily<
  Record<string, unknown>,
  HealthOAuthCallbackParameter,
  HealthOAuthCallbackResult
>;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function HealthOAuthCallbackPage(): unknown {
  const accountId = useSignalValue(currentAccountIdSignal);
  return accountId == null
    ? jsx.jsx(LoadingSpinner, {})
    : jsx.jsx(HealthOAuthCallbackContent, { currentAccountId: accountId });
}

function HealthOAuthCallbackContent({
  currentAccountId,
}: {
  currentAccountId: string;
}): unknown {
  const [initialAccountId] = reactRuntime.useState(currentAccountId);
  const location = useLocation();
  const navigate = useNavigate();
  const url = new URL(
    `${location.pathname}${location.search}${location.hash}`,
    window.location.origin,
  ).href;
  const accountChanged = currentAccountId !== initialAccountId;
  const query = useSignalFamilyValue(callbackQuery, {
    accountId: accountChanged ? null : initialAccountId,
    url,
  });
  reactRuntime.useEffect(() => {
    if (accountChanged) return;
    if (query.isError) {
      navigate("/", { replace: true });
      return;
    }
    if (query.data == null) return;
    window.close();
    const timeout = window.setTimeout(() => {
      navigate(query.data!.postAuthRedirectPath, { replace: true });
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [query.data, query.isError, accountChanged, navigate]);
  return jsx.jsx("div", {
    className: "flex min-h-32 flex-col items-center justify-center gap-3",
    role: "status",
    children: accountChanged
      ? jsx.jsx(FormattedMessage, {
          id: "health.oauth.error",
          defaultMessage: "Couldn’t finish connecting your provider",
          description:
            "Error shown when the user switches accounts before the Health provider connection finishes",
        })
      : jsx.jsx(LoadingSpinner, {}),
  });
}

function initializeHealthOAuthCallbackPage(): void {
  initializeRuntimeLazy();
  initializeMotionRuntime();
  initializeSignalRuntime();
  reactRuntime();
  initializeSharedUi();
  initializeAccountContext();
  initializeHealthProvider();
  initializeApiClient();
  initializeLoadingSpinner();
  initializeScopeRuntime();
  jsx = getJsxRuntime();
  callbackQuery = createQueryFamily(
    appScope,
    ({ accountId, url }, { get }) => ({
      queryKey: ["health", accountId, "oauth-callback", url],
      enabled: get(currentAccountIdSignal) === accountId,
      queryFn:
        accountId == null
          ? rejectMissingQueryParameter
          : ({ signal }) =>
              apiClient.safePost<HealthOAuthCallbackResult>(
                "/aip/olympic/oauth/callback",
                {
                  additionalHeaders: { "ChatGPT-Account-ID": accountId },
                  requestBody: { full_redirect_url: url },
                  signal,
                },
              ),
      staleTime: Infinity,
      gcTime: 0,
      retry: false,
      refetchOnReconnect: false,
    }),
  );
}

initializeHealthOAuthCallbackPage();
export { HealthOAuthCallbackPage };
