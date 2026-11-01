// codex-app-home-beacon-announcement-core —— 后端驱动 Home Beacon 的展示与动作编排。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import { formatBeaconActionKey as createBeaconActionKey } from "../app-primary/runtime/format-beacon-action-key";
import * as appSharedChunk from "@rchunk/app-shared";
import * as homeBeaconFinanceChunk from "@rchunk/home-beacon-finance";
import * as homeAnnouncementStateChunk from "@rchunk/home-announcement-state";
import * as pcaConnectorActionChunk from "@rchunk/pca-connector-action";
import * as pcaEligibilityChunk from "@rchunk/pca-connector-eligibility";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  ANt: initializeBeaconActionAnalytics,
  Ae: useNavigate,
  CNt: isHomepageTakeoverBeacon,
  DNt: initializeBeaconPredicates,
  Dft: initializeExternalLinkBridge,
  FNt: logCarouselPageView,
  JNt: initializeOnboardingState,
  M6t: initializeIdentityState,
  Mdn: applicationName,
  N6t: useAccountIdentity,
  Ndn: initializeApplicationMetadata,
  ONt: logBeaconLifecycle,
  Oft: openExternalLink,
  Oln: initializeNavigation,
  Qgn: initializeAccountQueries,
  Sqt: initializeManagedDialogState,
  TNt: isCarouselBeaconRecord,
  Zet: initializeComposerState,
  gln: conversationRoute,
  jNt: logBeaconAction,
  jW: initializePlaidIntegration,
  pfn: initializeFinanceFeatureFlags,
  rht: initializeAccountState,
  vln: initializePlanEligibility,
  wNt: isModalBeaconRecord,
  yNt: isBannerBeaconRecord,
} = appInitialChunk;
const {
  $m: isAllowedRemoteImage,
  Dh: initializePageContextAvailability,
  Hm: unavailableActionOverride,
  Hp: nonChatBeaconClassName,
  Km: initializeBeaconActions,
  Up: initializeBeaconDialog,
  Vp: initializeBeaconPresentation,
  _h: resolveBeacon,
  bh: initializeBeaconLifecycle,
  th: initializeBeaconActionOverrides,
  vh: dismissBeacon,
  xh: recordBeaconView,
} = appPrimaryChunk;
const announcementPresentation = (
  homeAnnouncementStateChunk.t as typeof homeAnnouncementStateChunk.t & {
    presentation: {
      Banner: (props: Record<string, unknown>) => unknown;
      initializeBanner(): void;
    };
  }
).presentation;
const {
  Banner,
  initializeBanner,
} = announcementPresentation;
const {
  FX: initializeSignalRuntime,
  H3: initializeDialogUi,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeIntl,
  LX: useSignalScope,
  Lh: Text,
  Oh: DialogBody,
  QI: initializeQueryRuntime,
  Rh: Heading,
  Yh: Button,
  ZI: applicationScope,
  cw: DismissIcon,
  dg: initializeTheme,
  e6: reactRuntime,
  fg: useIsDarkTheme,
  lk: initializeToastUi,
  lw: initializeImportIcons,
  n4: useIntl,
} = appSharedChunk;
const { connectPersonalFinanceFromHomeBeacon } = homeBeaconFinanceChunk;
const {
  n: initializePcaConnectorAction,
  t: createPcaResumeTarget,
} = pcaConnectorActionChunk;
const {
  a: initializePcaActionMenu,
  c: PcaBeaconActions,
  d: initializePcaEligibility,
  i: getPcaActionSupport,
  l: initializePcaActionRenderer,
  n: initializePcaConnectorModal,
  o: PcaConnectorModal,
  s: initializePcaActionOverrides,
} = pcaEligibilityChunk;

type BeaconAction = {
  id: string;
  text?: string;
  type?: string;
  action_v2: {
    action_enum: string;
    connector_id?: string;
    include_connector_system_hint_after_link?: boolean;
    items?: BeaconAction[];
    trigger_turn_after_link?: boolean;
    [key: string]: unknown;
  };
};

interface BeaconCarouselPage {
  cta_action_item_id?: string | null;
  cta_text: string;
  description?: unknown;
  footnote?: unknown;
  id: string;
  media_alt?: string;
  media_type?: string;
  media_url?: string;
  title?: unknown;
}

interface BeaconUiInfo extends Record<string, unknown> {
  banner_design?: string;
  description?: unknown;
  footer_text?: unknown;
  foreground_image_url?: string | null;
  foreground_image_url_dark?: string | null;
  header_image_alt?: string;
  header_image_url?: string | null;
  header_image_url_dark?: string | null;
  icon_image_size?: "large" | "medium" | "small";
  icon_image_url?: string | null;
  icon_image_url_dark?: string | null;
  informational_link?: BeaconInformationalLink | null;
  pages?: BeaconCarouselPage[];
  subtitle?: unknown;
  title?: unknown;
  type?: string;
}

type Beacon = {
  beacon_id: string;
  beacon_name?: string;
  action_items: BeaconAction[];
  ui_info: BeaconUiInfo;
};

interface BeaconInformationalLink {
  id?: string;
  text?: unknown;
  url: string;
}

interface BeaconEventMetadata {
  conversationId?: string;
  messageId?: string;
  suppressLifecycle?: boolean;
}

interface BeaconAnalyticsContext extends Record<string, unknown> {
  productExperience?: "chat" | "work";
  suppressLifecycle?: boolean;
}

interface BeaconAnnouncementProps extends Record<string, unknown> {
  accountId: string;
  actionAccountId?: string | null;
  actionItems?: BeaconAction[];
  actionOverrides?: unknown;
  allowExternalActions?: boolean;
  allowRemoteImages?: boolean;
  analyticsContext?: BeaconAnalyticsContext;
  beacon: Beacon;
  eventAccountId?: string;
  eventMetadata?: BeaconEventMetadata;
  getActionOverride?(action: BeaconAction): unknown;
  localActionHandlers?: Record<
    string,
    (input: { action: BeaconAction; beacon: Beacon }) => unknown
  >;
  navigate?(destination: unknown): void;
  onActionComplete?(action: BeaconAction): void;
  onComposerText?(text: string): void;
  onDismiss?(): void;
  onOpen?(): void;
  onPageShown?(input: {
    navigationMethod: string;
    pageId: string;
    pageIndex: number;
  }): void;
  onSendPrompt?(prompt: string): void;
  onStartVoice?(): void;
  onUnsupported?(): void;
  pcaConversationId?: string;
  renderPresentation?(input: {
    content: unknown;
    supportStatus: string;
  }): unknown;
  scope?: unknown;
}

interface BeaconClickEvent {
  preventDefault(): void;
}

interface BeaconKeyboardEvent {
  key: string;
}

interface ConnectorRequest {
  action: BeaconAction;
  target: unknown;
}

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useRef<Value>(initialValue: Value): { current: Value };
  useState<Value>(initialValue: Value): [
    Value,
    (value: Value | ((current: Value) => Value)) => void,
  ];
}

let React: ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;
let initialized = false;

function isRemoteImageAllowed(url: unknown): url is string {
  return (
    typeof url === "string" &&
    (isAllowedRemoteImage?.(url) ?? /^https?:/.test(url))
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
    isBannerBeaconRecord?.(beacon) ??
    beacon.ui_info.type === "beacon_banner_info"
  );
}

function isTakeoverBeacon(beacon: Beacon): boolean {
  return (
    isHomepageTakeoverBeacon?.(beacon) ??
    beacon.ui_info.type === "homepage_takeover"
  );
}

function isModalBeacon(beacon: Beacon): boolean {
  return (
    isModalBeaconRecord?.(beacon) ??
    beacon.ui_info.type === "beacon_modal_info"
  );
}

function isCarouselBeacon(beacon: Beacon): boolean {
  return (
    isCarouselBeaconRecord?.(beacon) ??
    beacon.ui_info.type === "beacon_carousel_info"
  );
}

function BeaconActions(props: BeaconAnnouncementProps): unknown {
  const Component = PcaBeaconActions;
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
  info: BeaconInformationalLink | null | undefined,
  props: BeaconAnnouncementProps,
): unknown {
  if (info == null || typeof info.url !== "string") return null;
  const internal = info.url.startsWith("/");
  if (!internal && props.allowExternalActions === false) return null;
  return jsx.jsx("a", {
    href: info.url,
    onClick: (event: BeaconClickEvent) => {
      if (props.eventMetadata?.suppressLifecycle !== true) {
        logBeaconLifecycle?.({
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
        openExternalLink?.({
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
  props: BeaconAnnouncementProps,
): unknown {
  initializeCodexAppHomeBeaconAnnouncement();
  const beacon: Beacon = props.beacon;
  const intl = useIntl();
  const isDark = useIsDarkTheme?.() === true;
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
      { appName: applicationName },
    ) ?? "Dismiss beacon banner";
  return jsx.jsx("div", {
    className:
      props.analyticsContext?.productExperience === "chat"
        ? undefined
        : nonChatBeaconClassName,
    children: jsx.jsx(Banner ?? "div", {
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
                { large: "size-12", medium: "size-9", small: "size-6" }
              )[ui.icon_image_size ?? "large"],
              src: icon,
            }),
      additionalActions: actions,
      dismissAction: {
        ariaLabel: dismissLabel,
        icon: DismissIcon,
        onClick: props.onDismiss,
      },
    }),
  });
}

function BeaconModal(props: BeaconAnnouncementProps): unknown {
  const beacon: Beacon = props.beacon;
  const ui = beacon.ui_info;
  const isDark = useIsDarkTheme?.() === true;
  const headerImage = imageForTheme(
    ui.header_image_url,
    ui.header_image_url_dark,
    isDark,
    props.allowRemoteImages !== false,
  );
  return jsx.jsx(Dialog ?? "div", {
    open: true,
    contentProps: { onOpenAutoFocus: props.onOpen },
    size: "beacon",
    variant: "beaconModal",
    onOpenChange: (open: boolean) => {
      if (!open) props.onDismiss?.();
    },
    children: jsx.jsxs(DialogBody ?? "div", {
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
            jsx.jsx(Heading ?? "h2", { children: ui.title }),
            jsx.jsx(Text ?? "p", { children: ui.description }),
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

function HomepageTakeover(props: BeaconAnnouncementProps): unknown {
  const beacon: Beacon = props.beacon;
  const ui = beacon.ui_info;
  const isDark = useIsDarkTheme?.() === true;
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

function MultiPageBeacon(props: BeaconAnnouncementProps): unknown {
  const beacon: Beacon = props.beacon;
  const pages = beacon.ui_info.pages ?? [];
  const [pageIndex, setPageIndex] = React.useState(0);
  const page = pages[pageIndex] ?? pages[0];
  if (page == null) return null;
  const isLast = pageIndex === pages.length - 1;
  const ctaAction = beacon.action_items.find(
    (action) => action.id === page.cta_action_item_id,
  );
  const goTo = (next: number, method: string) => {
    const bounded = Math.min(Math.max(next, 0), pages.length - 1);
    if (bounded === pageIndex) return;
    const nextPage = pages[bounded];
    if (props.analyticsContext?.suppressLifecycle !== true) {
      logCarouselPageView?.(props.scope, beacon, {
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
  return jsx.jsx(Dialog ?? "div", {
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
      onKeyDown: (event: BeaconKeyboardEvent) => {
        if (event.key === "ArrowRight") goTo(pageIndex + 1, "keyboard");
        if (event.key === "ArrowLeft") goTo(pageIndex - 1, "keyboard");
      },
    },
    children: jsx.jsx(DialogBody ?? "div", {
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
              jsx.jsx(Heading ?? "h2", { children: page.title }),
              jsx.jsx(Text ?? "p", { children: page.description }),
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
              fallback: jsx.jsx(Button ?? "button", {
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
                children: pages.map((candidate, index: number) =>
                  jsx.jsx(
                    Button ?? "button",
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
  return createBeaconActionKey?.({ actionId, beaconId }) ??
    `${beaconId}:${actionId}`;
}

function CodexAppHomeBeaconAnnouncementContent(
  props: BeaconAnnouncementProps,
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
  contentProps: BeaconAnnouncementProps;
}): unknown {
  const scope = useSignalScope(applicationScope);
  const beacon: Beacon = props.beacon;
  const actions = props.actionItems ?? beacon.action_items;
  const [connectorRequest, setConnectorRequest] =
    React.useState<ConnectorRequest | null>(null);
  const financeAbort = React.useRef<AbortController | null>(null);
  const navigate = useNavigate?.() ?? props.navigate;
  const identity = useAccountIdentity?.() ?? {};
  const trustedAccountId =
    props.actionAccountId ?? identity.accountId ?? props.accountId;
  const dismiss = () => {
    financeAbort.current?.abort();
    if (props.analyticsContext != null) {
      logBeaconAction?.(scope, {
        action: "dismiss",
        beacon,
        ...props.analyticsContext,
      });
    }
    if (props.onDismiss != null) props.onDismiss();
    else dismissBeacon?.(scope, props.accountId, beacon);
  };
  const resolve = (action: BeaconAction) => {
    if (props.onActionComplete != null) props.onActionComplete(action);
    else resolveBeacon?.(scope, props.accountId, beacon);
  };
  const getActionOverride = (action: BeaconAction) => {
    const local =
      props.localActionHandlers?.[actionKey(beacon.beacon_id, action.id)];
    if (local != null) return () => local({ action, beacon });
    const explicit = props.getActionOverride?.(action);
    if (explicit !== undefined) return explicit;
    if (action.action_v2.action_enum === "connect_ledger_accounts") {
      if (trustedAccountId == null || props.allowExternalActions === false) {
        return unavailableActionOverride;
      }
      return async () => {
        if (financeAbort.current != null) return false;
        const controller = new AbortController();
        financeAbort.current = controller;
        try {
          const connected =
            await connectPersonalFinanceFromHomeBeacon?.(
              scope,
              {
                accountId: trustedAccountId,
                beacon,
                signal: controller.signal,
                suppressAnalytics:
                  props.analyticsContext?.suppressLifecycle === true ||
                  props.eventMetadata?.suppressLifecycle === true,
                onConversationStarted: (conversation: unknown) =>
                  navigate?.(conversationRoute?.(conversation) ?? conversation),
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
        const target = createPcaResumeTarget?.(scope, {
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
  const support = getPcaActionSupport?.({
    actionItems: actions,
    context,
    referencedActionIds: isCarouselBeacon(beacon)
      ? (beacon.ui_info.pages ?? []).flatMap((page) =>
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
      recordBeaconView?.(scope, props.accountId, beacon, props.eventMetadata);
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
    content = jsx.jsx(PcaConnectorModal, {
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
  initializeSignalRuntime?.();
  React =
    typeof reactRuntime === "function" ? reactRuntime() : reactRuntime;
  jsx = typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
  initializeIntl?.();
  initializeAccountQueries?.();
  initializeComposerState?.();
  initializeApplicationMetadata?.();
  initializeNavigation?.();
  initializeIdentityState?.();
  initializeBeaconPredicates?.();
  initializePcaEligibility?.();
  initializeBeaconActions?.();
  initializePcaActionRenderer?.();
  initializeBeaconActionAnalytics?.();
  initializePcaActionOverrides?.();
  initializePcaActionMenu?.();
  initializeBeaconActionOverrides?.();
  initializePcaConnectorAction?.();
  initializePcaConnectorModal?.();
  initializeManagedDialogState?.();
  initializeBeaconPresentation?.();
  initializePlanEligibility?.();
  initializeAccountState?.();
  initializeBeaconLifecycle?.();
  initializeExternalLinkBridge?.();
  initializeImportIcons?.();
  initializeBanner?.();
  initializeToastUi?.();
  initializePlaidIntegration?.();
  initializeBeaconDialog?.();
  initializePageContextAvailability?.();
  initializeOnboardingState?.();
  initializeQueryRuntime?.();
  initializeFinanceFeatureFlags?.();
  initializeTheme?.();
  initializeDialogUi?.();
}

initializeCodexAppHomeBeaconAnnouncement();

export {
  CodexAppHomeBeaconAnnouncementBanner as n,
  initializeCodexAppHomeBeaconAnnouncement as r,
  CodexAppHomeBeaconAnnouncementContent as t,
};
