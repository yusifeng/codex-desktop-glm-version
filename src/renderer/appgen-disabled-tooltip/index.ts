// appgen-disabled-tooltip —— Site 被禁用原因的提示文案。
// 原版：app/webview/assets/appgen-disabled-tooltip-14337c05d2fb.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
let React: any;
let jsx: any;
const SITES_TERMS_URL = "https://openai.com/policies/chatgpt-sites-terms/";

function LearnMoreLink(children: any) {
  return jsx.jsx(
    appInitial.Jot,
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
    return jsx.jsx(appShared.Y2, {
      id: "appgenPage.disabledByOpenAI.tooltip",
      defaultMessage:
        "Your site may violate OpenAI policies. <learnMore>Learn more</learnMore>",
      description:
        "Tooltip explaining why OpenAI disabled a site in the Sites list and linking to the ChatGPT Sites Terms",
      values: { learnMore: LearnMoreLink },
    });
  }
  if (disabledBy !== "workspace_admin") {
    return jsx.jsx(appShared.Y2, {
      id: "appgenPage.disabledUnknown.tooltip",
      defaultMessage: "Disabled",
      description:
        "Tooltip for a disabled site whose disabling actor is unavailable",
    });
  }
  return jsx.jsx(appShared.Y2, {
    id: "appgenPage.disabled.tooltip",
    defaultMessage: "Disabled by an admin",
    description:
      "Tooltip explaining why a workspace admin disabled a site in the Sites list",
  });
}

function initializeAppgenDisabledTooltip(): void {
  appShared.$3?.();
  React = appShared.e6();
  appShared.K2?.();
  appInitial.Xot?.();
  jsx = appShared.I3();
}

export { initializeAppgenDisabledTooltip as n, AppgenDisabledTooltip as t };
