// right-panel-composer-overlay —— 浏览器右侧面板中的浮动 composer 布局与显隐状态机。
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/right-panel-composer-overlay-alignment";
import "@rchunk/wheel-swipe-gesture";

export type OverlayVisibility = "entering" | "visible" | "exiting" | "hidden";
export type ComposerOverlayMode = "default" | "compact" | "expanded";

function visibilityState(hidden: boolean, current: OverlayVisibility): OverlayVisibility {
  return hidden ? (current === "exiting" ? "exiting" : "hidden") : current === "entering" ? "entering" : "visible";
}

function RightPanelComposerOverlay<T>(input: {
  children: T; expandComposerContentImmediately?: boolean; forceExpanded?: boolean;
  reserveFullComposerHeight?: boolean; onLatestTurnExpandedChange?(expanded: boolean): void;
  browserPanelEnabled?: boolean; browserReady?: boolean; browserPeeked?: boolean; browserTabMatchesConversation?: boolean;
  bottomPanelHeight?: string; overlayVisibility?: OverlayVisibility; transitionHeight?: number;
  composerFocused?: boolean; reduceMotion?: boolean; activeBrowserTabId?: string | null;
}) {
  const panelEnabled = input.browserPanelEnabled === true;
  const ready = input.browserReady !== false;
  const peeked = input.browserPeeked === true;
  const hidden = !panelEnabled || !ready || peeked;
  let visibility = visibilityState(hidden, input.overlayVisibility ?? (hidden ? "hidden" : "visible"));
  const shouldRender = visibility !== "hidden" || (panelEnabled && ready && !hidden);
  if (!shouldRender) return null;
  const mode: ComposerOverlayMode = panelEnabled
    ? input.forceExpanded || input.browserTabMatchesConversation || peeked ? "expanded" : "compact"
    : "default";
  let latestTurnExpanded = false;
  let visible = visibility === "visible";
  const notify = (value: boolean) => { latestTurnExpanded = value; input.onLatestTurnExpandedChange?.(value); };
  return {
    kind: "right-panel-composer-overlay" as const,
    children: input.children,
    mode,
    visibility,
    visible,
    floating: panelEnabled,
    compact: mode === "compact",
    expanded: mode === "expanded",
    inert: peeked,
    reserveFullComposerHeight: input.reserveFullComposerHeight === true,
    bottomPanelHeight: input.bottomPanelHeight ?? "0px",
    transition: { animate: input.reduceMotion !== true, height: input.transitionHeight ?? 0, durationMs: 150 },
    context: {
      activeBrowserTabId: input.activeBrowserTabId ?? null,
      isInsideOverlay: true,
      isExpanding: mode === "expanded" && input.expandComposerContentImmediately !== true,
    },
    get latestTurnExpanded() { return latestTurnExpanded; },
    reveal(options: { keyboard?: boolean } = {}) {
      visibility = "visible"; visible = true; notify(false);
      return { prefersReducedMotion: input.reduceMotion === true || options.keyboard === true };
    },
    hide(options: { keyboard?: boolean } = {}) {
      visibility = "hidden"; visible = false; notify(false);
      return { prefersReducedMotion: input.reduceMotion === true || options.keyboard === true };
    },
    wheel(deltaY: number, deltaX = 0) {
      if (Math.abs(deltaY) <= Math.abs(deltaX)) return false;
      if (mode === "compact" && deltaY > 0) { notify(true); return true; }
      if (input.composerFocused && mode !== "compact") { notify(deltaY > 0); return true; }
      return false;
    },
    get visibleNow() { return visible; },
  };
}

function initializeRightPanelComposerOverlay(): void {}
export { initializeRightPanelComposerOverlay as n, RightPanelComposerOverlay as t };
