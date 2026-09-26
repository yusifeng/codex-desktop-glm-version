// sites-default-thumbnail —— Site 卡片操作区及 macOS/Windows 默认缩略图。
// 原版：app/webview/assets/sites-default-thumbnail-b92e699a8084.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as disabledTooltipChunk from "@rchunk/appgen-disabled-tooltip";
import * as cardLayoutChunk from "@rchunk/appgen-card-layout";
import * as shareDialogChunk from "@rchunk/open-appgen-share-dialog";
import type {
  AppgenInteractionAction,
  JsxRuntime,
} from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeReactRuntime,
  AT: initializeMountedState,
  Bk: appgenInteractionActions,
  Bs: publishIcon,
  C_: initializeCardActions,
  DF: sitesSharingSources,
  FX: initializeMaitaiRuntime,
  Hk: appgenInteractionSources,
  I3: getJsxRuntime,
  If: initializeMenu,
  K2: initializeInternationalization,
  LX: useScope,
  QI: initializeImageRuntime,
  S_: IconAsset,
  Vs: initializeMenuIcons,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: AppScope,
  Zh: initializeButton,
  _O: initializeSiteActionIcons,
  _u: initializeMoreButton,
  bE: settingsIcon,
  c_: initializeTooltip,
  e6: initializeReact,
  fI: initializeIntlRuntime,
  fO: shareIcon,
  gO: analyticsIcon,
  gu: MoreButton,
  jf: Menu,
  jT: editIcon,
  kf: DropdownMenu,
  lk: initializeIconAssets,
  n4: useIntl,
  o_: Tooltip,
  pO: initializeDropdownMenu,
  xE: initializeNavigationTooltip,
} = appSharedChunk;
const {
  Nan: initializeAppgenAnalytics,
  Pan: recordAppgenInteraction,
  cnn: appgenSettingsPath,
  ifn: initializeAppgenRuntime,
  inn: appgenAnalyticsPath,
  lnn: initializeAppgenRoutes,
  ofn: isFeatureGateEnabled,
  o_n: useNavigate,
} = appInitialChunk;
const {
  n: initializeDisabledTooltip,
  t: AppgenDisabledTooltip,
} = disabledTooltipChunk;
const {
  a: initializeCardLayout,
  i: AppgenCardActionsLayout,
} = cardLayoutChunk;
const {
  n: openAppgenShareDialog,
  t: initializeOpenShareDialog,
} = shareDialogChunk;
let jsx: JsxRuntime;

interface SiteCardActionsProps {
  canManage?: boolean;
  disabled?: boolean;
  disabledBy?: string | null;
  onEdit(mode: "edit" | "publish"): void;
  projectId: string;
  projectTitle: string;
  surface: "library" | "sites";
  unpublished?: boolean;
  viewMode: "grid" | "list";
}

interface SiteThumbnailProps extends Record<string, unknown> {
  "aria-hidden"?: boolean;
  className?: string;
}

let WindowsSiteThumbnail: (props: SiteThumbnailProps) => unknown;
let MacSiteThumbnail: (props: SiteThumbnailProps) => unknown;

function SiteCardActions({
  canManage = true,
  disabled = false,
  disabledBy,
  onEdit,
  projectId,
  projectTitle,
  surface,
  unpublished = false,
  viewMode,
}: SiteCardActionsProps): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const navigate = useNavigate();
  const analyticsEnabled = isFeatureGateEnabled("262557526");
  const compactSitesList = surface === "sites" && viewMode === "list";
  const track = (action: AppgenInteractionAction) => {
    recordAppgenInteraction(scope, {
      action,
      projectId,
      source:
        surface === "sites"
          ? appgenInteractionSources.CODEX_APPGEN_INTERACTION_SOURCE_SITES
          : appgenInteractionSources.CODEX_APPGEN_INTERACTION_SOURCE_LIBRARY,
    });
  };
  const edit = () => {
    track(
      appgenInteractionActions.CODEX_APPGEN_INTERACTION_ACTION_EDIT_WITH_CHAT_CLICKED,
    );
    onEdit("edit");
  };
  const publish = () => onEdit("publish");
  const share = () => {
    openAppgenShareDialog(scope, projectId, {
      source:
        surface === "library"
          ? sitesSharingSources.CODEX_SITES_SHARING_SOURCE_LIBRARY
          : sitesSharingSources.CODEX_SITES_SHARING_SOURCE_SITES,
    });
  };
  const openSettings = () => {
    track(appgenInteractionActions.CODEX_APPGEN_INTERACTION_ACTION_SETTINGS_OPENED);
    navigate(appgenSettingsPath(projectId));
  };
  const moreLabel = intl.formatMessage(
    {
      id: "appgenPage.actions.more",
      defaultMessage: "More actions for {siteTitle}",
      description: "Accessible label for opening the actions menu for a site",
    },
    { siteTitle: projectTitle },
  );
  const disabledReason = disabled
    ? jsx.jsx(AppgenDisabledTooltip, { disabledBy })
    : null;
  const ownerRequired = intl.formatMessage({
    id: "appgenPage.publish.ownerRequired",
    defaultMessage: "Only the owner can publish the first version",
    description: "Tooltip explaining why only the owner can publish a Site",
  });
  const nonOwnerPublish =
    unpublished && !canManage
      ? jsx.jsx(Tooltip, {
          tooltipContent: ownerRequired,
          children: jsx.jsx("span", {
            "aria-disabled": "true",
            "aria-label": intl.formatMessage({
              id: "appgenPage.publish.label",
              defaultMessage: "Publish",
              description: "Button label for publishing an unpublished Site",
            }),
            className: "inline-flex [@container_(max-width:520px)]:hidden",
            role: "button",
            tabIndex: 0,
            children: jsx.jsxs(Button, {
              "aria-hidden": "true",
              "aria-label": intl.formatMessage({
                id: "appgenPage.publish.label",
                defaultMessage: "Publish",
                description: "Button label for publishing an unpublished Site",
              }),
              className:
                "[@container_(max-width:720px)]:aspect-square [@container_(max-width:720px)]:!px-0",
              color: "secondary",
              disabled: true,
              size: "toolbar",
              children: [
                jsx.jsx(IconAsset, {
                  className: "hidden [@container_(max-width:720px)]:block",
                  asset: publishIcon,
                  "aria-hidden": true,
                }),
                jsx.jsx("span", {
                  className: "[@container_(max-width:720px)]:hidden",
                  children: message(
                    "appgenPage.publish.label",
                    "Publish",
                    "Button label for publishing an unpublished Site",
                  ),
                }),
              ],
            }),
          }),
        })
      : null;

  const editAction = jsx.jsx(Tooltip, {
    interactive: disabled && disabledBy === "openai",
    tooltipContent:
      disabledReason ??
      message(
        "appgenPage.edit.tooltip",
        "Edit",
        "Tooltip for starting a new conversation to edit a site",
      ),
    children: jsx.jsx(Button, {
      className: compactSitesList
        ? "[@container_(max-width:520px)]:hidden"
        : undefined,
      "aria-label": intl.formatMessage(
        {
          id: "appgenPage.edit",
          defaultMessage: "Edit {siteTitle}",
          description:
            "Accessible label for starting a new conversation to edit a site from the sites list",
        },
        { siteTitle: projectTitle },
      ),
      color: viewMode === "grid" ? "ghost" : "ghostTertiary",
      disabled,
      size: viewMode === "grid" ? "toolbar" : "composer",
      uniform: true,
      onClick: edit,
      children: jsx.jsx(IconAsset, {
        asset: editIcon,
        "aria-hidden": true,
      }),
    }),
  });

  const showMenuAlongsidePrimary =
    canManage && (analyticsEnabled || unpublished);
  const menuClassName = showMenuAlongsidePrimary
    ? undefined
    : "hidden [@container_(max-width:520px)]:inline-flex";
  const menu = disabled
    ? jsx.jsx(MoreButton, {
        className: menuClassName,
        disabled: true,
        label: moreLabel,
      })
    : jsx.jsxs(DropdownMenu, {
        align: "end",
        contentWidth: "menu",
        triggerButton: jsx.jsx(MoreButton, {
          className: menuClassName,
          label: moreLabel,
        }),
        children: [
          unpublished
            ? jsx.jsx(Menu.Item, {
                disabled: !canManage,
                focusableWhenDisabled: !canManage,
                leftIconAsset: publishIcon,
                onSelect: canManage ? publish : undefined,
                tooltipText: canManage ? undefined : ownerRequired,
                children: message(
                  "appgenPage.publish.label",
                  "Publish",
                  "Button label for publishing an unpublished Site",
                ),
              })
            : null,
          canManage && (unpublished || compactSitesList)
            ? jsx.jsx(Menu.Item, {
                leftIconAsset: shareIcon,
                onSelect: share,
                children: message(
                  "appgenPage.share.label",
                  "Share",
                  "Button label for opening site sharing settings",
                ),
              })
            : null,
          jsx.jsx(Menu.Item, {
            leftIconAsset: editIcon,
            onSelect: edit,
            children: message(
              "appgenPage.edit.label",
              "Edit",
              "Menu item for starting a new conversation to edit a site",
            ),
          }),
          canManage && analyticsEnabled
            ? jsx.jsx(Menu.Item, {
                leftIconAsset: analyticsIcon,
                onSelect: () => {
                  track(
                    appgenInteractionActions
                      .CODEX_APPGEN_INTERACTION_ACTION_ANALYTICS_OPENED,
                  );
                  navigate(appgenAnalyticsPath(projectId));
                },
                children: message(
                  "appgenPage.analytics.label",
                  "Analytics",
                  "Menu item for opening site analytics",
                ),
              })
            : null,
          canManage
            ? jsx.jsx(Menu.Item, {
                leftIconAsset: settingsIcon,
                onSelect: openSettings,
                children: message(
                  "appgenPage.settings.label",
                  "Settings",
                  "Menu item for opening site settings",
                ),
              })
            : null,
        ],
      });

  if (!canManage) {
    const actions = jsx.jsxs(jsx.Fragment, {
      children: [nonOwnerPublish, editAction, compactSitesList ? menu : null],
    });
    return viewMode === "grid"
      ? actions
      : jsx.jsx(AppgenCardActionsLayout, { children: actions });
  }

  const settingsAction = jsx.jsx(Tooltip, {
    interactive: disabled && disabledBy === "openai",
    tooltipContent:
      disabledReason ??
      message(
        "appgenPage.settings.tooltip",
        "Settings",
        "Tooltip for opening site settings from the sites list",
      ),
    children: jsx.jsx(Button, {
      className: compactSitesList
        ? "[@container_(max-width:520px)]:hidden"
        : undefined,
      "aria-label": intl.formatMessage(
        {
          id: "appgenPage.openSettings",
          defaultMessage: "Open settings for {siteTitle}",
          description:
            "Accessible label for opening site settings from the sites list",
        },
        { siteTitle: projectTitle },
      ),
      color: viewMode === "grid" ? "ghost" : "ghostTertiary",
      disabled,
      size: viewMode === "grid" ? "toolbar" : "composer",
      uniform: true,
      onClick: openSettings,
      children: jsx.jsx(IconAsset, {
        asset: settingsIcon,
        "aria-hidden": true,
      }),
    }),
  });
  const secondaryColor = viewMode === "grid" ? "ghost" : "outline";
  const responsivePrimaryClass = compactSitesList
    ? "[@container_(max-width:520px)]:hidden"
    : "[@container_(max-width:420px)]:aspect-square [@container_(max-width:420px)]:!px-0";
  const primaryTooltip =
    disabledReason ??
    (unpublished
      ? message(
          "appgenPage.publish.label",
          "Publish",
          "Button label for publishing an unpublished Site",
        )
      : message(
          "appgenPage.share.tooltip",
          "Share",
          "Tooltip for opening site sharing settings",
        ));
  const primaryLabel = unpublished
    ? intl.formatMessage(
        {
          id: "appgenPage.publish",
          defaultMessage: "Publish {siteTitle}",
          description:
            "Accessible label for publishing an unpublished Site from the Sites list",
        },
        { siteTitle: projectTitle },
      )
    : intl.formatMessage(
        {
          id: "appgenPage.share",
          defaultMessage: "Share {siteTitle}",
          description:
            "Accessible label for opening site sharing settings from the sites list",
        },
        { siteTitle: projectTitle },
      );
  const primaryAction = jsx.jsx(Tooltip, {
    interactive: disabled && disabledBy === "openai",
    tooltipContent: primaryTooltip,
    children: jsx.jsxs(Button, {
      className: viewMode === "list" ? responsivePrimaryClass : undefined,
      "aria-label": primaryLabel,
      color: unpublished ? "primary" : secondaryColor,
      disabled,
      size: "toolbar",
      uniform: !unpublished && viewMode === "grid",
      onClick: unpublished ? publish : share,
      children: [
        unpublished
          ? message(
              "appgenPage.publish.label",
              "Publish",
              "Button label for publishing an unpublished Site",
            )
          : jsx.jsx(IconAsset, { asset: shareIcon, "aria-hidden": true }),
        !unpublished && viewMode === "list"
          ? jsx.jsx("span", {
              className: "[@container_(max-width:520px)]:hidden",
              children: message(
                "appgenPage.share.label",
                "Share",
                "Button label for opening site sharing settings",
              ),
            })
          : null,
      ],
    }),
  });
  const directActions = showMenuAlongsidePrimary
    ? null
    : jsx.jsxs(jsx.Fragment, {
        children:
          surface === "sites"
            ? [editAction, settingsAction]
            : [settingsAction, editAction],
      });
  const actions = jsx.jsxs(jsx.Fragment, {
    children: [
      primaryAction,
      showMenuAlongsidePrimary || compactSitesList ? menu : null,
      directActions,
    ],
  });
  return viewMode === "grid"
    ? actions
    : jsx.jsx(AppgenCardActionsLayout, { children: actions });

  function message(id: string, defaultMessage: string, description: string) {
    return jsx.jsx(FormattedMessage, { id, defaultMessage, description });
  }
}

function initializeSiteCardActions(): void {
  initializeReactRuntime();
  initializeIntlRuntime();
  initializeSiteActionIcons();
  initializeMenuIcons();
  initializeDropdownMenu();
  initializeNavigationTooltip();
  initializeMountedState();
  initializeMaitaiRuntime();
  initializeInternationalization();
  initializeIconAssets();
  initializeButton();
  initializeMenu();
  initializeCardActions();
  initializeMoreButton();
  initializeTooltip();
  initializeCardLayout();
  initializeImageRuntime();
  initializeAppgenRuntime();
  initializeAppgenAnalytics();
  initializeDisabledTooltip();
  initializeAppgenRoutes();
  initializeOpenShareDialog();
  jsx = getJsxRuntime();
}

function siteLogoShapes(runtime: JsxRuntime): unknown[] {
  return [
    runtime.jsx("path", {
      d: "M46.6667 30.8485C46.6667 31.8526 45.8526 32.6667 44.8485 32.6667H41.8182C40.814 32.6667 40 31.8526 40 30.8485V26H44.8485C45.8526 26 46.6667 26.814 46.6667 27.8182V30.8485Z",
      fill: "var(--color-text-info)",
    }),
    runtime.jsx("path", {
      d: "M45.3333 19.3359C46.0697 19.3359 46.6667 19.9329 46.6667 20.6693V22.6693C46.6667 23.4057 46.0697 24.0026 45.3333 24.0026H43.3333C42.597 24.0026 42 23.4057 42 22.6693V20.6693C42 19.9329 42.597 19.3359 43.3333 19.3359H45.3333Z",
      fill: "var(--color-text-info)",
      fillOpacity: 0.78,
    }),
    runtime.jsx("path", {
      d: "M36.6667 28C37.4031 28 38 28.597 38 29.3333V31.3333C38 32.0697 37.4031 32.6667 36.6667 32.6667H34.6667C33.9303 32.6667 33.3334 32.0697 33.3334 31.3333V29.3333C33.3334 28.597 33.9303 28 34.6667 28H36.6667Z",
      fill: "var(--color-text-info)",
      fillOpacity: 0.78,
    }),
    runtime.jsx("path", {
      d: "M40 26.0026H35.1516C34.1474 26.0026 33.3334 25.1886 33.3334 24.1844V21.1541C33.3334 20.15 34.1474 19.3359 35.1516 19.3359H38.1819C39.186 19.3359 40 20.15 40 21.1541V26.0026Z",
      fill: "var(--color-text-info)",
    }),
  ];
}

function initializeWindowsSiteThumbnail(): void {
  initializeReact();
  const svg = getJsxRuntime();
  WindowsSiteThumbnail = (props: SiteThumbnailProps) =>
    svg.jsxs("svg", {
      width: 80,
      height: 50,
      viewBox: "0 0 80 50",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
      children: [
        svg.jsx("rect", {
          width: 80,
          height: 50,
          fill: "var(--color-surface)",
        }),
        ...siteLogoShapes(svg),
        svg.jsx("path", {
          d: "M57.5 7H60.5",
          stroke: "var(--color-border)",
          strokeLinecap: "round",
        }),
        svg.jsx("rect", {
          x: 64,
          y: 7,
          width: 2,
          height: 2,
          rx: 0.5,
          fill: "var(--color-border)",
        }),
        svg.jsx("path", {
          d: "M67.5 5C67.7761 5 68 5.22386 68 5.5V7.5C68 7.77614 67.7761 8 67.5 8H67V6H65V5.5C65 5.22386 65.2239 5 65.5 5H67.5Z",
          fill: "var(--color-border)",
        }),
        svg.jsx("path", {
          d: "M74.1464 5.14645C74.3417 4.95118 74.6582 4.95118 74.8535 5.14645C75.0487 5.34171 75.0487 5.65822 74.8535 5.85348L73.707 6.99996L74.8535 8.14645C75.0487 8.34171 75.0487 8.65822 74.8535 8.85348C74.6582 9.04874 74.3417 9.04874 74.1464 8.85348L73 7.70699L71.8535 8.85348C71.6582 9.04874 71.3417 9.04874 71.1464 8.85348C70.9512 8.65822 70.9512 8.34171 71.1464 8.14645L72.2929 6.99996L71.1464 5.85348C70.9512 5.65822 70.9512 5.34171 71.1464 5.14645C71.3417 4.95118 71.6582 4.95118 71.8535 5.14645L73 6.29293L74.1464 5.14645Z",
          fill: "var(--color-border)",
        }),
      ],
    });
}

function initializeMacSiteThumbnail(): void {
  initializeReact();
  const svg = getJsxRuntime();
  MacSiteThumbnail = (props: SiteThumbnailProps) =>
    svg.jsxs("svg", {
      width: 80,
      height: 50,
      viewBox: "0 0 80 50",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
      children: [
        svg.jsx("rect", {
          width: 80,
          height: 50,
          fill: "var(--color-surface)",
        }),
        svg.jsx("rect", {
          opacity: 0.7,
          x: 5,
          y: 5,
          width: 4,
          height: 4,
          rx: 2,
          fill: "#FF5F57",
        }),
        svg.jsx("rect", {
          opacity: 0.7,
          x: 11,
          y: 5,
          width: 4,
          height: 4,
          rx: 2,
          fill: "#FEBC2E",
        }),
        svg.jsx("rect", {
          opacity: 0.7,
          x: 17,
          y: 5,
          width: 4,
          height: 4,
          rx: 2,
          fill: "#28C840",
        }),
        ...siteLogoShapes(svg),
      ],
    });
}

export {
  SiteCardActions as a,
  initializeWindowsSiteThumbnail as i,
  initializeMacSiteThumbnail as n,
  initializeSiteCardActions as o,
  WindowsSiteThumbnail as r,
  MacSiteThumbnail as t,
};
