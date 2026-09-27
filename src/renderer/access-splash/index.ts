// access-splash —— 无产品访问权限时的通用说明页。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as lockChunk from "@rchunk/lock";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  Dft: initializeExternalLinkBridge,
  Oft: openExternalLink,
  a7: initializeExternalLinkIcon,
  i7: ExternalLinkIcon,
} = appInitialChunk;
const {
  $3: initializeJsxRuntimeLazy,
  I3: getJsxRuntime,
} = appSharedChunk;
const { n: initializeLockIcon, t: LockIcon } = lockChunk;

interface AccessSplashProps {
  accessMessage: unknown;
  description: unknown;
  learnMoreLabel: unknown;
  learnMoreUrl: string;
  title: unknown;
}

let jsx: import("@rchunk/app-shared").JsxRuntime | null = null;

function AccessSplash({
  accessMessage,
  description,
  learnMoreLabel,
  learnMoreUrl,
  title,
}: AccessSplashProps): unknown {
  initializeAccessSplash();
  const renderer = jsx as import("@rchunk/app-shared").JsxRuntime;
  const onLearnMore = (event: unknown) => {
    openExternalLink?.({
      event,
      href: learnMoreUrl,
      initiator: "open_in_browser_bridge",
    });
  };
  return renderer.jsx("main", {
    className:
      "flex h-full min-h-0 flex-1 items-center justify-center px-panel",
    children: renderer.jsxs("div", {
      className:
        "flex w-full max-w-3xl flex-col items-center gap-8 text-center select-none",
      children: [
        renderer.jsxs("div", {
          className:
            "flex items-center gap-2 text-base leading-6 text-secondary",
          children: [
            LockIcon == null
              ? null
              : renderer.jsx(LockIcon, {
                  "aria-hidden": true,
                  className: "icon-sm",
                }),
            accessMessage,
          ],
        }),
        renderer.jsxs("div", {
          className: "flex flex-col items-center gap-4",
          children: [
            renderer.jsx("h1", {
              className: "heading-xl font-normal text-default",
              children: title,
            }),
            renderer.jsx("p", {
              className: "max-w-2xl text-base leading-6 text-secondary",
              children: description,
            }),
            renderer.jsxs("a", {
              className:
                "inline-flex cursor-interaction items-center gap-1 text-base leading-6 text-info hover:underline",
              href: learnMoreUrl,
              onClick: onLearnMore,
              children: [
                learnMoreLabel,
                ExternalLinkIcon == null
                  ? null
                  : renderer.jsx(ExternalLinkIcon, {
                      className: "icon-sm",
                      href: learnMoreUrl,
                    }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}

function initializeAccessSplash(): void {
  initializeJsxRuntimeLazy?.();
  initializeExternalLinkBridge?.();
  initializeExternalLinkIcon?.();
  initializeLockIcon?.();
  jsx ??=
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

export { initializeAccessSplash as n, AccessSplash as t };
