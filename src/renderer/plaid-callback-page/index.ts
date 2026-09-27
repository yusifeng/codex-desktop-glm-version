// plaid-callback-page —— Plaid 授权完成后的确认、Toast 与返回导航。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as plaidLinkChunk from "@rchunk/plaid-link";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  $h: initializeLoadingSpinner,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  LX: useScope,
  QI: initializeScopeRuntime,
  Qh: LoadingSpinner,
  ZI: appScope,
  e6: reactRuntime,
  lk: initializeToastRuntime,
  n4: useIntl,
  pk: toastManagerSignal,
} = appSharedChunk;
const {
  M6t: initializeGptResource,
  N6t: useSessionIdentity,
  Qgn: initializeAccountContext,
  i_n: useLocation,
  o_n: useNavigate,
} = appInitialChunk;
const {
  n: initializePlaidLink,
  r: confirmPlaidRedirect,
  t: getPlaidReturnPath,
} = plaidLinkChunk;

let jsx: import("@rchunk/app-shared").JsxRuntime;

function PersonalFinancePlaidCallbackPage(): unknown {
  const scope = useScope(appScope);
  const { accountId } = useSessionIdentity();
  const intl = useIntl();
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();
  const completeRedirect = async (
    resolvedAccountId: string,
    signal: AbortSignal,
  ): Promise<void> => {
    const returnPath = getPlaidReturnPath(resolvedAccountId);
    try {
      const connected = await confirmPlaidRedirect(scope, {
        accountId: resolvedAccountId,
        receivedRedirectUri: `${window.location.origin}${pathname}${search}${hash}`,
        signal,
      });
      if (connected && !signal.aborted) {
        scope.get(toastManagerSignal).success(
          formatMessageText(intl, {
            id: "personalFinance.accounts.connectionSuccess",
            defaultMessage: "Your financial account is now connected",
            description:
              "Success toast shown after Plaid and ChatGPT confirm that a financial account was successfully connected or repaired in ChatGPT Personal Finance",
          }),
        );
      }
    } catch {
      if (!signal.aborted) {
        scope.get(toastManagerSignal).danger(
          formatMessageText(intl, {
            id: "personalFinance.accounts.connectionError",
            defaultMessage: "Your financial account couldn’t be connected",
            description:
              "Error toast shown when starting Plaid, completing account authorization, or confirming a bank connection fails in ChatGPT Personal Finance",
          }),
          {
            errorAnalytics: {
              toastId: "personalFinance.accounts.connectionError",
            },
          },
        );
      }
    }
    if (!signal.aborted) navigate(returnPath, { replace: true });
  };
  reactRuntime.useEffect(() => {
    if (accountId == null) return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted)
        void completeRedirect(accountId, controller.signal);
    });
    return () => controller.abort();
  }, [accountId, pathname, search, hash]);
  return jsx.jsx("div", {
    className: "flex min-h-32 items-center justify-center",
    children: jsx.jsx(LoadingSpinner, { className: "icon-sm" }),
  });
}

function formatMessageText(
  intl: import("@rchunk/app-shared").IntlShape,
  descriptor: import("@rchunk/app-shared").MessageDescriptor,
): string {
  const message = intl.formatMessage(descriptor);
  return typeof message === "string" ? message : message.map(String).join("");
}

function initializePlaidCallbackPage(): void {
  initializeRuntimeLazy();
  initializeSignalRuntime();
  reactRuntime();
  initializeSharedUi();
  initializeAccountContext();
  initializeGptResource();
  initializeLoadingSpinner();
  initializeToastRuntime();
  initializeScopeRuntime();
  initializePlaidLink();
  jsx = getJsxRuntime();
}

initializePlaidCallbackPage();
export { PersonalFinancePlaidCallbackPage };
