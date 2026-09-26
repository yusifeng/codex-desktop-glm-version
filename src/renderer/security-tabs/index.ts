// tabs —— 通用可访问标签页导航，兼容分段、工具栏、内嵌与下划线样式。
// 原版：app/webview/assets/tabs-285592374a40.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
let jsx: any;
let TOOLBAR_STYLE: any;
let TAB_STYLES: Record<string, any>;

function Tabs({
  tabs,
  selectedKey,
  onSelect,
  className,
  fill = false,
  scrollable = false,
  tabListRef,
  variant = "segmented",
  ariaLabel,
  ariaLabelledBy,
  activationMode = "automatic",
}: any) {
  const style = TAB_STYLES[variant];
  const TabButton = variant === "inset" ? appShared.Yh : "button";
  const listClassName = appShared.m4(
    style.listClassName,
    fill && "w-full",
    scrollable && "hide-scrollbar overflow-x-auto overflow-y-hidden",
    className,
  );
  const onWheel = scrollable ? translateWheelToHorizontalScroll : undefined;
  const onKeyDown = (event: any) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    ) {
      return;
    }
    const tabElements = Array.from(
      event.currentTarget.querySelectorAll('[role="tab"]'),
    ) as any[];
    const currentIndex = tabElements.findIndex((tab) => tab === event.target);
    if (currentIndex < 0 || tabElements.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabElements.length - 1
          : (currentIndex +
              (event.key === (rtl ? "ArrowLeft" : "ArrowRight") ? 1 : -1) +
              tabElements.length) %
            tabElements.length;
    tabElements[nextIndex]?.focus();
    if (scrollable) {
      tabElements[nextIndex]?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    }
    const nextTab = tabs[nextIndex];
    if (nextTab != null && activationMode === "automatic")
      onSelect(nextTab.key);
  };

  const tabNodes = tabs.map((tab: any, index: number) => {
    const selected = tab.key === selectedKey;
    const first = index === 0;
    const last = index === tabs.length - 1;
    const insetColor =
      variant === "inset"
        ? selected
          ? "segmentedInsetSelected"
          : "ghost"
        : undefined;
    return jsx.jsxs(
      "div",
      {
        className: appShared.m4(
          "relative flex min-w-0 items-center",
          style.itemClassName,
          fill && "flex-1",
          tab.onClose != null && "group/tab",
        ),
        children: [
          jsx.jsxs(TabButton, {
            id: tab.panelId == null ? undefined : `${tab.panelId}-tab`,
            className: appShared.m4(
              fill && "min-w-0 flex-1 justify-center",
              variant !== "inset" && [
                "cursor-interaction items-center text-sm select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                style.tabButtonClassName,
                style.segmentedEdges && first && "rounded-l-md",
                style.segmentedEdges && last && "rounded-r-md",
                selected ? style.selectedClassName : style.unselectedClassName,
              ],
            ),
            color: insetColor,
            size: variant === "inset" ? "compact" : undefined,
            type: "button",
            role: "tab",
            "aria-controls": tab.panelId,
            "aria-selected": selected,
            tabIndex: selected ? 0 : -1,
            onClick: () => {
              if (!selected || activationMode === "manual") onSelect(tab.key);
            },
            children: [
              tab.icon == null
                ? null
                : jsx.jsx("span", {
                    "aria-hidden": "true",
                    className:
                      "icon-xs flex shrink-0 items-center justify-center",
                    children: tab.icon,
                  }),
              fill
                ? jsx.jsx("span", { className: "truncate", children: tab.name })
                : tab.name,
            ],
          }),
          style.selectionIndicator === "underline" && selected
            ? jsx.jsx("div", {
                className:
                  "absolute inset-x-0 bottom-[-1px] h-px bg-primary-solid",
              })
            : null,
          tab.onClose == null
            ? null
            : jsx.jsx("button", {
                type: "button",
                "aria-label": tab.closeLabel,
                className: appShared.m4(
                  "cursor-interaction text-tertiary hover:text-default",
                  style.closeButtonClassName,
                ),
                onClick: tab.onClose,
                children: jsx.jsx(appShared.ig, { className: "icon-2xs" }),
              }),
          style.segmentedEdges && !last
            ? jsx.jsx("div", {
                className: "h-full w-px self-stretch bg-border",
              })
            : null,
        ],
      },
      tab.key,
    );
  });

  return jsx.jsx("div", {
    ref: tabListRef,
    role: "tablist",
    tabIndex: -1,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className: listClassName,
    onWheel,
    onKeyDown,
    children: tabNodes,
  });
}

function translateWheelToHorizontalScroll(event: any) {
  const delta = event.deltaX || event.deltaY;
  if (delta !== 0) event.currentTarget.scrollLeft += delta;
}

function initializeTabs(): void {
  appShared.$3();
  appShared.h4();
  appShared.ag();
  appShared.Zh();
  jsx = appShared.I3();
  TOOLBAR_STYLE = {
    closeButtonClassName: "flex h-7 w-5 items-center justify-center",
    itemClassName: "shrink-0",
    listClassName: "flex min-w-0 items-center gap-0.5",
    segmentedEdges: false,
    selectedClassName: "bg-surface-secondary text-default",
    selectionIndicator: null,
    tabButtonClassName: "flex min-w-0 gap-1.5 rounded-md px-2 py-1 font-medium",
    unselectedClassName: "text-secondary hover:bg-surface-secondary",
  };
  TAB_STYLES = {
    segmented: {
      closeButtonClassName: "px-1",
      itemClassName: "flex-1",
      listClassName: "border-default flex items-center rounded-lg border",
      segmentedEdges: true,
      selectedClassName: "bg-text-emphasis/25 text-default",
      selectionIndicator: null,
      tabButtonClassName:
        "relative flex-1 rounded-none px-4 py-1.5 font-medium",
      unselectedClassName: "text-secondary hover:bg-text-emphasis/5",
    },
    toolbar: TOOLBAR_STYLE,
    inset: {
      ...TOOLBAR_STYLE,
      listClassName:
        "inline-flex min-w-0 max-w-full items-center gap-0.5 rounded-[10px] bg-surface-secondary/92 p-0.5",
    },
    page: {
      ...TOOLBAR_STYLE,
      listClassName: "-ms-2 flex min-w-0 items-center gap-2",
    },
    pill: {
      ...TOOLBAR_STYLE,
      listClassName: "flex min-w-0 items-center gap-1",
      selectedClassName: "bg-text/5 text-default ring-1 ring-border-strong",
      tabButtonClassName:
        "flex min-w-0 gap-1.5 rounded-full border border-transparent px-4 py-2 font-medium ring-inset",
      unselectedClassName: "text-tertiary hover:bg-primary-ghost-hover",
    },
    filter: {
      ...TOOLBAR_STYLE,
      listClassName: "-ms-3 flex min-w-0 items-center gap-1",
      selectedClassName: "bg-text/5 text-default",
      tabButtonClassName:
        "flex min-h-9 min-w-0 gap-1.5 rounded-full px-3 leading-5 font-normal ring-inset",
      unselectedClassName: "text-secondary hover:bg-primary-ghost-hover",
    },
    browse: {
      ...TOOLBAR_STYLE,
      listClassName: "flex min-w-0 items-center gap-0",
      selectedClassName: "bg-primary-ghost-hover text-default",
      tabButtonClassName:
        "flex h-9 min-w-0 rounded-full border border-transparent px-4 py-0 font-medium",
      unselectedClassName: "text-secondary hover:text-default",
    },
    profile: {
      ...TOOLBAR_STYLE,
      itemClassName: "flex-1",
      listClassName: "flex min-w-0 items-center",
      selectedClassName: "bg-primary-ghost-hover text-default",
      tabButtonClassName:
        "flex h-9 w-full min-w-0 justify-center rounded-full border border-transparent px-3 py-0 font-medium",
      unselectedClassName: "text-secondary hover:text-default",
    },
    underline: {
      closeButtonClassName: "px-1",
      itemClassName: "shrink-0 pb-2",
      listClassName: "border-default flex min-w-0 items-start gap-8 border-b",
      segmentedEdges: false,
      selectedClassName: "text-default",
      selectionIndicator: "underline",
      tabButtonClassName: "flex min-w-0 gap-1.5 font-medium",
      unselectedClassName: "text-secondary hover:text-default",
    },
  };
}

export { initializeTabs as n, Tabs as t };
