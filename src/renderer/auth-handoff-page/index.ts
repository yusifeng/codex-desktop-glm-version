// auth-handoff-page —— 浏览器认证回跳的成功、等待与重试共用视图。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as pageLayoutChunk from "@rchunk/page-layout";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
} = appSharedChunk;
const { n: initializePageLayout, t: PageLayout } = pageLayoutChunk;

export type AuthHandoffResult = { ok: true; url: string } | { ok: false };

interface AuthHandoffPageProps {
  onRetry(): void;
  pending: boolean;
  result?: AuthHandoffResult;
}

let jsx: import("@rchunk/app-shared").JsxRuntime;

function AuthHandoffPage({
  result,
  pending,
  onRetry,
}: AuthHandoffPageProps): unknown {
  const title = jsx.jsx(FormattedMessage, {
    id: "browser.auth.handoff.title",
    defaultMessage: "Continue to sign in",
    description:
      "Heading while automatically continuing an authentication flow",
  });
  const success = result?.ok
    ? jsx.jsx("a", {
        ref: (element: unknown) => {
          if (element) window.location.replace(result.url);
        },
        href: result.url,
        children: jsx.jsx(FormattedMessage, {
          id: "browser.auth.handoff.continue",
          defaultMessage: "Continue",
          description:
            "Fallback link to continue authentication if automatic navigation did not occur",
        }),
      })
    : null;
  const status =
    !result?.ok && pending
      ? jsx.jsx("p", {
          role: "status",
          children: jsx.jsx(FormattedMessage, {
            id: "browser.auth.login.pending",
            defaultMessage: "Connecting…",
            description:
              "Label while the ChatGPT browser login page waits for the selected authentication provider",
          }),
        })
      : null;
  const failure =
    !result?.ok && !pending
      ? jsx.jsxs(jsx.Fragment, {
          children: [
            jsx.jsx("p", {
              role: "alert",
              className: "text-sm text-danger",
              children: jsx.jsx(FormattedMessage, {
                id: "browser.auth.handoff.failed",
                defaultMessage: "We couldn’t sign you in. Please try again",
                description:
                  "Error after an automatic authentication handoff fails; the user can retry the same handoff",
              }),
            }),
            jsx.jsx(Button, {
              type: "button",
              color: "primary",
              size: "auth",
              onClick: onRetry,
              children: jsx.jsx(FormattedMessage, {
                id: "browser.auth.handoff.retry",
                defaultMessage: "Try again",
                description:
                  "Button to retry the same authentication handoff after it fails",
              }),
            }),
          ],
        })
      : null;
  return jsx.jsxs(PageLayout, { title, children: [success, status, failure] });
}

function initializeAuthHandoffPage(): void {
  initializeRuntimeLazy();
  initializeSharedUi();
  initializeButton();
  initializePageLayout();
  jsx = getJsxRuntime();
}

initializeAuthHandoffPage();
export { initializeAuthHandoffPage as n, AuthHandoffPage as t };
