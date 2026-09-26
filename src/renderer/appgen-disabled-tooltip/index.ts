// appgen-disabled-tooltip —— Site 被禁用原因的提示文案。
// 原版：app/webview/assets/appgen-disabled-tooltip-14337c05d2fb.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeReactRuntime,
  I3: getJsxRuntime,
  K2: initializeInternationalization,
  Y2: FormattedMessage,
  e6: getReactRuntime,
} = appSharedChunk;
const {
  Jot: ExternalLink,
  Xot: initializeExternalLink,
} = appInitialChunk;
let React: ReactRuntime;
let jsx: JsxRuntime;
const SITES_TERMS_URL = "https://openai.com/policies/chatgpt-sites-terms/";

function LearnMoreLink(children: unknown): unknown {
  return jsx.jsx(
    ExternalLink,
    {
      className: "text-info underline decoration-current underline-offset-2",
      href: SITES_TERMS_URL,
      initiator: "sites_library",
      children: React.Children.toArray(children),
    },
    "sites-terms-link",
  );
}

function AppgenDisabledTooltip({ disabledBy }: { disabledBy?: string | null }) {
  if (disabledBy === "openai") {
    return jsx.jsx(FormattedMessage, {
      id: "appgenPage.disabledByOpenAI.tooltip",
      defaultMessage:
        "Your site may violate OpenAI policies. <learnMore>Learn more</learnMore>",
      description:
        "Tooltip explaining why OpenAI disabled a site in the Sites list and linking to the ChatGPT Sites Terms",
      values: { learnMore: LearnMoreLink },
    });
  }
  if (disabledBy !== "workspace_admin") {
    return jsx.jsx(FormattedMessage, {
      id: "appgenPage.disabledUnknown.tooltip",
      defaultMessage: "Disabled",
      description:
        "Tooltip for a disabled site whose disabling actor is unavailable",
    });
  }
  return jsx.jsx(FormattedMessage, {
    id: "appgenPage.disabled.tooltip",
    defaultMessage: "Disabled by an admin",
    description:
      "Tooltip explaining why a workspace admin disabled a site in the Sites list",
  });
}

function initializeAppgenDisabledTooltip(): void {
  initializeReactRuntime();
  React = getReactRuntime();
  initializeInternationalization();
  initializeExternalLink();
  jsx = getJsxRuntime();
}

export { initializeAppgenDisabledTooltip as n, AppgenDisabledTooltip as t };
