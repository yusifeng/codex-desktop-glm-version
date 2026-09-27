import "@rchunk/rolldown-runtime";
import {
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
import {
  Dbt as previewExpandedByKeySignal,
  Ebt as initializeLatestTurnPreviewState,
  Fbt as defaultPreviewExpandedSignal,
  bbt as updatePreviewExpandedMap,
  wbt as readPreviewExpanded,
} from "@rchunk/app-initial";
import { Io as Disclosure } from "@rchunk/app-primary";
import { u as panelDisplayModeSignal } from "@rchunk/virtualized-turn-list";
import { v as ConversationBlocks } from "@rchunk/conversation-blocks";

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
  onOpenDetails?(): void;
  visible?: boolean;
}

const MAX_PREVIEW_HEIGHT = "22.5rem";

function stopPanelOutsideDismiss(event: FocusEventLike): void {
  if (!(event.target instanceof Element)) return;
  if (
    event.target.closest('[data-app-shell-tab-strip-controller="right"]') != null ||
    event.target.matches('[role="tabpanel"][data-app-shell-tab-panel-controller="right"]')
  ) event.preventDefault();
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
        className: "!w-auto !overflow-visible !rounded-3xl !bg-transparent !p-0 !shadow-none !ring-0 !backdrop-blur-none",
        onCloseAutoFocus: preventAutoFocus,
        onFocusOutside: stopPanelOutsideDismiss,
        onOpenAutoFocus: preventAutoFocus,
        onPointerDownOutside: stopPanelOutsideDismiss,
        style: { maxHeight: "none", maxWidth: "none" },
        children: props.isOpen ? props.children : null,
      }),
    ],
  });
}

let initializedPopover = false;
function initializeLatestTurnPreviewPopover(): void {
  if (initializedPopover) return;
  initializedPopover = true;
  getJsxRuntime();
}

let OpenPendingSitePreview: ((props: Record<string, unknown>) => unknown) | undefined;
let SitePreviewPersistenceBridge: ((props: Record<string, unknown>) => unknown) | undefined;
let initializedLazyPreviews = false;
function initializeLatestTurnPreviewLazyComponents(): void {
  if (initializedLazyPreviews) return;
  initializedLazyPreviews = true;
  OpenPendingSitePreview = createLazyComponent(async () => {
    const module = await import("@rchunk/open-pending-site-preview");
    return module.OpenPendingSitePreview;
  });
  SitePreviewPersistenceBridge = createLazyComponent(async () => {
    const module = await import("@rchunk/site-preview-persistence-bridge");
    return module.SitePreviewPersistenceBridge;
  });
}

function LatestTurnPreviewSideEffects(): unknown {
  useScope(appScope);
  initializeLatestTurnPreviewLazyComponents();
  const runtime = getJsxRuntime();
  return runtime.jsxs(runtime.Fragment, {
    children: [
      OpenPendingSitePreview == null ? null : runtime.jsx(OpenPendingSitePreview, {}),
      SitePreviewPersistenceBridge == null ? null : runtime.jsx(SitePreviewPersistenceBridge, {}),
    ],
  });
}

function toggleLatestTurnPreview(scope: ScopeLike, key: true | string = true): void {
  const panel = scope.get(panelDisplayModeSignal) as PanelDisplayMode;
  const expanded = readPreviewExpanded(
    key === true
      ? scope.get(defaultPreviewExpandedSignal)
      : scope.get(previewExpandedByKeySignal, key),
    key,
  );
  if (panel.displayMode !== "overlay") {
    if (key === true) scope.set(defaultPreviewExpandedSignal, !expanded);
    else scope.set(previewExpandedByKeySignal, key, updatePreviewExpandedMap(key, !expanded));
    return;
  }
  const currentlyOpen = panel.isPopoverOpen || (typeof key !== "boolean" && expanded);
  if (typeof key !== "boolean") {
    scope.set(previewExpandedByKeySignal, key, updatePreviewExpandedMap(key, !currentlyOpen));
  }
  scope.set(panelDisplayModeSignal, { ...panel, isPopoverOpen: !currentlyOpen });
}

let initializedToggle = false;
function initializeLatestTurnPreviewToggle(): void {
  if (initializedToggle) return;
  initializedToggle = true;
  initializeSignalRuntime();
  initializeLatestTurnPreviewState();
}

function LatestTurnPreview(props: LatestTurnPreviewProps): unknown {
  const runtime = getJsxRuntime();
  const presentation = props.presentation ?? "inline";
  const isInline = presentation === "inline";
  const handleWheel = (event: WheelEventLike): void => {
    if (presentation !== "floating-visible" || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.stopPropagation();
    const nextExpanded = event.deltaY > 0;
    if (props.expanded !== nextExpanded) props.onExpandedChange(nextExpanded);
  };
  const title = props.headerLabel ?? runtime.jsx(FormattedMessage, {
    id: props.isTurnInProgress ? "composer.latestTurn.working" : "composer.latestTurn",
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
            className: "@container/latest-turn-preview [--edge-fade-distance:1rem] [animation-direction:reverse]",
            contentClassName: "gap-0 [&_[data-virtualized-turn-content]]:-ms-2.5 [&_[data-virtualized-turn-content]]:pb-1.5 [&_[data-virtualized-turn-content]]:ps-2.5",
            maxHeightByState: { collapsed: "0px", expanded: MAX_PREVIEW_HEIGHT, preview: MAX_PREVIEW_HEIGHT },
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
      visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0 delay-75",
    ),
    inert: !visible,
    children: item,
  });
}

function LunaReserveButton(props: LunaReserveButtonProps): unknown {
  if (props.visible === false) return null;
  const runtime = getJsxRuntime();
  return runtime.jsx(Button, {
    color: "ghostMuted",
    size: "inline",
    onClick: props.onOpenDetails,
    "data-host-id": props.hostId,
    children: runtime.jsxs("span", {
      children: [
        runtime.jsx("span", { "aria-hidden": true, className: "text-chart-yellow", children: "✦" }),
        runtime.jsx(FormattedMessage, { id: "codex.lunaReserve.header.label", defaultMessage: "Luna reserve" }),
      ],
    }),
  });
}

let initializedLunaReserve = false;
function initializeLunaReserveButton(): void {
  if (initializedLunaReserve) return;
  initializedLunaReserve = true;
  initializeSignalRuntime();
  getJsxRuntime();
  void Dialog;
}

let initializedLatestTurnPreview = false;
function initializeLatestTurnPreview(): void {
  if (initializedLatestTurnPreview) return;
  initializedLatestTurnPreview = true;
  initializeLatestTurnPreviewToggle();
  getJsxRuntime();
}

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
