import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import {
  n as initializeStaggeredItem,
  t as HomeSuggestionStaggeredItem,
} from "@rchunk/home-suggestion-staggered-item";

export interface HomeSuggestionListItem {
  disabled?: boolean;
  dismissLabel?: string;
  hidden?: boolean;
  icon?: unknown;
  id: string;
  label: string;
  listIcon?: unknown;
  onClick?(): void;
  onDismiss?(): void;
  tooltipContent?: unknown;
  tooltipInteractive?: boolean;
  trailing?: unknown;
}

interface HomeSuggestionListProps {
  composerMode?: string | null;
  disableWhileModelPickerOpen?: boolean;
  emptyState?: unknown;
  items: HomeSuggestionListItem[];
  placement?: "above-composer" | "below-composer";
  variant?: "composer" | "feed";
}

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
let jsx: {
  Fragment: unknown;
  jsx(component: unknown, props: unknown, key?: string): unknown;
  jsxs(component: unknown, props: unknown, key?: string): unknown;
};
let React: () => {
  useState<T>(value: T): [T, (value: T) => void];
};
let useSignalValue: <T>(signal: unknown) => T;
let useIntl: () => {
  formatMessage(message: Record<string, string>): string;
};
let classNames: (...values: unknown[]) => string;
let Tooltip: unknown;
let IconButton: unknown;
let CloseIcon: unknown;
let Presence: unknown;
let modelPickerOpenSignal: unknown;

function SuggestionIcon({
  children,
  className,
  size = "small",
  ...props
}: {
  children?: unknown;
  className?: string;
  size?: "large" | "small" | "tile";
  [key: string]: unknown;
}): unknown {
  initializeHomeSuggestionList();
  return jsx.jsx("span", {
    className: classNames(
      "flex shrink-0 items-center justify-center",
      {
        "size-6": size === "tile",
        "size-5": size === "large",
        "size-4": size === "small",
      },
      className,
    ),
    ...props,
    children,
  });
}

function HomeSuggestionList({
  composerMode,
  disableWhileModelPickerOpen = false,
  emptyState,
  items,
  placement = "above-composer",
  variant = "composer",
}: HomeSuggestionListProps): unknown {
  initializeHomeSuggestionList();
  const intl = useIntl();
  const modelPickerOpen = useSignalValue<boolean>(
    disableWhileModelPickerOpen ? modelPickerOpenSignal : null,
  ) ?? false;
  const [openTooltipId, setOpenTooltipId] = React().useState<string | null>(null);
  if (modelPickerOpen && openTooltipId != null) setOpenTooltipId(null);
  if (items.length === 0 && emptyState === undefined) return null;

  let iconSize: "large" | "small" | "tile" = composerMode == null ? "small" : "large";
  if (variant === "feed") iconSize = "tile";
  const containerClassName = classNames(
    "flex flex-col py-2",
    variant === "composer" && [
      "min-h-32",
      composerMode === "chat" ? "ps-2" : "ps-6",
    ],
    placement === "below-composer" ? "justify-start" : "justify-end",
    modelPickerOpen && "pointer-events-none",
  );
  const renderedItems = items.map((item, index) => jsx.jsxs(
    HomeSuggestionStaggeredItem,
    {
      className: classNames(
        "group/home-suggestion-list-item relative",
        item.hidden && "invisible",
      ),
      index: variant === "feed" || placement === "below-composer"
        ? index
        : items.length - index - 1,
      variant: variant === "feed" ? "feed" : "list",
      children: [
        jsx.jsx(Tooltip, {
          closeOnTriggerClick: true,
          delayDuration: item.tooltipInteractive ? 250 : undefined,
          disabled: modelPickerOpen,
          interactive: item.tooltipInteractive,
          keyboardNavigation: item.tooltipInteractive,
          selectable: item.tooltipInteractive,
          sideOffset: variant === "feed" ? 14 : undefined,
          skipDelayKey: variant === "feed" ? item.id : undefined,
          tooltipBodyClassName: "max-h-full overflow-hidden",
          tooltipContent: item.tooltipContent == null
            ? item.tooltipContent
            : jsx.jsx("div", {
                className: "min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 leading-relaxed",
                children: item.tooltipContent,
              }),
          tooltipMaxWidth: "min(24rem, var(--radix-tooltip-content-available-width), calc(100vw - 16px))",
          variant: "rich",
          onOpenChange: (open: boolean) => setOpenTooltipId(open ? item.id : null),
          children: jsx.jsxs("button", {
            ref: (element: HTMLElement | null) => {
              if (element == null || variant !== "feed" || openTooltipId !== item.id) return;
              const preventWheel = (event: WheelEvent) => {
                if (!event.ctrlKey) event.preventDefault();
              };
              element.addEventListener("wheel", preventWheel, { passive: false });
              return () => element.removeEventListener("wheel", preventWheel);
            },
            type: "button",
            className: classNames(
              "flex w-full cursor-interaction items-center text-start text-sm text-codex-description outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-40",
              variant === "feed"
                ? "min-h-11 gap-4 rounded-2xl py-2 ps-3 group-focus-within/home-suggestion-list-item:bg-primary-ghost-hover group-hover/home-suggestion-list-item:bg-primary-ghost-hover"
                : [
                    "min-h-home-suggestion-row rounded-lg transition-transform duration-basic ease-enter-snappy hover:text-default active:scale-[0.99] browser:text-base browser:leading-relaxed",
                    {
                      "gap-1.5": composerMode == null,
                      "gap-2": composerMode === "chat",
                      "gap-3": composerMode != null && composerMode !== "chat",
                    },
                  ],
              variant === "feed" && (item.onDismiss == null ? "pe-2" : "pe-11"),
              variant === "composer" && (item.onDismiss == null ? "pe-1" : "pe-8"),
            ),
            disabled: item.disabled,
            onClick: item.onClick,
            onMouseDown: variant === "feed"
              ? (event: { preventDefault(): void }) => event.preventDefault()
              : undefined,
            children: [
              item.listIcon == null && item.icon == null ? null : jsx.jsx(SuggestionIcon, {
                "aria-hidden": "true",
                className: classNames(
                  variant === "composer" && [
                    composerMode == null ? "[&_img]:size-4 [&>svg]:size-4" : "browser:size-6",
                    composerMode === "chat" && "min-w-token-button-composer",
                  ],
                ),
                size: iconSize,
                children: item.listIcon ?? item.icon,
              }),
              jsx.jsx("span", { className: "min-w-0 flex-1 truncate", children: item.label }),
              item.trailing,
            ],
          }),
        }),
        item.onDismiss == null ? null : jsx.jsx(IconButton, {
          "aria-label": item.dismissLabel ?? intl.formatMessage({
            id: "home.taskSuggestions.dismiss",
            defaultMessage: "Dismiss suggestion",
            description: "Accessible label for the X button on one suggested task below the Home composer. It removes only this suggestion without starting the task or changing the draft.",
          }),
          className: "pointer-events-none absolute end-1 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/home-suggestion-list-item:pointer-events-auto group-focus-within/home-suggestion-list-item:opacity-100 group-hover/home-suggestion-list-item:pointer-events-auto group-hover/home-suggestion-list-item:opacity-100",
          color: "ghostTertiary",
          disabled: item.disabled,
          size: "compact",
          uniform: true,
          onClick: item.onDismiss,
          onMouseDown: (event: { preventDefault(): void }) => event.preventDefault(),
          children: jsx.jsx(CloseIcon, {}),
        }),
      ],
    },
    item.id,
  ));

  return jsx.jsxs("div", {
    className: containerClassName,
    inert: modelPickerOpen,
    children: [
      items.length === 0 ? emptyState : null,
      jsx.jsx(Presence, { children: renderedItems }),
    ],
  });
}

function initializeHomeSuggestionList(): void {
  if (jsx != null) return;
  const call = (value: unknown) => { if (typeof value === "function") value(); };
  for (const value of [
    shared.h4,
    shared.f$,
    shared.FX,
    shared.K2,
    initial.j2,
    shared.Zh,
    shared.lw,
    shared.c_,
  ]) call(value);
  initializeStaggeredItem();
  jsx = (shared.I3 as () => typeof jsx)();
  React = shared.e6 as typeof React;
  useSignalValue = shared.HX as typeof useSignalValue;
  useIntl = shared.n4 as typeof useIntl;
  classNames = shared.m4 as typeof classNames;
  Tooltip = shared.o_;
  IconButton = shared.Yh;
  CloseIcon = shared.cw;
  Presence = shared.d$;
  modelPickerOpenSignal = initial.A2;
}

export { initializeHomeSuggestionList as n, HomeSuggestionList as t };
