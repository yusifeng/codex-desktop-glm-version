import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  BX as useParameterizedSignal,
  HX as useSignalValue,
  I3 as getJsxRuntime,
  Jm as createLazyComponent,
  LX as useScope,
  Tf as PopoverTrigger,
  Y2 as FormattedMessage,
  Yh as Button,
  ZI as appScope,
  Cf as PopoverContent,
  FX as initializeSignalRuntime,
  Ih as Dialog,
  m4 as classNames,
  xf as Popover,
} from "@rchunk/app-shared";
import * as sharedChunk from "@rchunk/app-shared";
import {
  Dbt as previewExpandedByKeySignal,
  Ebt as initializeLatestTurnPreviewState,
  Fbt as defaultPreviewExpandedSignal,
  bbt as updatePreviewExpandedMap,
  wbt as readPreviewExpanded,
} from "@rchunk/app-initial";
import * as initialChunk from "@rchunk/app-initial";
import { Io as Disclosure } from "@rchunk/app-primary";
import * as primaryChunk from "@rchunk/app-primary";
import {
  c as initializePanelSurfaceState,
  u as panelDisplayModeSignal,
} from "@rchunk/virtualized-turn-list";
import { v as ConversationBlocks } from "@rchunk/conversation-blocks";
import * as conversationBlocksChunk from "@rchunk/conversation-blocks";

const once = onceExport as (initializer: () => void) => () => void;

interface ScopeLike {
  get(signal: unknown, parameter?: unknown): unknown;
  set(signal: unknown, valueOrParameter: unknown, value?: unknown): void;
}

interface PanelDisplayMode {
  displayMode: "gutter" | "overlay" | "shift";
  isPopoverOpen: boolean;
}

interface PreviewExpandedMap extends Record<string, boolean> {}

interface LatestTurnPreviewProps {
  expanded: boolean;
  headerLabel?: unknown;
  isTurnInProgress: boolean;
  latestTurnContentRef?: unknown;
  onExpandedChange(expanded: boolean): void;
  presentation?: "floating-hidden" | "floating-visible" | "inline";
  threadPreview: unknown;
}

interface PreviewPopoverProps {
  children?: unknown;
  isOpen: boolean;
  onOpenChange(open: boolean): void;
  shouldPreventAutoFocus?: boolean;
  trigger: unknown;
}

interface WheelEventLike {
  deltaX: number;
  deltaY: number;
  stopPropagation(): void;
}

interface FocusEventLike {
  preventDefault(): void;
  target: unknown;
}

interface LunaReserveButtonProps {
  hostId: string;
}

const MAX_PREVIEW_HEIGHT = "22.5rem";
function callInitializer(value: unknown): void {
  if (typeof value === "function") value();
}

function stopPanelPointerDismiss(event: FocusEventLike): void {
  if (!(event.target instanceof Element)) return;
  if (
    event.target.closest('[data-app-shell-tab-strip-controller="right"]') !=
    null
  )
    event.preventDefault();
}

function stopPanelFocusDismiss(event: FocusEventLike): void {
  if (!(event.target instanceof Element)) return;
  if (
    event.target.matches(
      '[role="tabpanel"][data-app-shell-tab-panel-controller="right"]',
    )
  )
    event.preventDefault();
}

function LatestTurnPreviewPopover(props: PreviewPopoverProps): unknown {
  const runtime = getJsxRuntime();
  const preventAutoFocus = (event: { preventDefault(): void }): void => {
    if (props.shouldPreventAutoFocus === true) event.preventDefault();
  };
  return runtime.jsxs(Popover, {
    open: props.isOpen,
    onOpenChange: props.onOpenChange,
    children: [
      runtime.jsx(PopoverTrigger, { asChild: true, children: props.trigger }),
      runtime.jsx(PopoverContent, {
        align: "end",
        side: "bottom",
        sideOffset: 16,
        className:
          "!w-auto !overflow-visible !rounded-3xl !bg-transparent !p-0 !shadow-none !ring-0 !backdrop-blur-none",
        onCloseAutoFocus: preventAutoFocus,
        onFocusOutside: stopPanelFocusDismiss,
        onOpenAutoFocus: preventAutoFocus,
        onPointerDownOutside: stopPanelPointerDismiss,
        style: { maxHeight: "none", maxWidth: "none" },
        children: props.isOpen ? props.children : null,
      }),
    ],
  });
}

const initializeLatestTurnPreviewPopover = once((): void => {
  callInitializer((sharedChunk as any).$3);
  callInitializer((sharedChunk as any).Ef);
  getJsxRuntime();
});

const initializeLatestTurnPreviewLazyComponents = once((): void => {
  for (const candidate of [
    (sharedChunk as any).$3,
    initializeSignalRuntime,
    (initialChunk as any).nqt,
    (sharedChunk as any).qm,
    (initialChunk as any).itn,
    (primaryChunk as any).df,
  ])
    callInitializer(candidate);
  getJsxRuntime();
  callInitializer((sharedChunk as any).H3);
  createLazyComponent(async () => {
    const module = await import("@rchunk/open-pending-site-preview");
    return module.OpenPendingSitePreview;
  });
  createLazyComponent(async () => {
    const module = await import("@rchunk/site-preview-persistence-bridge");
    return module.SitePreviewPersistenceBridge;
  });
});

function LatestTurnPreviewSideEffects(): unknown {
  useScope((initialChunk as any).$en ?? appScope);
  const session = (useSignalValue as unknown as (signal: unknown) => any)(
    (primaryChunk as any).pf,
  );
  (
    useParameterizedSignal as unknown as (
      signal: unknown,
      key: unknown,
    ) => unknown
  )(
    (initialChunk as any).tqt,
    session?.hostId == null ? (session?.conversationId ?? null) : null,
  );
  return null;
}

function toggleLatestTurnPreview(
  scope: ScopeLike,
  key: true | string = true,
): void {
  const panel = scope.get(panelDisplayModeSignal) as PanelDisplayMode;
  const expanded = readPreviewExpanded(
    key === true
      ? scope.get(defaultPreviewExpandedSignal)
      : scope.get(previewExpandedByKeySignal, key),
    key,
  );
  if (panel.displayMode !== "overlay") {
    if (key === true) scope.set(defaultPreviewExpandedSignal, !expanded);
    else
      scope.set(
        previewExpandedByKeySignal,
        key,
        updatePreviewExpandedMap(key, !expanded),
      );
    return;
  }
  const currentlyOpen =
    panel.isPopoverOpen || (typeof key !== "boolean" && expanded);
  if (typeof key !== "boolean") {
    scope.set(
      previewExpandedByKeySignal,
      key,
      updatePreviewExpandedMap(key, !currentlyOpen),
    );
  }
  scope.set(panelDisplayModeSignal, {
    ...panel,
    isPopoverOpen: !currentlyOpen,
  });
}

const initializeLatestTurnPreviewToggle = once((): void => {
  initializeLatestTurnPreviewState();
  initializePanelSurfaceState();
});

function LatestTurnPreview(props: LatestTurnPreviewProps): unknown {
  const runtime = getJsxRuntime();
  const presentation = props.presentation ?? "inline";
  const isInline = presentation === "inline";
  const handleWheel = (event: WheelEventLike): void => {
    if (
      presentation !== "floating-visible" ||
      Math.abs(event.deltaY) <= Math.abs(event.deltaX)
    )
      return;
    event.stopPropagation();
    const nextExpanded = event.deltaY > 0;
    if (props.expanded !== nextExpanded) props.onExpandedChange(nextExpanded);
  };
  const title =
    props.headerLabel ??
    runtime.jsx(FormattedMessage, {
      id: props.isTurnInProgress
        ? "composer.latestTurn.working"
        : "composer.latestTurn",
      defaultMessage: props.isTurnInProgress ? "Working" : "Latest turn",
    });
  const item = runtime.jsxs(Disclosure.Item, {
    overlap: isInline,
    children: [
      runtime.jsx(Disclosure.DisclosureRow, {
        "data-right-panel-composer-overlay-safe-area-header": "true",
        expanded: props.expanded,
        onExpandedChange: props.onExpandedChange,
        onWheel: handleWheel,
        titleClassName: "truncate",
        title,
      }),
      runtime.jsx(Disclosure.DisclosureBody, {
        ref: props.latestTurnContentRef,
        expanded: props.expanded,
        maxHeight: MAX_PREVIEW_HEIGHT,
        tabIndex: -1,
        children: runtime.jsx(Disclosure.Body, {
          children: runtime.jsx(ConversationBlocks, {
            items: [{ key: "latest-turn-preview", node: props.threadPreview }],
            allowHorizontalScroll: true,
            className:
              "@container/latest-turn-preview [--edge-fade-distance:1rem] [animation-direction:reverse]",
            contentClassName:
              "gap-0 [&_[data-virtualized-turn-content]]:-ms-2.5 [&_[data-virtualized-turn-content]]:pb-1.5 [&_[data-virtualized-turn-content]]:ps-2.5",
            maxHeightByState: {
              collapsed: "0px",
              expanded: MAX_PREVIEW_HEIGHT,
              preview: MAX_PREVIEW_HEIGHT,
            },
            viewState: "expanded",
          }),
        }),
      }),
    ],
  });
  if (isInline) return item;
  const visible = presentation === "floating-visible";
  return runtime.jsx("div", {
    "aria-hidden": !visible,
    className: classNames(
      "absolute inset-x-10 bottom-0 z-0 transition-[opacity,translate] duration-basic ease-enter-snappy motion-reduce:transition-none",
      visible
        ? "translate-y-0 opacity-100"
        : "pointer-events-none translate-y-full opacity-0 delay-75",
    ),
    inert: !visible,
    children: item,
  });
}

function LunaReserveDialog(props: {
  hostId: string;
  onClose(): void;
  rateLimitStatus: any;
}): unknown {
  const runtime = getJsxRuntime();
  const scope = useScope(appScope) as any;
  const darkMode = Boolean((sharedChunk as any).fg?.());
  const banner = props.rateLimitStatus?.rate_limit_upsell;
  const eligible = (
    useParameterizedSignal as unknown as (
      signal: unknown,
      key: unknown,
    ) => unknown
  )((initialChunk as any).Z8, props.hostId);
  if (!eligible || banner == null) return null;
  const actions = (initialChunk as any).eP;
  const track = (initialChunk as any).ZN as (
    scope: unknown,
    event: unknown,
  ) => void;
  const renderContent = (resolved: any) =>
    runtime.jsx("div", {
      className: "self-center",
      children: runtime.jsx((sharedChunk as any).kh ?? "div", {
        expandSingleButton: false,
        children: (banner.ctas ?? [])
          .map((cta: any, index: number) => {
            if (!(initialChunk as any).YN?.(cta.action)) return null;
            const action = resolved.actions[cta.action];
            return runtime.jsx(
              Button,
              {
                color: index === 0 ? "primary" : "secondary",
                disabled: action.disabled,
                size: "large",
                onClick: (event: unknown) => {
                  track(scope, {
                    action:
                      actions.CODEX_LUNA_RESERVE_LIFECYCLE_ACTION_MODAL_CTA_CLICKED,
                    ctaAction: cta.action,
                    source: "details_modal",
                  });
                  action.log();
                  props.onClose();
                  action.onClick(event);
                },
                children: cta.label,
              },
              `${cta.action}:${index}`,
            );
          })
          .reverse(),
      }),
    });
  const BannerActions = (initialChunk as any).LN;
  const title = runtime.jsx((sharedChunk as any).Rh, {
    className: "contents",
    children: runtime.jsx(FormattedMessage, {
      id: "codex.lunaReserve.dialog.title",
      defaultMessage: "Regain access to our most powerful models",
    }),
  });
  const heading = runtime.jsx((sharedChunk as any).jh, {
    className: "items-center pb-2",
    children: runtime.jsx((sharedChunk as any).Ah, {
      className: "items-center",
      titleClassName: "text-center",
      subtitleTone: "secondary",
      subtitleClassName: "text-center",
      title,
      subtitle: runtime.jsx((sharedChunk as any).Lh, {
        className: "contents",
        children: runtime.jsx(FormattedMessage, {
          id: "codex.lunaReserve.dialog.description",
          defaultMessage:
            "You are now chatting with Luna. Continue to access our most capable models.",
        }),
      }),
    }),
  });
  return runtime.jsxs(Dialog, {
    open: true,
    size: "default",
    onOpenChange: props.onClose,
    children: [
      runtime.jsx("div", {
        className: "overflow-hidden",
        children: runtime.jsx("img", {
          alt: "",
          "aria-hidden": "true",
          className: classNames(
            "block w-full scale-105 object-cover",
            !darkMode && "-mb-6",
          ),
          src: darkMode
            ? "https://persistent.oaistatic.com/chatgpt/tpp/luna-reserve-modal-hero-dark.png"
            : "https://persistent.oaistatic.com/chatgpt/tpp/luna-reserve-modal-hero-light.png",
        }),
      }),
      runtime.jsxs((sharedChunk as any).Oh, {
        children: [
          heading,
          runtime.jsx((sharedChunk as any).jh, {
            className: "items-center",
            children: runtime.jsx(BannerActions, {
              banner,
              rateLimitStatus: props.rateLimitStatus,
              renderContent,
            }),
          }),
        ],
      }),
    ],
  });
}

function LunaReserveButton(props: LunaReserveButtonProps): unknown {
  const runtime = getJsxRuntime();
  const scope = useScope(appScope) as any;
  const eligible = (
    useParameterizedSignal as unknown as (
      signal: unknown,
      key: unknown,
    ) => unknown
  )((initialChunk as any).Z8, props.hostId);
  if (!eligible) return null;
  const onClick = (): void => {
    const actions = (initialChunk as any).eP;
    const track = (initialChunk as any).ZN as (
      scope: unknown,
      event: unknown,
    ) => void;
    track(scope, {
      action: actions.CODEX_LUNA_RESERVE_LIFECYCLE_ACTION_HEADER_BUTTON_CLICKED,
      source: "thread_header",
    });
    const rateLimitStatus = scope.query.getData((initialChunk as any).f0t);
    if (rateLimitStatus != null) {
      (initialChunk as any).Uzt(scope, LunaReserveDialog, {
        hostId: props.hostId,
        rateLimitStatus,
      });
      track(scope, {
        action: actions.CODEX_LUNA_RESERVE_LIFECYCLE_ACTION_MODAL_OPENED,
        source: "details_modal",
      });
      return;
    }
    track(scope, {
      action: actions.CODEX_LUNA_RESERVE_LIFECYCLE_ACTION_ERROR,
      errorCode: "missing_usage_status",
      source: "thread_header",
    });
  };
  return runtime.jsx(Button, {
    color: "ghostMuted",
    size: "inline",
    onClick,
    children: runtime.jsxs((initialChunk as any).fit ?? "span", {
      variant: "reserve",
      children: [
        runtime.jsx("span", {
          "aria-hidden": true,
          className: "text-chart-yellow",
          children: (initialChunk as any).Y8 ?? "✦",
        }),
        runtime.jsx("span", {
          className: "brightness-75 dark:brightness-100",
          children: runtime.jsx(FormattedMessage, {
            id: "codex.lunaReserve.header.label",
            defaultMessage: "Luna reserve",
          }),
        }),
      ],
    }),
  });
}

const initializeLunaReserveButton = once((): void => {
  for (const candidate of [
    (sharedChunk as any).$3,
    (initialChunk as any).tP,
    initializeSignalRuntime,
    (sharedChunk as any).K2,
    (initialChunk as any).pit,
    (sharedChunk as any).h4,
    (initialChunk as any).Vzt,
    (initialChunk as any).d0t,
    (sharedChunk as any).QI,
    (initialChunk as any).XN,
  ])
    callInitializer(candidate);
  initializeLunaReserveDialog();
  callInitializer((initialChunk as any).X8);
  getJsxRuntime();
});

const initializeLunaReserveDialog = once((): void => {
  for (const candidate of [
    (sharedChunk as any).$3,
    (initialChunk as any).tP,
    (sharedChunk as any).h4,
    initializeSignalRuntime,
    (sharedChunk as any).K2,
    (sharedChunk as any).Zh,
    (sharedChunk as any).zh,
    (sharedChunk as any).Ph,
    (initialChunk as any).JN,
    (initialChunk as any).RN,
    (sharedChunk as any).QI,
    (sharedChunk as any).dg,
    (initialChunk as any).XN,
    (initialChunk as any).X8,
  ])
    callInitializer(candidate);
  getJsxRuntime();
});

const initializeLatestTurnPreview = once((): void => {
  callInitializer((sharedChunk as any).$3);
  callInitializer((sharedChunk as any).h4);
  callInitializer((sharedChunk as any).K2);
  callInitializer((conversationBlocksChunk as any).y);
  callInitializer((primaryChunk as any).Lo);
  getJsxRuntime();
});

export {
  LatestTurnPreviewPopover as a,
  initializeLatestTurnPreviewLazyComponents as c,
  toggleLatestTurnPreview as i,
  LunaReserveButton as l,
  initializeLatestTurnPreview as n,
  initializeLatestTurnPreviewPopover as o,
  initializeLatestTurnPreviewToggle as r,
  LatestTurnPreviewSideEffects as s,
  LatestTurnPreview as t,
  initializeLunaReserveButton as u,
};
