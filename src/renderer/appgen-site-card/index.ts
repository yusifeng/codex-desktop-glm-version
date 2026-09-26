// appgen-site-card —— Site 分享弹窗中的站点摘要与设置入口。
// 原版：app/webview/assets/appgen-site-card-230b77db57a9.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const jsx = appShared.I3();

function AppgenSiteCard({
  liveUrl,
  title,
  onOpenSettings,
  settingsHref,
}: {
  liveUrl?: string | null;
  title: string;
  onOpenSettings?: () => void;
  settingsHref?: string | null;
}) {
  const intl = appShared.n4();
  const formattedLiveUrl = appPrimary.xf(liveUrl);
  const settingsLabel = intl.formatMessage({
    id: "appgenShareDialog.site.settings.label",
    defaultMessage: "Open site settings",
    description:
      "Tooltip and accessible label for the gear button on the website card in the Sites share dialog. Site owners can select it to open the website's settings page. Keep this action label short. No placeholders.",
  });
  const siteIcon = jsx.jsx("span", {
    className: "flex size-10 shrink-0 items-center justify-center",
    children: jsx.jsx(appInitial.i3t, { className: "icon-md" }),
  });
  const titleNode = jsx.jsx("div", {
    className: "truncate text-sm font-medium text-default",
    children: title,
  });
  const urlLabel =
    formattedLiveUrl ??
    jsx.jsx(appShared.Y2, {
      id: "appgenShareDialog.site.notPublished",
      defaultMessage: "Not published yet",
      description: "Label in a Site card for a site without a published URL",
    });
  const details = jsx.jsxs("div", {
    className: "flex min-w-0 flex-1 flex-col gap-0.5",
    children: [
      titleNode,
      jsx.jsx("div", {
        className: "truncate text-xs text-tertiary",
        children: urlLabel,
      }),
    ],
  });
  const settingsAction =
    settingsHref == null
      ? null
      : jsx.jsx(appShared.o_, {
          tooltipContent: settingsLabel,
          children: jsx.jsx(appShared.Xh, {
            "aria-label": settingsLabel,
            color: "ghost",
            size: "toolbar",
            uniform: true,
            href: settingsHref,
            target: undefined,
            rel: "noopener noreferrer",
            onClick: onOpenSettings,
            children: jsx.jsx(appShared.S_, { asset: appShared.bE }),
          }),
        });

  return jsx.jsxs("div", {
    className: "flex items-center gap-3 rounded-lg bg-secondary-soft p-3",
    children: [siteIcon, details, settingsAction],
  });
}

function initializeAppgenSiteCard(): void {
  appShared.$3?.();
  appShared.xE?.();
  appShared.K2?.();
  appShared.Zh?.();
  appShared.C_?.();
  appShared.c_?.();
  appInitial.a3t?.();
  appPrimary.Sf?.();
}

export { initializeAppgenSiteCard as n, AppgenSiteCard as t };
