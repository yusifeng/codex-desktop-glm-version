// appgen-site-card —— Site 分享弹窗中的站点摘要与设置入口。
// 原版：app/webview/assets/appgen-site-card-230b77db57a9.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import { formatBrowserUrl as formatSiteLiveUrl } from "../app-primary/runtime/format-browser-url";

void runtimeChunk;
const {
  $3: initializeReactRuntime,
  C_: initializeCardActions,
  I3: getJsxRuntime,
  K2: initializeInternationalization,
  S_: IconAsset,
  Xh: LinkButton,
  Y2: FormattedMessage,
  Zh: initializeButton,
  bE: settingsIcon,
  c_: initializeTooltip,
  n4: useIntl,
  o_: Tooltip,
  xE: initializeNavigationTooltip,
} = appSharedChunk;
const {
  a3t: initializeSiteIcon,
  i3t: SiteIcon,
} = appInitialChunk;
const { Sf: initializeSiteUrlFormatter } = appPrimaryChunk;
const jsx = getJsxRuntime();

interface AppgenSiteCardProps {
  liveUrl?: string | null;
  onOpenSettings?: () => void;
  settingsHref?: string | null;
  title: string;
}

function AppgenSiteCard({
  liveUrl,
  title,
  onOpenSettings,
  settingsHref,
}: AppgenSiteCardProps): unknown {
  const intl = useIntl();
  const formattedLiveUrl = formatSiteLiveUrl(liveUrl);
  const settingsLabel = intl.formatMessage({
    id: "appgenShareDialog.site.settings.label",
    defaultMessage: "Open site settings",
    description:
      "Tooltip and accessible label for the gear button on the website card in the Sites share dialog. Site owners can select it to open the website's settings page. Keep this action label short. No placeholders.",
  });
  const siteIcon = jsx.jsx("span", {
    className: "flex size-10 shrink-0 items-center justify-center",
    children: jsx.jsx(SiteIcon, { className: "icon-md" }),
  });
  const titleNode = jsx.jsx("div", {
    className: "truncate text-sm font-medium text-default",
    children: title,
  });
  const urlLabel =
    formattedLiveUrl ??
    jsx.jsx(FormattedMessage, {
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
      : jsx.jsx(Tooltip, {
          tooltipContent: settingsLabel,
          children: jsx.jsx(LinkButton, {
            "aria-label": settingsLabel,
            color: "ghost",
            size: "toolbar",
            uniform: true,
            href: settingsHref,
            target: undefined,
            rel: "noopener noreferrer",
            onClick: onOpenSettings,
            children: jsx.jsx(IconAsset, { asset: settingsIcon }),
          }),
        });

  return jsx.jsxs("div", {
    className: "flex items-center gap-3 rounded-lg bg-secondary-soft p-3",
    children: [siteIcon, details, settingsAction],
  });
}

function initializeAppgenSiteCard(): void {
  initializeReactRuntime();
  initializeNavigationTooltip();
  initializeInternationalization();
  initializeButton();
  initializeCardActions();
  initializeTooltip();
  initializeSiteIcon();
  initializeSiteUrlFormatter();
}

export { initializeAppgenSiteCard as n, AppgenSiteCard as t };
