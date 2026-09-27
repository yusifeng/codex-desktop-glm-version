// desktop-page —— 浏览器认证完成后拉起桌面应用，并提供复制回跳链接的兜底。
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
  e6: reactRuntime,
} = appSharedChunk;
const { Qgn: initializeAccountContext, d_n: useSearchParams } = appInitialChunk;
const { n: initializePageLayout, t: PageLayout } = pageLayoutChunk;

let jsx: import("@rchunk/app-shared").JsxRuntime;

function BrowserOpenInDesktopPage(): unknown {
  const [searchParams] = useSearchParams();
  const [showFallback, setShowFallback] = reactRuntime.useState(false);
  const [copyFailed, setCopyFailed] = reactRuntime.useState(false);
  const didLaunch = reactRuntime.useRef(false);
  const desktopUrl = createDesktopAuthUrl(searchParams, navigator.userAgent);
  const title = jsx.jsx(FormattedMessage, {
    id: "browser.auth.desktop.title",
    defaultMessage: "Continue in the desktop app",
    description:
      "Heading on the browser page that finishes authentication in the ChatGPT desktop app",
  });
  if (desktopUrl == null) {
    return jsx.jsx(PageLayout, {
      title,
      children: jsx.jsx("p", {
        role: "alert",
        children: jsx.jsx(FormattedMessage, {
          id: "browser.auth.desktop.invalid",
          defaultMessage:
            "This sign-in link is incomplete. Return to the desktop app and try again",
          description:
            "Error when a desktop authentication callback lacks its path, code, or state; instruct the user to restart in the app",
        }),
      }),
    });
  }
  return jsx.jsx(PageLayout, {
    title,
    children: jsx.jsxs("div", {
      ref: () => {
        if (!didLaunch.current) {
          didLaunch.current = true;
          window.location.assign(desktopUrl);
        }
        const timeout = window.setTimeout(() => setShowFallback(true), 3_000);
        return () => window.clearTimeout(timeout);
      },
      className: "flex w-full flex-col gap-3",
      children: [
        jsx.jsx(Button, {
          type: "button",
          color: "primary",
          size: "auth",
          onClick: () => window.location.assign(desktopUrl),
          children: jsx.jsx(FormattedMessage, {
            id: "OpenInDesktopApp.launchButton",
            defaultMessage: "Launch ChatGPT desktop app",
            description:
              "Button on the browser authentication callback page that opens and authenticates the ChatGPT desktop app",
          }),
        }),
        showFallback
          ? jsx.jsx(Button, {
              type: "button",
              color: "outlineSurface",
              size: "auth",
              onClick: () => {
                navigator.clipboard.writeText(desktopUrl).then(
                  () => setCopyFailed(false),
                  () => setCopyFailed(true),
                );
              },
              children: jsx.jsx(FormattedMessage, {
                id: "OpenInDesktopApp.secondaryButton",
                defaultMessage: "Not launching? Click here instead",
                description:
                  "Fallback button on the desktop authentication callback page; copies the desktop sign-in link to the clipboard",
              }),
            })
          : null,
        copyFailed
          ? jsx.jsx("p", {
              role: "alert",
              className: "text-sm text-danger",
              children: jsx.jsx(FormattedMessage, {
                id: "browser.auth.desktop.copyFailed",
                defaultMessage:
                  "Couldn’t copy the link. Try launching the app again",
                description:
                  "Inline error when the browser refuses to copy the desktop sign-in link",
              }),
            })
          : null,
      ],
    }),
  });
}

function createDesktopAuthUrl(
  searchParams: URLSearchParams,
  userAgent: string,
): string | null {
  const path = searchParams.get("path");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!path || !code || !state || /[?#]/.test(path)) return null;
  const scheme = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)
    ? "chatgpt-alt"
    : "chatgpt";
  const url = new URL(
    `${scheme}://oauth_complete${path.startsWith("/") ? path : `/${path}`}`,
  );
  url.search = new URLSearchParams({ code, state }).toString();
  return url.toString();
}

function initializeDesktopPage(): void {
  initializeRuntimeLazy();
  reactRuntime();
  initializeSharedUi();
  initializeAccountContext();
  initializeButton();
  initializePageLayout();
  jsx = getJsxRuntime();
}

initializeDesktopPage();
export { BrowserOpenInDesktopPage };
