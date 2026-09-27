// magic-link-page —— 邮件 Magic Link 的认证检查、自动回跳与失败重启。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as pageLayoutChunk from "@rchunk/page-layout";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
  _L: useQuery,
  gL: initializeUseQuery,
} = appSharedChunk;
const {
  Fx: sanitizeAuthTarget,
  Ix: initializeAuthTarget,
  Qgn: initializeAccountContext,
  Rx: performAuthHandoff,
  Ycn: getCookieStore,
  bfn: initializeCookieStore,
  dJt: initializeAuthHandoff,
  i_n: useLocation,
  o_n: useNavigate,
  uJt: getDeviceId,
  yfn: getAuthState,
} = appInitialChunk;
const { n: initializePageLayout, t: PageLayout } = pageLayoutChunk;

type AuthHandoffResult = { ok: true; url: string } | { ok: false };
let cookieStore: import("@rchunk/app-initial").CookieStore;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function BrowserMagicLinkPage(): unknown {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const target = sanitizeAuthTarget(
    searchParams.get("callback_path") ?? searchParams.get("next"),
  );
  const query = useQuery<AuthHandoffResult>({
    queryKey: ["browser-magic-link", location.key, location.search],
    queryFn: ({ signal }) => {
      if (getAuthState().authStatus === "logged_in")
        return { ok: true, url: target };
      const authSessionLoggingId = crypto.randomUUID();
      cookieStore.setCookie("oai-asli", authSessionLoggingId, {
        path: "/",
        sameSite: "lax",
      });
      return performAuthHandoff(
        target,
        {
          standalone_magic_link: "true",
          "ext-oai-did": getDeviceId(),
          auth_session_logging_id: authSessionLoggingId,
        },
        signal,
      );
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const pending = query.isFetching || (query.data == null && !query.isError);
  const title = jsx.jsx(FormattedMessage, {
    id: "browser.auth.magicLink.title",
    defaultMessage: "Checking your link",
    description:
      "Neutral heading while continuing an emailed login or signup link; the app does not yet know which action the user will complete",
  });
  const successResult = query.data?.ok ? query.data : null;
  const success = successResult
    ? jsx.jsx("a", {
        ref: (element: unknown) => {
          if (element) window.location.replace(successResult.url);
        },
        href: successResult.url,
        children: jsx.jsx(FormattedMessage, {
          id: "browser.auth.magicLink.continue",
          defaultMessage: "Continue",
          description:
            "Fallback link to continue an email authentication flow if automatic navigation did not occur",
        }),
      })
    : null;
  const status =
    !query.data?.ok && pending
      ? jsx.jsx("p", {
          role: "status",
          children: jsx.jsx(FormattedMessage, {
            id: "browser.auth.magicLink.pending",
            defaultMessage: "This should only take a moment",
            description:
              "Supporting text while an emailed login or signup link is handed to the authentication service",
          }),
        })
      : null;
  const failure =
    !query.data?.ok && !pending
      ? jsx.jsxs(jsx.Fragment, {
          children: [
            jsx.jsx("p", {
              role: "alert",
              className: "text-sm text-danger",
              children: jsx.jsx(FormattedMessage, {
                id: "browser.auth.magicLink.failed",
                defaultMessage:
                  "We couldn’t check your link. Start again to get another link.",
                description:
                  "Error when the app cannot continue an emailed login or signup link, including network or authentication failures; directs the user to restart without assuming the link expired",
              }),
            }),
            jsx.jsx(Button, {
              type: "button",
              color: "primary",
              size: "auth",
              onClick: () => {
                const url = new URL(target);
                const restartParams = new URLSearchParams({
                  next: `${url.pathname}${url.search}${url.hash}`,
                });
                navigate(`/auth/login?${restartParams}`, { replace: true });
              },
              children: jsx.jsx(FormattedMessage, {
                id: "browser.auth.magicLink.restart",
                defaultMessage: "Go back",
                description:
                  "Return to login or signup to request a new email link after magic-link handoff fails",
              }),
            }),
          ],
        })
      : null;
  return jsx.jsxs(PageLayout, { title, children: [success, status, failure] });
}

function initializeMagicLinkPage(): void {
  initializeRuntimeLazy();
  initializeUseQuery();
  cookieStore = getCookieStore();
  initializeSharedUi();
  initializeAccountContext();
  initializeCookieStore();
  initializeButton();
  initializeAuthHandoff();
  initializePageLayout();
  initializeAuthTarget();
  jsx = getJsxRuntime();
}

initializeMagicLinkPage();
export { BrowserMagicLinkPage };
