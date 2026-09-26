// access-splash —— 无产品访问权限时的通用说明页。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as lockChunk from "@rchunk/lock";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;
const lock = lockChunk as Record<string, any>;

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
}

let jsx: JsxRuntime | null = null;

function AccessSplash({
  accessMessage,
  description,
  learnMoreLabel,
  learnMoreUrl,
  title,
}: {
  accessMessage: unknown;
  description: unknown;
  learnMoreLabel: unknown;
  learnMoreUrl: string;
  title: unknown;
}): unknown {
  initializeAccessSplash();
  const renderer = jsx as JsxRuntime;
  const LockIcon = lock.t;
  const ExternalLinkIcon = appInitial.i7;
  const onLearnMore = (event: unknown) => {
    appInitial.Oft?.({
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
  appInitial.Dft?.();
  appInitial.a7?.();
  lock.n?.();
  jsx ??= typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
}

export { initializeAccessSplash as n, AccessSplash as t };
