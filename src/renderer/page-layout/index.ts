// page-layout —— 浏览器认证页面共用的品牌页头、正文和政策页脚布局。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  Y2: FormattedMessage,
} = appSharedChunk;
const {
  Jot: ExternalLink,
  Xot: initializeExternalLink,
  o3t: OpenAiLogo,
  s3t: initializeOpenAiLogo,
} = appInitialChunk;

interface PageLayoutProps {
  children?: unknown;
  embedded?: boolean;
  showFooter?: boolean;
  title: unknown;
}

let jsx: import("@rchunk/app-shared").JsxRuntime;

function PageLayout({
  title,
  children,
  embedded = false,
  showFooter = true,
}: PageLayoutProps): unknown {
  const header = embedded
    ? null
    : jsx.jsx("header", {
        className: "shrink-0 px-6 py-4 sm:px-8",
        children: jsx.jsx("span", {
          className: "text-heading-lg font-semibold tracking-tight",
          children: jsx.jsx(FormattedMessage, {
            id: "browser.auth.brand",
            defaultMessage: "ChatGPT",
            description:
              "ChatGPT brand name in the top-left header of the browser login and logout pages; do not translate the product name",
          }),
        }),
      });
  const heading = jsx.jsx("h1", {
    className: embedded ? "sr-only" : "text-center text-3xl font-normal",
    children: title,
  });
  const main = jsx.jsx("main", {
    className:
      "flex w-full shrink-0 grow flex-col items-center justify-center px-6 py-4",
    children: jsx.jsxs("div", {
      className: "flex w-full max-w-sm flex-col gap-5",
      children: [heading, children],
    }),
  });
  const footer = showFooter
    ? jsx.jsxs("footer", {
        className: "flex shrink-0 flex-col items-center gap-3 px-6 pt-10 pb-8",
        children: [
          jsx.jsx(OpenAiLogo, {
            "aria-hidden": true,
            className: "size-6 shrink-0",
          }),
          jsx.jsxs("div", {
            className:
              "flex flex-wrap items-center justify-center gap-3 text-xs text-secondary",
            children: [
              createPolicyLink(
                "https://openai.com/policies/terms-of-use/",
                "browser.auth.termsOfUse",
                "Terms of use",
                "Footer link to OpenAI's terms of use on the browser login and logout pages",
              ),
              jsx.jsx("div", {
                "aria-hidden": true,
                className: "h-3 w-px bg-border",
              }),
              createPolicyLink(
                "https://openai.com/policies/privacy-policy/",
                "browser.auth.privacyPolicy",
                "Privacy policy",
                "Footer link to OpenAI's privacy policy on the browser login and logout pages",
              ),
            ],
          }),
        ],
      })
    : null;
  return jsx.jsxs("div", {
    className:
      "flex h-full w-full flex-col overflow-y-auto bg-surface text-default select-none",
    children: [header, main, footer],
  });
}

function createPolicyLink(
  href: string,
  id: string,
  defaultMessage: string,
  description: string,
): unknown {
  return jsx.jsx(ExternalLink, {
    appearance: "secondary",
    href,
    initiator: "open_in_browser_bridge",
    children: jsx.jsx(FormattedMessage, { id, defaultMessage, description }),
  });
}

function initializePageLayout(): void {
  initializeRuntimeLazy();
  initializeSharedUi();
  initializeExternalLink();
  initializeOpenAiLogo();
  jsx = getJsxRuntime();
}

initializePageLayout();
export { initializePageLayout as n, PageLayout as t };
