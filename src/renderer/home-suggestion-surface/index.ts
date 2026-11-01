import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import { n as initializeSuggestionCard, t as SuggestionCard } from "@rchunk/suggestion-card";
import { n as initializeHomeSuggestionList, t as HomeSuggestionList } from "@rchunk/home-suggestion-list";
import { n as initializeStaggeredItem, t as StaggeredItem } from "@rchunk/home-suggestion-staggered-item";

export interface HomeSuggestionSurfaceItem {
  disabled?: boolean;
  icon?: unknown;
  id: string;
  label: string;
  onClick?(): void;
  onDismiss?(): void;
  tooltipContent?: unknown;
  tooltipInteractive?: boolean;
  [key: string]: unknown;
}

interface HomeSuggestionSurfaceProps {
  composerMode?: string | null;
  headline?: unknown;
  hideSuggestions?: boolean;
  isRefreshing?: boolean;
  items: HomeSuggestionSurfaceItem[];
  layout?: "cards" | "list";
  onRefresh?(): void;
  onSuggestionGridColumnCountChange?(count: number): void;
  showCloseAction?: boolean;
  showTemplateSelection?: boolean;
}

interface SuggestionPortalContext {
  followUpSuggestionsPlacement?: "above-composer" | "below-composer";
  followUpSuggestionsPortalTarget?: Element | null;
  initialSuggestionsPortalTarget?: Element | null;
}

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
const primary = primaryChunk as unknown as Record<string, unknown>;
let jsx: {
  Fragment: unknown;
  jsx(component: unknown, props: unknown, key?: string): unknown;
  jsxs(component: unknown, props: unknown, key?: string): unknown;
};
let React: () => {
  useContext<T>(context: unknown): T;
  useState<T>(value: T): [T, (value: T) => void];
};
let classNames: (...values: unknown[]) => string;
let useIntl: () => {
  formatMessage(message: Record<string, string>): string;
};
let useSignalValue: <T>(signal: unknown) => T;
let Tooltip: unknown;
let IconButton: unknown;
let IconAsset: unknown;
let dismissAsset: unknown;
let motion: { div: unknown };
let Presence: unknown;
let ReactDOM: {
  createPortal(node: unknown, target: Element): unknown;
};
let RefreshIcon: unknown;
let modelPickerOpenSignal: unknown;
let useReducedMotion: () => boolean;
let measureElement: (element: Element) => { width: number };
let useResizeObserver: (
  callback: (entry: Element, grid: Element) => void,
) => (element: Element | null) => void;
let suggestionPortalContext: unknown;

const actionClassName = "size-6 transition-transform duration-basic ease-enter-snappy focus-visible:ring-2 focus-visible:ring-ring active:scale-95";
const cardWidthRem = 10;

function DismissSuggestionsButton({ onClick }: { onClick(): void }): unknown {
  const intl = useIntl();
  return jsx.jsx(IconButton, {
    "aria-label": intl.formatMessage({
      id: "home.ambientSuggestions.dismiss",
      defaultMessage: "Dismiss suggestions",
      description: "Accessible label for dismissing home suggestions",
    }),
    className: actionClassName,
    color: "ghostTertiary",
    size: "icon",
    uniform: true,
    onClick,
    children: jsx.jsx(IconAsset, { "aria-hidden": false, asset: dismissAsset }),
  });
}

function SuggestionHeader({
  actions,
  className,
  controlsClassName,
  label,
  onDismiss,
}: {
  actions?: unknown;
  className?: string;
  controlsClassName?: string;
  label?: unknown;
  onDismiss?(): void;
}): unknown {
  return jsx.jsxs("div", {
    className: classNames(
      "group/home-suggestions-header flex h-9 items-center justify-between px-1 text-base text-codex-description",
      className,
    ),
    children: [
      jsx.jsx("div", { className: "min-w-0 truncate", children: label }),
      actions == null && onDismiss == null ? null : jsx.jsxs("div", {
        className: classNames("flex shrink-0 items-center gap-1", controlsClassName),
        children: [actions, onDismiss == null ? null : jsx.jsx(DismissSuggestionsButton, { onClick: onDismiss })],
      }),
    ],
  });
}

function HomeSuggestionSurface({
  composerMode,
  headline,
  hideSuggestions = false,
  items,
  layout = "cards",
  isRefreshing = false,
  showTemplateSelection = false,
  showCloseAction = true,
  onRefresh,
  onSuggestionGridColumnCountChange,
}: HomeSuggestionSurfaceProps): unknown {
  initializeHomeSuggestionSurface();
  const intl = useIntl();
  const modelPickerOpen = useSignalValue<boolean>(modelPickerOpenSignal);
  const portalContext = React().useContext<SuggestionPortalContext | null>(suggestionPortalContext);
  const reducedMotion = useReducedMotion();
  const [dismissed, setDismissed] = React().useState(false);
  const portalTarget = layout === "list"
    ? portalContext?.followUpSuggestionsPortalTarget
    : portalContext?.initialSuggestionsPortalTarget;
  const reportGridWidth = (element: Element, grid: Element) => {
    if (onSuggestionGridColumnCountChange == null) return;
    const { width } = measureElement(element);
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const gap = Number.parseFloat(getComputedStyle(grid).columnGap);
    onSuggestionGridColumnCountChange(
      Math.max(1, Math.floor((width + gap) / (cardWidthRem * rootFontSize + gap))),
    );
  };
  const gridRef = useResizeObserver(reportGridWidth);
  if (showTemplateSelection || hideSuggestions || dismissed) return null;

  let refreshAction: unknown = null;
  if (onRefresh != null) {
    const label = intl.formatMessage({
      id: "home.ambientSuggestions.refresh",
      defaultMessage: "Refresh suggestions",
      description: "Tooltip and accessible label for refreshing home suggestions",
    });
    refreshAction = jsx.jsx(Tooltip, {
      disabled: modelPickerOpen,
      tooltipContent: label,
      children: jsx.jsx(IconButton, {
        "aria-label": label,
        className: actionClassName,
        color: "ghostTertiary",
        disabled: isRefreshing,
        size: "icon",
        uniform: true,
        onClick: onRefresh,
        children: jsx.jsx(RefreshIcon, {
          className: classNames("icon-xs", isRefreshing && "animate-spin motion-reduce:animate-none"),
        }),
      }),
    });
  }

  const body = items.length === 0 ? null : jsx.jsxs(jsx.Fragment, {
    children: [
      showCloseAction || refreshAction != null ? jsx.jsx(SuggestionHeader, {
        actions: refreshAction,
        className: "relative h-0 px-0",
        controlsClassName: "absolute top-1 right-1 z-10 opacity-0 transition-opacity group-hover/home-suggestions:opacity-100 group-focus-within/home-suggestions:opacity-100",
        label: null,
        onDismiss: showCloseAction ? () => setDismissed(true) : undefined,
      }) : null,
      jsx.jsx(Presence, {
        mode: "wait",
        children: jsx.jsx(motion.div, {
          className: classNames("min-w-0", layout === "cards" && "mt-1 @container"),
          exit: {
            opacity: 0,
            pointerEvents: "none",
            transform: reducedMotion ? "translateY(0)" : "translateY(-6px)",
          },
          transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] },
          children: layout === "list"
            ? jsx.jsx(HomeSuggestionList, {
                composerMode,
                disableWhileModelPickerOpen: true,
                items,
                placement: portalContext?.followUpSuggestionsPlacement,
              })
            : jsx.jsx("div", {
                ref: onSuggestionGridColumnCountChange == null ? undefined : gridRef,
                className: classNames(
                  "grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-3",
                  "[@container_(max-width:42.249rem)]:[&>*:nth-child(n+4)]:hidden",
                  "[@container_(max-width:31.499rem)]:[&>*:nth-child(n+3)]:hidden",
                  "[@container_(max-width:20.749rem)]:[&>*:nth-child(n+2)]:hidden",
                ),
                children: items.map((item, index) => jsx.jsx(StaggeredItem, {
                  className: "h-full min-w-0",
                  index,
                  variant: "card",
                  children: jsx.jsx(SuggestionCard, {
                    disabled: item.disabled,
                    icon: item.icon,
                    label: item.label,
                    tooltipContent: modelPickerOpen ? undefined : item.tooltipContent,
                    onClick: item.onClick,
                  }),
                }, item.id)),
              }),
        }, `${layout}:${items.map((item) => item.id).join(":")}`),
      }),
    ],
  });
  const surface = jsx.jsxs("section", {
    className: classNames(
      "group/home-suggestions relative flex min-w-0 flex-col select-none",
      modelPickerOpen && "pointer-events-none",
    ),
    inert: modelPickerOpen,
    children: [
      headline == null ? null : jsx.jsx("p", {
        className: "mb-1 px-1 text-sm text-codex-description",
        children: headline,
      }),
      body,
    ],
  });
  return portalTarget == null ? surface : ReactDOM.createPortal(surface, portalTarget);
}

function initializeHomeSuggestionSurface(): void {
  if (jsx != null) return;
  const call = (value: unknown) => { if (typeof value === "function") value(); };
  for (const value of [
    shared.h4,
    shared.f$,
    shared.a$,
    shared.FX,
    shared.K2,
    initial.j2,
    shared.Zh,
    shared.c_,
    initial.xlt,
    initial.k2,
    initial.Sat,
    primary.Yh,
  ]) call(value);
  initializeSuggestionCard();
  initializeHomeSuggestionList();
  initializeStaggeredItem();
  jsx = (shared.I3 as () => typeof jsx)();
  React = shared.e6 as typeof React;
  classNames = shared.m4 as typeof classNames;
  useIntl = shared.n4 as typeof useIntl;
  useSignalValue = shared.HX as typeof useSignalValue;
  Tooltip = shared.o_;
  IconButton = shared.Yh;
  IconAsset = shared.S_;
  dismissAsset = shared.dw;
  motion = shared.o$ as typeof motion;
  Presence = shared.d$;
  ReactDOM = (shared.P3 as () => typeof ReactDOM)();
  RefreshIcon = initial.O2;
  modelPickerOpenSignal = initial.A2;
  useReducedMotion = initial.Slt as typeof useReducedMotion;
  measureElement = initial.jat as typeof measureElement;
  useResizeObserver = initial.wat as typeof useResizeObserver;
  suggestionPortalContext = primary.Jh;
}

export { initializeHomeSuggestionSurface as n, HomeSuggestionSurface as t };
