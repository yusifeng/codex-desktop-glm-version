// codex-app-home-beacon-announcement-core —— 后端驱动 Home Beacon 的展示与动作编排。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as homeBeaconFinanceChunk from "@rchunk/home-beacon-finance";
import * as pcaConnectorActionChunk from "@rchunk/pca-connector-action";
import * as pcaEligibilityChunk from "@rchunk/pca-connector-eligibility";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;
const homeBeaconFinance = homeBeaconFinanceChunk as Record<string, any>;
const pcaConnectorAction = pcaConnectorActionChunk as Record<string, any>;
const pcaEligibility = pcaEligibilityChunk as Record<string, any>;

type BeaconAction = {
  id: string;
  text?: string;
  type?: string;
  action_v2: {
    action_enum: string;
    items?: BeaconAction[];
    [key: string]: any;
  };
};

type Beacon = {
  beacon_id: string;
  beacon_name?: string;
  action_items: BeaconAction[];
  ui_info: Record<string, any>;
};

let React: any;
let jsx: any;
let initialized = false;

function isRemoteImageAllowed(url: unknown): url is string {
  return (
    typeof url === "string" && (appPrimary.$m?.(url) ?? /^https?:/.test(url))
  );
}

function containsAction(
  actions: readonly BeaconAction[],
  predicate: (action: BeaconAction) => boolean,
): boolean {
  return actions.some((action) =>
    predicate(action)
      ? true
      : action.action_v2.action_enum === "dropdown"
        ? containsAction(action.action_v2.items ?? [], predicate)
        : false,
  );
}

function containsActionType(
  actions: readonly BeaconAction[],
  actionType: string,
): boolean {
  return containsAction(
    actions,
    (action) => action.action_v2.action_enum === actionType,
  );
}

function isBannerBeacon(beacon: Beacon): boolean {
  return (
    appInitial.yNt?.(beacon) ?? beacon.ui_info.type === "beacon_banner_info"
  );
}

function isTakeoverBeacon(beacon: Beacon): boolean {
  return (
    appInitial.CNt?.(beacon) ?? beacon.ui_info.type === "homepage_takeover"
  );
}

function isModalBeacon(beacon: Beacon): boolean {
  return (
    appInitial.wNt?.(beacon) ?? beacon.ui_info.type === "beacon_modal_info"
  );
}

function isCarouselBeacon(beacon: Beacon): boolean {
  return (
    appInitial.TNt?.(beacon) ?? beacon.ui_info.type === "beacon_carousel_info"
  );
}

function BeaconActions(props: Record<string, any>): unknown {
  const Component = pcaEligibility.c;
  if (Component == null) return null;
  return jsx.jsx(Component, props);
}

function imageForTheme(
  lightUrl: string | null | undefined,
  darkUrl: string | null | undefined,
  isDark: boolean,
  allowRemoteImages: boolean,
): string | null {
  const url = isDark && darkUrl != null ? darkUrl : lightUrl;
  return allowRemoteImages && isRemoteImageAllowed(url) ? url : null;
}

function informationalLink(
  beacon: Beacon,
  info: any,
  props: Record<string, any>,
): unknown {
  if (info == null || typeof info.url !== "string") return null;
  const internal = info.url.startsWith("/");
  if (!internal && props.allowExternalActions === false) return null;
  return jsx.jsx("a", {
    href: info.url,
    onClick: (event: any) => {
      if (props.eventMetadata?.suppressLifecycle !== true) {
        appInitial.ONt?.({
          beacon,
          eventType: "click",
          eventCtaId: info.id,
          metadata: props.eventMetadata,
          accountId: props.eventAccountId,
        });
      }
      if (internal) {
        event.preventDefault();
        props.navigate?.(info.url);
      } else {
        appInitial.Oft?.({
          event,
          href: info.url,
          initiator: "open_in_browser_bridge",
          openTarget: "external-browser",
        });
      }
    },
    children: info.text,
  });
}

function CodexAppHomeBeaconAnnouncementBanner(
  props: Record<string, any>,
): unknown {
  initializeCodexAppHomeBeaconAnnouncement();
  const beacon: Beacon = props.beacon;
  const intl = appShared.n4?.();
  const isDark = appShared.fg?.() === true;
  const ui = beacon.ui_info;
  const icon = imageForTheme(
    ui.icon_image_url,
    ui.icon_image_url_dark,
    isDark,
    props.allowRemoteImages !== false,
  );
  const infoLink = informationalLink(beacon, ui.informational_link, props);
  const description =
    infoLink == null
      ? ui.description
      : jsx.jsxs(jsx.Fragment, { children: [ui.description, " ", infoLink] });
  const ActionRenderer = BeaconActions;
  const actions = jsx.jsx(ActionRenderer, {
    actionItems: props.actionItems ?? beacon.action_items,
    actionOverrides: props.actionOverrides,
    allowExternalActions: props.allowExternalActions !== false,
    allowRemoteImages: props.allowRemoteImages !== false,
    analyticsContext: props.analyticsContext,
    beacon,
    eventAccountId: props.eventAccountId,
    eventMetadata: props.eventMetadata,
    getActionOverride: props.getActionOverride,
    onActionComplete: props.onActionComplete,
    onComposerText: props.onComposerText,
    onDismiss: props.onDismiss,
    onSendPrompt: props.onSendPrompt,
    onStartVoice: props.onStartVoice,
    variant: "banner",
  });
  const dismissLabel =
    intl?.formatMessage?.(
      {
        id: "codexAppHomeBeaconAnnouncement.dismiss",
        defaultMessage: "Dismiss {appName} beacon banner",
        description:
          "Accessible label for dismissing the backend-driven Codex app home banner",
      },
      { appName: appInitial.Mdn },
    ) ?? "Dismiss beacon banner";
  const Banner = appPrimary.Sm ?? "div";
  const dismissIcon = appShared.cw;
  return jsx.jsx("div", {
    className:
      props.analyticsContext?.productExperience === "chat"
        ? undefined
        : appPrimary.Hp,
    children: jsx.jsx(Banner, {
      variant: "beacon",
      attachedToComposer: ui.banner_design === "eyebrow_composer",
      actionsPlacement:
        ui.banner_design === "default" ? "aside" : "bodyOnNarrow",
      title: ui.title,
      description,
      leadingVisual:
        icon == null
          ? undefined
          : jsx.jsx("img", {
              alt: "",
              className: (
                { large: "size-12", medium: "size-9", small: "size-6" } as any
              )[ui.icon_image_size],
              src: icon,
            }),
      additionalActions: actions,
      dismissAction: {
        ariaLabel: dismissLabel,
        icon: dismissIcon,
        onClick: props.onDismiss,
      },
    }),
  });
}

function BeaconModal(props: Record<string, any>): unknown {
  const beacon: Beacon = props.beacon;
  const ui = beacon.ui_info;
  const isDark = appShared.fg?.() === true;
  const headerImage = imageForTheme(
    ui.header_image_url,
    ui.header_image_url_dark,
    isDark,
    props.allowRemoteImages !== false,
  );
  const Dialog = appShared.Ih ?? "div";
  const DialogBody = appShared.Oh ?? "div";
  return jsx.jsx(Dialog, {
    open: true,
    contentProps: { onOpenAutoFocus: props.onOpen },
    size: "beacon",
    variant: "beaconModal",
    onOpenChange: (open: boolean) => {
      if (!open) props.onDismiss?.();
    },
    children: jsx.jsxs(DialogBody, {
      variant: "chatgpt",
      children: [
        headerImage == null
          ? null
          : jsx.jsx("img", {
              alt: ui.header_image_alt ?? "",
              className: "w-full object-contain object-bottom",
              draggable: false,
              src: headerImage,
            }),
        jsx.jsxs("div", {
          className:
            "flex flex-col gap-6 px-8 pt-12 pb-8 text-center select-none",
          children: [
            jsx.jsx(appShared.Rh ?? "h2", { children: ui.title }),
            jsx.jsx(appShared.Lh ?? "p", { children: ui.description }),
          ],
        }),
        beacon.action_items.length === 0
          ? null
          : jsx.jsx("div", {
              className:
                "flex flex-col items-stretch justify-center gap-3 px-6 pb-8 sm:flex-row",
              children: jsx.jsx(BeaconActions, {
                ...props,
                actionItems: beacon.action_items,
                variant: "modal",
                useExternalBrowser: true,
              }),
            }),
        ui.footer_text == null
          ? null
          : jsx.jsx("div", {
              className: "px-8 pb-10 text-sm text-secondary select-none",
              children: ui.footer_text,
            }),
      ],
    }),
  });
}

function HomepageTakeover(props: Record<string, any>): unknown {
  const beacon: Beacon = props.beacon;
  const ui = beacon.ui_info;
  const isDark = appShared.fg?.() === true;
  const foreground = imageForTheme(
    ui.foreground_image_url,
    ui.foreground_image_url_dark,
    isDark,
    props.allowRemoteImages !== false,
  );
  if (foreground == null) return null;
  return jsx.jsxs("section", {
    "aria-label": ui.title,
    className:
      "relative isolate mx-auto flex min-h-[var(--height-token-empty-state-page)] w-full max-w-3xl flex-col items-center justify-end gap-4 overflow-hidden px-3 py-6 text-center select-none",
    "data-homepage-takeover": true,
    children: [
      jsx.jsx("img", {
        alt: "",
        "aria-hidden": true,
        className: "size-24 object-contain select-none",
        "data-testid": "homepage-takeover-foreground",
        src: foreground,
      }),
      jsx.jsxs("div", {
        className: "flex w-full max-w-xl flex-col items-center gap-4",
        children: [
          jsx.jsx("h2", { children: ui.title }),
          ui.subtitle == null ? null : jsx.jsx("p", { children: ui.subtitle }),
          jsx.jsx(BeaconActions, {
            ...props,
            actionItems: beacon.action_items,
            variant: "takeover",
          }),
        ],
      }),
    ],
  });
}

function MultiPageBeacon(props: Record<string, any>): unknown {
  const beacon: Beacon = props.beacon;
  const pages = beacon.ui_info.pages ?? [];
  const [pageIndex, setPageIndex] = React.useState(0);
  const page = pages[pageIndex] ?? pages[0];
  if (page == null) return null;
  const Dialog = appShared.Ih ?? "div";
  const DialogBody = appShared.Oh ?? "div";
  const Button = appShared.Yh ?? "button";
  const isLast = pageIndex === pages.length - 1;
  const ctaAction = beacon.action_items.find(
    (action) => action.id === page.cta_action_item_id,
  );
  const goTo = (next: number, method: string) => {
    const bounded = Math.min(Math.max(next, 0), pages.length - 1);
    if (bounded === pageIndex) return;
    const nextPage = pages[bounded];
    if (props.analyticsContext?.suppressLifecycle !== true) {
      appInitial.FNt?.(props.scope, beacon, {
        navigationMethod: method,
        page: nextPage,
        pageIndex: bounded,
      });
    }
    props.onPageShown?.({
      navigationMethod: method,
      pageId: nextPage.id,
      pageIndex: bounded,
    });
    setPageIndex(bounded);
  };
  return jsx.jsx(Dialog, {
    open: true,
    size: "beacon",
    variant: "beacon",
    onOpenChange: (open: boolean) => {
      if (!open) props.onDismiss?.();
    },
    contentProps: {
      onOpenAutoFocus: () => {
        props.onOpen?.();
        props.onPageShown?.({
          navigationMethod: "initial",
          pageId: page.id,
          pageIndex,
        });
      },
      onKeyDown: (event: any) => {
        if (event.key === "ArrowRight") goTo(pageIndex + 1, "keyboard");
        if (event.key === "ArrowLeft") goTo(pageIndex - 1, "keyboard");
      },
    },
    children: jsx.jsx(DialogBody, {
      variant: "chatgpt",
      children: jsx.jsxs("div", {
        className: "group pb-6",
        children: [
          jsx.jsxs("div", {
            className:
              "flex flex-col items-center gap-2 px-8 pt-10 text-center select-none",
            children: [
              page.media_type === "image" &&
              isRemoteImageAllowed(page.media_url)
                ? jsx.jsx("img", {
                    alt: page.media_alt,
                    className: "h-62.5 w-full object-cover",
                    src: page.media_url,
                  })
                : null,
              jsx.jsx(appShared.Rh ?? "h2", { children: page.title }),
              jsx.jsx(appShared.Lh ?? "p", { children: page.description }),
              page.footnote == null
                ? null
                : jsx.jsx("p", { children: page.footnote }),
            ],
          }),
          jsx.jsx("div", {
            className: "flex justify-center px-8 pt-6",
            children: jsx.jsx(BeaconActions, {
              ...props,
              actionItems:
                ctaAction == null
                  ? []
                  : [{ ...ctaAction, text: page.cta_text }],
              fallback: jsx.jsx(Button, {
                size: "beaconCarousel",
                onClick: () =>
                  isLast ? props.onDismiss?.() : goTo(pageIndex + 1, "cta"),
                children: page.cta_text,
              }),
              variant: "carousel",
            }),
          }),
          pages.length <= 1
            ? null
            : jsx.jsx("div", {
                role: "group",
                "aria-label": "Page progress",
                className: "mt-6 flex items-center justify-center",
                children: pages.map((candidate: any, index: number) =>
                  jsx.jsx(
                    Button,
                    {
                      "aria-current": index === pageIndex ? "page" : undefined,
                      "aria-label": `Go to page ${index + 1}`,
                      color: "ghost",
                      size: "paginationDot",
                      onClick: () => goTo(index, "dot"),
                    },
                    candidate.id,
                  ),
                ),
              }),
        ],
      }),
    }),
  });
}

function actionKey(beaconId: string, actionId: string): string {
  return appPrimary.yh?.({ actionId, beaconId }) ?? `${beaconId}:${actionId}`;
}

function CodexAppHomeBeaconAnnouncementContent(
  props: Record<string, any>,
): unknown {
  initializeCodexAppHomeBeaconAnnouncement();
  const key = JSON.stringify([
    props.accountId,
    props.actionAccountId,
    props.beacon.beacon_id,
    props.eventMetadata?.conversationId,
    props.eventMetadata?.messageId,
  ]);
  return jsx.jsx(BeaconAnnouncementController, { contentProps: props }, key);
}

function BeaconAnnouncementController({
  contentProps: props,
}: {
  contentProps: Record<string, any>;
}): unknown {
  const scope = appShared.LX?.(appShared.ZI);
  const beacon: Beacon = props.beacon;
  const actions = props.actionItems ?? beacon.action_items;
  const [connectorRequest, setConnectorRequest] = React.useState(null);
  const financeAbort = React.useRef(null) as {
    current: AbortController | null;
  };
  const navigate = appInitial.Ae?.() ?? props.navigate;
  const identity = appInitial.N6t?.() ?? {};
  const trustedAccountId =
    props.actionAccountId ?? identity.accountId ?? props.accountId;
  const dismiss = () => {
    financeAbort.current?.abort();
    if (props.analyticsContext != null) {
      appInitial.jNt?.(scope, {
        action: "dismiss",
        beacon,
        ...props.analyticsContext,
      });
    }
    if (props.onDismiss != null) props.onDismiss();
    else appPrimary.vh?.(scope, props.accountId, beacon);
  };
  const resolve = (action: BeaconAction) => {
    if (props.onActionComplete != null) props.onActionComplete(action);
    else appPrimary._h?.(scope, props.accountId, beacon);
  };
  const getActionOverride = (action: BeaconAction) => {
    const local =
      props.localActionHandlers?.[actionKey(beacon.beacon_id, action.id)];
    if (local != null) return () => local({ action, beacon });
    const explicit = props.getActionOverride?.(action);
    if (explicit !== undefined) return explicit;
    if (action.action_v2.action_enum === "connect_ledger_accounts") {
      if (trustedAccountId == null || props.allowExternalActions === false) {
        return appPrimary.Hm;
      }
      return async () => {
        if (financeAbort.current != null) return false;
        const controller = new AbortController();
        financeAbort.current = controller;
        try {
          const connected =
            await homeBeaconFinance.connectPersonalFinanceFromHomeBeacon?.(
              scope,
              {
                accountId: trustedAccountId,
                beacon,
                signal: controller.signal,
                suppressAnalytics:
                  props.analyticsContext?.suppressLifecycle === true ||
                  props.eventMetadata?.suppressLifecycle === true,
                onConversationStarted: (conversation: any) =>
                  navigate?.(appInitial.gln?.(conversation) ?? conversation),
              },
            );
          return connected
            ? {
                didComplete: true,
                eventAccountId: trustedAccountId,
                shouldResolve: true,
              }
            : false;
        } finally {
          financeAbort.current = null;
        }
      };
    }
    if (action.action_v2.action_enum === "open_pca_connector_auth_modal") {
      return () => {
        const target = pcaConnectorAction.t?.(scope, {
          connectorId: action.action_v2.connector_id,
          conversationId: props.pcaConversationId,
          includeConnectorSystemHint:
            action.action_v2.include_connector_system_hint_after_link !== false,
          triggerTurnAfterLink:
            action.action_v2.trigger_turn_after_link !== false,
        });
        if (target == null) return false;
        setConnectorRequest({ action, target });
        return {
          didComplete: true,
          eventAccountId: undefined,
          shouldResolve: false,
        };
      };
    }
  };

  const context = {
    scope,
    beacon,
    actionOverrides: props.actionOverrides,
    allowExternalActions: props.allowExternalActions !== false,
    eventMetadata: props.eventMetadata,
    getActionOverride,
    navigate,
    onComposerText: props.onComposerText,
    onDismiss: dismiss,
    onSendPrompt: props.onSendPrompt,
    onStartVoice: props.onStartVoice,
  };
  const variant = isBannerBeacon(beacon)
    ? "banner"
    : isCarouselBeacon(beacon)
      ? "carousel"
      : isTakeoverBeacon(beacon)
        ? "takeover"
        : "modal";
  const support = pcaEligibility.i?.({
    actionItems: actions,
    context,
    referencedActionIds: isCarouselBeacon(beacon)
      ? beacon.ui_info.pages.flatMap((page: any) =>
          page.cta_action_item_id == null ? [] : [page.cta_action_item_id],
        )
      : undefined,
    variant,
  }) ?? { status: "supported" };

  React.useEffect(() => {
    if (support.status !== "supported") {
      props.onUnsupported?.();
      return;
    }
    if (props.eventMetadata?.suppressLifecycle !== true) {
      appPrimary.xh?.(scope, props.accountId, beacon, props.eventMetadata);
    }
  }, [beacon, props.accountId, props.eventMetadata, scope, support.status]);

  let content: unknown = null;
  if (support.status === "supported") {
    const presentationProps = {
      ...props,
      actionItems: actions,
      beacon,
      getActionOverride,
      navigate,
      onActionComplete: resolve,
      onDismiss: dismiss,
      scope,
    };
    if (isBannerBeacon(beacon)) {
      content = jsx.jsx(
        CodexAppHomeBeaconAnnouncementBanner,
        presentationProps,
      );
    } else if (isTakeoverBeacon(beacon)) {
      content = jsx.jsx(HomepageTakeover, presentationProps);
    } else if (isModalBeacon(beacon)) {
      content = jsx.jsx(BeaconModal, presentationProps);
    } else if (isCarouselBeacon(beacon)) {
      content = jsx.jsx(MultiPageBeacon, presentationProps);
    }
  }
  if (connectorRequest != null) {
    const ConnectorModal = pcaEligibility.o;
    content = jsx.jsx(ConnectorModal, {
      connectorId: connectorRequest.action.action_v2.connector_id,
      pcaResumeTarget: connectorRequest.target,
      onOpenChange: (open: boolean) => {
        if (!open) setConnectorRequest(null);
      },
    });
  }
  if (props.renderPresentation != null) {
    return props.renderPresentation({
      content,
      supportStatus: support.status,
    });
  }
  return content;
}

function initializeCodexAppHomeBeaconAnnouncement(): void {
  if (initialized) return;
  initialized = true;
  appShared.FX?.();
  React = typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
  appShared.K2?.();
  appInitial.Qgn?.();
  appInitial.Zet?.();
  appInitial.Ndn?.();
  appInitial.Oln?.();
  appInitial.M6t?.();
  appInitial.DNt?.();
  pcaEligibility.d?.();
  appPrimary.Km?.();
  pcaEligibility.l?.();
  appInitial.ANt?.();
  pcaEligibility.s?.();
  pcaEligibility.a?.();
  appPrimary.th?.();
  pcaConnectorAction.n?.();
  pcaEligibility.n?.();
  appInitial.Sqt?.();
  appPrimary.Vp?.();
  appInitial.vln?.();
  appInitial.rht?.();
  appPrimary.bh?.();
  appInitial.Dft?.();
  appShared.lw?.();
  appPrimary.Cm?.();
  appShared.lk?.();
  appInitial.jW?.();
  appPrimary.Up?.();
  appPrimary.Dh?.();
  appInitial.JNt?.();
  appShared.QI?.();
  appInitial.pfn?.();
  appShared.dg?.();
  appShared.H3?.();
}

initializeCodexAppHomeBeaconAnnouncement();

export {
  CodexAppHomeBeaconAnnouncementBanner as n,
  initializeCodexAppHomeBeaconAnnouncement as r,
  CodexAppHomeBeaconAnnouncementContent as t,
};
