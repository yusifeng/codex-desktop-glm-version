// sites-default-thumbnail —— Site 卡片操作区及 macOS/Windows 默认缩略图。
// 原版：app/webview/assets/sites-default-thumbnail-b92e699a8084.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as disabledTooltipChunk from "@rchunk/appgen-disabled-tooltip";
import * as cardLayoutChunk from "@rchunk/appgen-card-layout";
import * as shareDialogChunk from "@rchunk/open-appgen-share-dialog";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const disabledTooltip = disabledTooltipChunk as Record<string, any>;
const cardLayout = cardLayoutChunk as Record<string, any>;
const shareDialog = shareDialogChunk as Record<string, any>;
let jsx: any;
let WindowsSiteThumbnail: any;
let MacSiteThumbnail: any;

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
}: any) {
  const scope = appShared.LX(appShared.ZI);
  const intl = appShared.n4();
  const navigate = appInitial.o_n();
  const analyticsEnabled = appInitial.ofn("262557526");
  const compactSitesList = surface === "sites" && viewMode === "list";
  const track = (action: any) => {
    appInitial.Pan(scope, {
      action,
      projectId,
      source:
        surface === "sites"
          ? appShared.Hk.CODEX_APPGEN_INTERACTION_SOURCE_SITES
          : appShared.Hk.CODEX_APPGEN_INTERACTION_SOURCE_LIBRARY,
    });
  };
  const edit = () => {
    track(appShared.Bk.CODEX_APPGEN_INTERACTION_ACTION_EDIT_WITH_CHAT_CLICKED);
    onEdit("edit");
  };
  const publish = () => onEdit("publish");
  const share = () => {
    shareDialog.n(scope, projectId, {
      source:
        surface === "library"
          ? appShared.DF.CODEX_SITES_SHARING_SOURCE_LIBRARY
          : appShared.DF.CODEX_SITES_SHARING_SOURCE_SITES,
    });
  };
  const openSettings = () => {
    track(appShared.Bk.CODEX_APPGEN_INTERACTION_ACTION_SETTINGS_OPENED);
    navigate(appInitial.cnn(projectId));
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
    ? jsx.jsx(disabledTooltip.t, { disabledBy })
    : null;
  const ownerRequired = intl.formatMessage({
    id: "appgenPage.publish.ownerRequired",
    defaultMessage: "Only the owner can publish the first version",
    description: "Tooltip explaining why only the owner can publish a Site",
  });
  const nonOwnerPublish =
    unpublished && !canManage
      ? jsx.jsx(appShared.o_, {
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
            children: jsx.jsxs(appShared.Yh, {
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
                jsx.jsx(appShared.S_, {
                  className: "hidden [@container_(max-width:720px)]:block",
                  asset: appShared.Bs,
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

  const editAction = jsx.jsx(appShared.o_, {
    interactive: disabled && disabledBy === "openai",
    tooltipContent:
      disabledReason ??
      message(
        "appgenPage.edit.tooltip",
        "Edit",
        "Tooltip for starting a new conversation to edit a site",
      ),
    children: jsx.jsx(appShared.Yh, {
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
      children: jsx.jsx(appShared.S_, {
        asset: appShared.jT,
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
    ? jsx.jsx(appShared.gu, {
        className: menuClassName,
        disabled: true,
        label: moreLabel,
      })
    : jsx.jsxs(appShared.kf, {
        align: "end",
        contentWidth: "menu",
        triggerButton: jsx.jsx(appShared.gu, {
          className: menuClassName,
          label: moreLabel,
        }),
        children: [
          unpublished
            ? jsx.jsx(appShared.jf.Item, {
                disabled: !canManage,
                focusableWhenDisabled: !canManage,
                leftIconAsset: appShared.Bs,
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
            ? jsx.jsx(appShared.jf.Item, {
                leftIconAsset: appShared.fO,
                onSelect: share,
                children: message(
                  "appgenPage.share.label",
                  "Share",
                  "Button label for opening site sharing settings",
                ),
              })
            : null,
          jsx.jsx(appShared.jf.Item, {
            leftIconAsset: appShared.jT,
            onSelect: edit,
            children: message(
              "appgenPage.edit.label",
              "Edit",
              "Menu item for starting a new conversation to edit a site",
            ),
          }),
          canManage && analyticsEnabled
            ? jsx.jsx(appShared.jf.Item, {
                leftIconAsset: appShared.gO,
                onSelect: () => {
                  track(
                    appShared.Bk
                      .CODEX_APPGEN_INTERACTION_ACTION_ANALYTICS_OPENED,
                  );
                  navigate(appInitial.inn(projectId));
                },
                children: message(
                  "appgenPage.analytics.label",
                  "Analytics",
                  "Menu item for opening site analytics",
                ),
              })
            : null,
          canManage
            ? jsx.jsx(appShared.jf.Item, {
                leftIconAsset: appShared.bE,
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
      : jsx.jsx(cardLayout.i, { children: actions });
  }

  const settingsAction = jsx.jsx(appShared.o_, {
    interactive: disabled && disabledBy === "openai",
    tooltipContent:
      disabledReason ??
      message(
        "appgenPage.settings.tooltip",
        "Settings",
        "Tooltip for opening site settings from the sites list",
      ),
    children: jsx.jsx(appShared.Yh, {
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
      children: jsx.jsx(appShared.S_, {
        asset: appShared.bE,
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
  const primaryAction = jsx.jsx(appShared.o_, {
    interactive: disabled && disabledBy === "openai",
    tooltipContent: primaryTooltip,
    children: jsx.jsxs(appShared.Yh, {
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
          : jsx.jsx(appShared.S_, { asset: appShared.fO, "aria-hidden": true }),
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
    : jsx.jsx(cardLayout.i, { children: actions });

  function message(id: string, defaultMessage: string, description: string) {
    return jsx.jsx(appShared.Y2, { id, defaultMessage, description });
  }
}

function initializeSiteCardActions(): void {
  appShared.$3();
  appShared.fI();
  appShared._O();
  appShared.Vs();
  appShared.pO();
  appShared.xE();
  appShared.AT();
  appShared.FX();
  appShared.K2();
  appShared.lk();
  appShared.Zh();
  appShared.If();
  appShared.C_();
  appShared._u();
  appShared.c_();
  cardLayout.a();
  appShared.QI();
  appInitial.ifn();
  appInitial.Nan();
  disabledTooltip.n();
  appInitial.lnn();
  shareDialog.t();
  jsx = appShared.I3();
}

function siteLogoShapes(runtime: any) {
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
  appShared.e6();
  const svg = appShared.I3();
  WindowsSiteThumbnail = (props: any) =>
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
  appShared.e6();
  const svg = appShared.I3();
  MacSiteThumbnail = (props: any) =>
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
