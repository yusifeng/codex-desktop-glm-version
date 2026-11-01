import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import * as contextChunk from "@rchunk/thread-scroll-controller-context-value";

type Direction = "away" | "toward";
type Origin = "bottom" | "top";
type Behavior = "instant" | "smooth";
interface Ref<T> { current: T }
interface ContentX { get(): number; on?(event: "change", listener: () => void): (() => void) | undefined }
interface ResponseSpacer { getHeightPx(): number; scrollToBottom(): void }
interface Controller {
  addScrollListener(listener: (distance: number) => void): () => void;
  addUserScrollListener(listener: (current: number, previous: number) => void): () => void;
  compensateScrollToDistanceFromBottomPx(distance: number): void;
  getLastScrollDistanceFromBottomPx(): number;
  getUnroundedScrollDistanceFromBottomPx(distanceFromBottomPx: number): number;
  getScrollElement(): HTMLElement | null;
  isScrolledFromBottom: boolean;
  preserveScrollPositionForNextLayout(): void;
  scrollToBottom(): void;
  scrollToDistanceFromBottomPx(distance: number, behavior: Behavior, source?: "system" | "user"): void;
  setFooterResizeViewportPreserveDisabled(disabled: boolean): void;
}
export interface ThreadScrollLayoutProps {
  active?: boolean; autoLoadHistory?: boolean; contentX?: ContentX | null; children?: unknown;
  footer?: unknown; hideScrollbar?: boolean; initialOffset?: number; loadPastHiddenHistoryPages?: boolean;
  onScroll?(distanceFromBottomPx: number, atBottom: boolean): void;
  onUserScrollToTop?(): Promise<"stop" | unknown> | "stop" | unknown;
  preserveViewportOnContentGrowth?: boolean; presentation?: "compact" | "default";
  remoteHostedPIPAnchorHostId?: string;
  renderLayout?(parts: { content: unknown; footer: unknown }): unknown;
  responseSpacer?: ResponseSpacer | null; scrollOrigin?: Origin;
  scrollToBottomButton?: { isWorking?: boolean } | null; threadEndContent?: unknown;
}

const shared = sharedChunk as unknown as Record<string, any>;
const initial = initialChunk as unknown as Record<string, any>;
const primary = primaryChunk as unknown as Record<string, any>;
const scrollContext = contextChunk as unknown as Record<string, any>;
let React: any;
let jsx: any;
let initialized = false;
const HEADER_SELECTOR = "[data-app-shell-header-obstacle], [data-app-shell-header-toolbar] > *, [data-app-shell-page-header] > :not([data-app-shell-header-toolbar])";
const ANIMATION_MS = 260;
const HISTORY_THRESHOLD = 64;
const TOUCH_THRESHOLD = 8;
const DIRECTION_TIMEOUT = 1000;
const styles = {
  Probe: "_Probe_3b6sy_1", transcriptBody: "_transcriptBody_w5y6n_1",
  scrollContent: "_scrollContent_w5y6n_5", compactHeaderScrollFade: "_compactHeaderScrollFade_w5y6n_13",
  compactScrollMask: "_compactScrollMask_w5y6n_28",
};
function call(value: unknown): void { if (typeof value === "function") value(); }
function stable<T extends (...args: any[]) => any>(callback: T): T { return (shared.__ as (value: T) => T)(callback); }
function classes(...values: unknown[]): string { return (shared.m4 as (...items: unknown[]) => string)(...values); }
function fromBottom(element: HTMLElement): number { return Math.max(0, -(element.scrollTop || 0)); }
function fromTop(element: HTMLElement): number { return element.scrollHeight - element.clientHeight - fromBottom(element); }
function setFromBottom(element: HTMLElement, distance: number): void { element.scrollTop = -Math.max(0, distance); }
function atBottom(element: HTMLElement): boolean { return fromBottom(element) <= 24; }
function nearTop(element: HTMLElement, hiddenPages: boolean): boolean {
  return fromTop(element) <= (hiddenPages ? Math.max(element.clientHeight, HISTORY_THRESHOLD) : HISTORY_THRESHOLD);
}

function observeHeaderOverlap(probe: HTMLElement, onChange: (value: boolean) => void) {
  const main = probe.closest<HTMLElement>("[data-app-shell-main-content-layout]");
  const header = main?.closest<HTMLElement>("[data-app-shell-main-surface]")?.querySelector<HTMLElement>("header[data-app-shell-header-layout]");
  if (main == null || header == null || typeof ResizeObserver === "undefined") return;
  let frame: number | null = null;
  let refresh = true;
  let obstacles = new Set<Element>();
  const update = () => {
    frame = null;
    if (refresh) {
      refresh = false;
      const next = new Set(header.querySelectorAll(HEADER_SELECTOR));
      for (const item of obstacles) if (!next.has(item)) observer.unobserve(item);
      for (const item of next) if (!obstacles.has(item)) observer.observe(item);
      obstacles = next;
    }
    const probeBounds = probe.getBoundingClientRect();
    let clear = probeBounds.width > 0 && !header.hasAttribute("data-app-shell-tab-row");
    if (clear) for (const obstacle of obstacles) {
      const bounds = obstacle.getBoundingClientRect();
      if (!obstacle.hasAttribute("data-app-shell-thread-content-overlap") && bounds.width > 0 && bounds.height > 0 &&
          getComputedStyle(obstacle).visibility !== "hidden" && bounds.right > probeBounds.left && bounds.left < probeBounds.right) {
        clear = false; break;
      }
    }
    onChange(clear);
  };
  const schedule = () => { frame ??= requestAnimationFrame(update); };
  const observer = new ResizeObserver(entries => {
    if (entries.some(({ target }) => !target.isConnected)) refresh = true;
    schedule();
  });
  for (const item of [main, probe, header]) observer.observe(item);
  schedule();
  return {
    schedule,
    updateHeader() { refresh = true; schedule(); },
    dispose() { observer.disconnect(); if (frame != null) cancelAnimationFrame(frame); onChange(false); },
  };
}
function HeaderOverlapProbe({ contentX }: { contentX?: ContentX | null }): unknown {
  const mode = React.useContext(initial.T7);
  return mode == null ? null : jsx.jsx(HeaderOverlapProbeElement, { contentX });
}
function HeaderOverlapProbeElement({ contentX }: { contentX?: ContentX | null }): unknown {
  const scope = (shared.LX as (signal: unknown) => any)(initial.$en);
  const mode = (shared.HX as (signal: unknown) => unknown)(initial.Ybt);
  const ref = stable((element: HTMLElement | null) => {
    if (element == null) return;
    const observation = observeHeaderOverlap(element, value => scope.set(initial.Bbt, value));
    if (observation == null) return;
    const unwatch = scope.watch(({ get }: any) => {
      for (const signal of [initial.Hbt, initial.Wbt, initial.Gbt, initial.Kbt, initial.nxt]) get(signal);
      observation.updateHeader();
    });
    const unlisten = contentX?.on?.("change", observation.schedule);
    return () => { unwatch(); unlisten?.(); observation.dispose(); };
  });
  return mode === "thread-edge-scroll" ? jsx.jsx("div", { ref, className: styles.Probe, "aria-hidden": true }) : null;
}
function ScrollToBottomButton({ isWorking = false, responseSpacer }: { isWorking?: boolean; responseSpacer?: ResponseSpacer | null }): unknown {
  const intl = (shared.n4 as () => { formatMessage(input: Record<string, string>): string })();
  const controller = (scrollContext.r as () => Controller)();
  const snapshot = stable(() => {
    const height = responseSpacer?.getHeightPx();
    return height == null ? controller.isScrolledFromBottom : controller.getLastScrollDistanceFromBottomPx() > height + 24;
  });
  const show = React.useSyncExternalStore(controller.addScrollListener, snapshot, snapshot);
  const label = intl.formatMessage({
    id: "localConversation.scrollToBottomButton", defaultMessage: "Scroll to bottom",
    description: "Accessible label for the button that scrolls a conversation to its latest message",
  });
  return jsx.jsx("div", { className: "relative h-0", children: jsx.jsx(initial.Za, {
    className: "bottom-[calc(100%+6*var(--spacing))]", label,
    onClick: responseSpacer?.scrollToBottom ?? controller.scrollToBottom, show, showWorkingDots: show && isWorking,
  }) });
}
function keyDirection(event: KeyboardEvent, element: HTMLElement): Direction | null {
  if (event.defaultPrevented || event.repeat) return null;
  const target = event.target;
  if (target instanceof HTMLElement && target !== element && (target.isContentEditable || target.closest("input, select, textarea") != null ||
      ((event.key === " " || event.key === "Spacebar") && target.closest("button, [role=\"button\"]") != null))) return null;
  if (["ArrowUp", "Home", "PageUp"].includes(event.key)) return "away";
  if (event.key === " " || event.key === "Spacebar") return event.shiftKey ? "away" : "toward";
  if (["ArrowDown", "End", "PageDown"].includes(event.key)) return "toward";
  return null;
}

function ThreadScrollLayout(props: ThreadScrollLayoutProps): unknown {
  initializeThreadScrollLayout();
  const {
    active = true, autoLoadHistory = true, contentX, children, footer, hideScrollbar = false,
    loadPastHiddenHistoryPages = false, onScroll, onUserScrollToTop, initialOffset = 0,
    presentation = "default", preserveViewportOnContentGrowth = false, renderLayout,
    responseSpacer, remoteHostedPIPAnchorHostId, scrollToBottomButton, scrollOrigin = "bottom", threadEndContent,
  } = props;
  const initialDistance = initialOffset > 24 ? initialOffset : 0;
  const reducedMotion = (initial.Slt as () => boolean)();
  const contentShift = (shared.e$ as (factory: () => string) => unknown)(() => `${Math.abs(contentX?.get() ?? 0)}px`);
  const elementRef = React.useRef(null) as Ref<HTMLElement | null>;
  const [isScrolledFromBottom, setIsScrolledFromBottom] = React.useState(false);
  const footerHeight = React.useRef(null) as Ref<number | null>;
  const lastDistance = React.useRef(initialDistance) as Ref<number>;
  const requested = React.useRef(null) as Ref<{ requestedDistanceFromBottomPx: number; actualDistanceFromBottomPx: number } | null>;
  const lastBottomDistance = React.useRef(null) as Ref<number | null>;
  const activity = React.useRef(null) as Ref<{ direction: Direction; lastAtMs: number } | null>;
  const listeners = React.useRef(new Set<(distance: number) => void>()) as Ref<Set<(distance: number) => void>>;
  const userListeners = React.useRef(new Set<(current: number, previous: number) => void>()) as Ref<Set<(current: number, previous: number) => void>>;
  const animationFrame = React.useRef(null) as Ref<number | null>;
  const historyLoading = React.useRef(false) as Ref<boolean>;
  const historyGeneration = React.useRef(null) as Ref<(() => void) | null>;
  const animationActive = React.useRef(false) as Ref<boolean>;
  const contentPinned = React.useRef(true) as Ref<boolean>;
  const preserveSnapshot = React.useRef(null) as Ref<{ distanceFromBottomPx: number; scrollHeightPx: number } | null>;
  const preserveFrame = React.useRef(null) as Ref<number | null>;
  const footerPreserveDisabled = React.useRef(false) as Ref<boolean>;
  const previousActivation = React.useRef(null) as Ref<{ active: boolean; scrollOrigin: Origin } | null>;
  const topOffsetRegistration = React.useContext(initial.H7);

  const setElement = stable((element: HTMLElement | null) => {
    elementRef.current = element; requested.current = null;
    if (presentation !== "compact" && element != null && topOffsetRegistration != null) {
      return topOffsetRegistration((offset: number) => {
        if (!animationActive.current && !atBottom(element)) setFromBottom(element, fromBottom(element) + offset);
      });
    }
  });
  const getElement = stable(() => elementRef.current);
  const getLastDistance = stable(() => lastDistance.current);
  const addListener = stable((listener: (distance: number) => void) => {
    listeners.current.add(listener); listener(lastDistance.current); return () => listeners.current.delete(listener);
  });
  const addUserListener = stable((listener: (current: number, previous: number) => void) => {
    userListeners.current.add(listener); return () => userListeners.current.delete(listener);
  });
  const reportDistance = stable((distance: number) => {
    if (!active) return;
    if (requested.current?.actualDistanceFromBottomPx !== distance) requested.current = null;
    lastDistance.current = distance;
    if (scrollOrigin === "bottom") lastBottomDistance.current = Math.max(0, distance - (responseSpacer?.getHeightPx() ?? 0));
    const bottom = distance <= 24;
    onScroll?.(distance, bottom);
    for (const listener of listeners.current) listener(distance);
    setIsScrolledFromBottom(!bottom);
  });
  const cancelAnimation = stable(() => {
    animationActive.current = false;
    if (animationFrame.current != null) window.cancelAnimationFrame(animationFrame.current);
    animationFrame.current = null;
  });
  const beginAnimation = stable(() => {
    activity.current = null; requested.current = null; animationActive.current = true;
    if (animationFrame.current != null) window.cancelAnimationFrame(animationFrame.current);
    animationFrame.current = null;
  });
  const clearPreserve = stable(() => {
    preserveSnapshot.current = null;
    if (preserveFrame.current != null) window.cancelAnimationFrame(preserveFrame.current);
    preserveFrame.current = null;
  });
  const applyPreserve = stable(() => {
    const element = elementRef.current, snapshot = preserveSnapshot.current;
    if (element == null || snapshot == null) return null;
    const distance = fromBottom(element), growth = element.scrollHeight - snapshot.scrollHeightPx;
    if (growth === 0 || distance === snapshot.distanceFromBottomPx) return null;
    clearPreserve(); setFromBottom(element, distance - growth); return fromBottom(element);
  });
  const scrollComputed = stable((behavior: Behavior, compute: (element: HTMLElement) => number) => {
    const element = elementRef.current; if (element == null) return;
    clearPreserve();
    const target = Math.max(0, compute(element));
    if (target !== fromBottom(element)) activity.current = null;
    element.scrollTo({ behavior: behavior as globalThis.ScrollBehavior, top: target === 0 ? 0 : -target });
    const actual = fromBottom(element);
    requested.current = behavior === "instant" && actual !== target && target > 0 && target < element.scrollHeight - element.clientHeight
      ? { requestedDistanceFromBottomPx: target, actualDistanceFromBottomPx: actual } : null;
    reportDistance(actual);
  });
  const scrollToDistance = stable((distance: number, behavior: Behavior, source: "system" | "user" = "system") => {
    const previous = lastDistance.current, next = Math.max(0, distance);
    if (next > 24) cancelAnimation();
    scrollComputed(behavior, () => next);
    const current = lastDistance.current;
    if (source === "user" && current !== previous) for (const listener of userListeners.current) listener(current, previous);
  });
  const compensate = stable((distance: number) => { if (!animationActive.current) scrollComputed("instant", () => distance); });
  const setFooterPreserveDisabled = stable((disabled: boolean) => { footerPreserveDisabled.current = disabled; });
  const preserveNextLayout = stable(() => {
    const element = elementRef.current;
    if (animationActive.current || element == null || preserveSnapshot.current != null) return;
    const snapshot = { distanceFromBottomPx: fromBottom(element), scrollHeightPx: element.scrollHeight };
    preserveSnapshot.current = snapshot;
    queueMicrotask(() => {
      if (preserveSnapshot.current !== snapshot) return;
      if (element.scrollHeight === snapshot.scrollHeightPx) { clearPreserve(); return; }
      const next = applyPreserve(); if (next != null) reportDistance(next);
    });
    preserveFrame.current = window.requestAnimationFrame(() => {
      const next = applyPreserve(); clearPreserve(); if (next != null) reportDistance(next);
    });
  });
  const loadHistory = stable(async () => {
    if (historyLoading.current || onUserScrollToTop == null) return;
    const generation = historyGeneration.current; historyLoading.current = true;
    try {
      while (historyGeneration.current === generation && elementRef.current != null && nearTop(elementRef.current, loadPastHiddenHistoryPages)) {
        const before = elementRef.current.scrollHeight;
        if (await onUserScrollToTop() === "stop" || !autoLoadHistory) break;
        const element = elementRef.current;
        if (element != null && element.scrollHeight - element.clientHeight > HISTORY_THRESHOLD &&
            (!loadPastHiddenHistoryPages || element.scrollHeight > before)) break;
      }
    } catch {
      // The owning route surfaces history failures.
    } finally {
      historyLoading.current = false;
      if (historyGeneration.current !== generation) historyGeneration.current?.();
    }
  });

  React.useEffect(() => {
    const element = elementRef.current;
    if (!active || !autoLoadHistory || element == null || onUserScrollToTop == null || typeof ResizeObserver === "undefined") return;
    let height: number | undefined, scrollHeight: number | undefined;
    const check = () => {
      const nextHeight = element.clientHeight, nextScrollHeight = element.scrollHeight;
      if (historyGeneration.current === check && elementRef.current === element && nextHeight > 0 &&
          nextScrollHeight - nextHeight <= HISTORY_THRESHOLD && !historyLoading.current &&
          (height !== nextHeight || scrollHeight !== nextScrollHeight)) {
        height = nextHeight; scrollHeight = nextScrollHeight; void loadHistory();
      }
    };
    historyGeneration.current = check;
    const observer = new ResizeObserver(check);
    observer.observe(element); if (element.firstElementChild != null) observer.observe(element.firstElementChild);
    const frame = window.requestAnimationFrame(check);
    return () => { if (historyGeneration.current === check) historyGeneration.current = null; window.cancelAnimationFrame(frame); observer.disconnect(); };
  }, [active, autoLoadHistory, loadHistory, onUserScrollToTop]);

  const scrollToBottom = stable(() => {
    const element = elementRef.current; if (element == null) return;
    clearPreserve();
    const start = fromBottom(element);
    if (reducedMotion || start <= 24) { scrollComputed("instant", () => 0); cancelAnimation(); return; }
    beginAnimation();
    const startedAt = performance.now();
    const animate = (now: number) => {
      const current = elementRef.current; if (current == null) { cancelAnimation(); return; }
      const progress = Math.min(1, (now - startedAt) / ANIMATION_MS);
      setFromBottom(current, start * (1 - (1 - (1 - progress) ** 3)));
      if (progress < 1 && !atBottom(current)) { animationFrame.current = window.requestAnimationFrame(animate); return; }
      scrollComputed("instant", () => 0); cancelAnimation();
    };
    animationFrame.current = window.requestAnimationFrame(animate);
  });

  React.useLayoutEffect(() => {
    const previous = previousActivation.current;
    previousActivation.current = { active, scrollOrigin };
    const element = elementRef.current;
    if (!active || element == null) { cancelAnimation(); return; }
    if (previous == null || previous.active !== active || previous.scrollOrigin !== scrollOrigin) {
      cancelAnimation(); requested.current = null;
      const restored = previous != null && (!previous.active || previous.scrollOrigin === "top");
      let distance = initialDistance;
      if (scrollOrigin === "top") distance = Math.max(0, element.scrollHeight - element.clientHeight);
      else if (restored) distance = lastBottomDistance.current == null ? initialDistance : lastBottomDistance.current + (responseSpacer?.getHeightPx() ?? 0);
      setFromBottom(element, distance); reportDistance(fromBottom(element));
      contentPinned.current = scrollOrigin === "top" || fromBottom(element) - (responseSpacer?.getHeightPx() ?? 0) <= 24;
    }
  }, [active, cancelAnimation, initialDistance, reportDistance, responseSpacer, scrollOrigin]);

  React.useLayoutEffect(() => {
    const element = elementRef.current;
    if (!active || (scrollOrigin === "bottom" && !preserveViewportOnContentGrowth) || element == null || typeof ResizeObserver === "undefined") return;
    const content = element.querySelector<HTMLElement>("[data-thread-user-message-navigation-content]");
    if (content == null) return;
    let contentHeight = Math.max(0, content.scrollHeight - (responseSpacer?.getHeightPx() ?? 0));
    const remove = addUserListener(distance => {
      contentPinned.current = scrollOrigin === "top" ? element.scrollHeight - element.clientHeight - distance <= 24 : distance <= 24;
    });
    const observer = new ResizeObserver(() => {
      const spacerHeight = responseSpacer?.getHeightPx() ?? 0;
      const nextHeight = Math.max(0, content.scrollHeight - spacerHeight), growth = nextHeight - contentHeight;
      contentHeight = nextHeight;
      const distance = fromBottom(element);
      if (scrollOrigin === "bottom" && distance <= 24) contentPinned.current = true;
      if (scrollOrigin === "top" && contentPinned.current) { scrollToDistance(Math.max(0, element.scrollHeight - element.clientHeight), "instant"); return; }
      if (growth <= 0) return;
      compensate(contentPinned.current ? Math.min(distance + growth, spacerHeight) : distance + growth);
    });
    observer.observe(content); if (scrollOrigin === "top") observer.observe(element);
    return () => { remove(); observer.disconnect(); };
  }, [active, addUserListener, compensate, preserveViewportOnContentGrowth, responseSpacer, scrollOrigin, scrollToDistance]);

  React.useEffect(() => {
    const element = elementRef.current; if (!active || element == null) return;
    const abort = new AbortController(), options = { passive: true, signal: abort.signal };
    let touch: Touch | null = null;
    let dragStart: { scrollHeightPx: number; scrollTopPx: number } | null = null;
    const mark = (direction: Direction) => {
      cancelAnimation(); requested.current = null;
      const moving = direction === "away" ? fromTop(element) > 0 : fromBottom(element) > 0;
      activity.current = moving ? { direction, lastAtMs: performance.now() } : null;
    };
    const report = () => { const value = fromBottom(element); if (value <= 24) cancelAnimation(); reportDistance(value); };
    const onScrollEvent = () => {
      applyPreserve();
      const previous = lastDistance.current;
      if (dragStart != null) {
        const start = dragStart; dragStart = null; const current = fromBottom(element);
        if (element.scrollHeight === start.scrollHeightPx && element.scrollTop !== start.scrollTopPx && current !== previous)
          activity.current = { direction: current > previous ? "away" : "toward", lastAtMs: performance.now() };
      }
      const currentActivity = activity.current;
      if (currentActivity == null || performance.now() - currentActivity.lastAtMs > DIRECTION_TIMEOUT) { activity.current = null; report(); return; }
      report();
      const current = fromBottom(element);
      const direction = current > previous ? "away" : current < previous ? "toward" : null;
      if (direction === currentActivity.direction) {
        currentActivity.lastAtMs = performance.now();
        if (current > previous && nearTop(element, loadPastHiddenHistoryPages)) void loadHistory();
        for (const listener of userListeners.current) listener(current, previous);
        if (current <= 24) activity.current = null;
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0 && fromTop(element) <= 0) void loadHistory();
      if (event.deltaY !== 0) mark(event.deltaY < 0 ? "away" : "toward");
    };
    const onKey = (event: KeyboardEvent) => {
      const direction = keyDirection(event, element);
      if (direction != null) { clearPreserve(); mark(direction); if (direction === "away" && fromTop(element) <= 0) void loadHistory(); }
    };
    const onPointerDown = (event: PointerEvent) => {
      dragStart = null; activity.current = null;
      if (event.pointerType === "mouse" && event.target === element) {
        clearPreserve(); cancelAnimation(); requested.current = null;
        dragStart = { scrollHeightPx: element.scrollHeight, scrollTopPx: element.scrollTop };
      }
    };
    const clearDrag = () => { dragStart = null; };
    const onTouchStart = (event: TouchEvent) => { touch = event.touches.length === 1 ? event.touches[0] : null; };
    const onTouchMove = (event: TouchEvent) => {
      const next = event.touches.length === 1 ? event.touches[0] : null;
      if (touch == null || next == null || next.identifier !== touch.identifier) { touch = null; return; }
      const dx = next.clientX - touch.clientX, dy = next.clientY - touch.clientY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < TOUCH_THRESHOLD) return;
      touch = null;
      if (Math.abs(dy) > Math.abs(dx)) { clearPreserve(); mark(dy > 0 ? "away" : "toward"); }
      if (dy > Math.abs(dx) && fromTop(element) <= 0) void loadHistory();
    };
    const clearTouch = () => { touch = null; };
    element.addEventListener("pointerdown", onPointerDown, options); element.addEventListener("pointerup", clearDrag, options);
    element.addEventListener("pointercancel", clearDrag, options); element.addEventListener("keydown", onKey, options);
    element.addEventListener("touchstart", onTouchStart, options); element.addEventListener("touchmove", onTouchMove, options);
    element.addEventListener("touchend", clearTouch, options); element.addEventListener("touchcancel", clearTouch, options);
    element.addEventListener("wheel", onWheel, options); element.addEventListener("scroll", onScrollEvent, options);
    return () => abort.abort();
  }, [active, applyPreserve, cancelAnimation, clearPreserve, loadHistory, loadPastHiddenHistoryPages, reportDistance]);
  React.useEffect(() => () => { clearPreserve(); cancelAnimation(); }, [cancelAnimation, clearPreserve]);

  const controller: Controller = React.useMemo(() => ({
    addScrollListener: addListener, addUserScrollListener: addUserListener,
    compensateScrollToDistanceFromBottomPx: compensate, getLastScrollDistanceFromBottomPx: getLastDistance,
    getScrollElement: getElement,
    getUnroundedScrollDistanceFromBottomPx(distanceFromBottomPx: number) {
      const value = requested.current;
      return value?.actualDistanceFromBottomPx === distanceFromBottomPx ? value.requestedDistanceFromBottomPx : distanceFromBottomPx;
    },
    isScrolledFromBottom, preserveScrollPositionForNextLayout: preserveNextLayout, scrollToBottom,
    scrollToDistanceFromBottomPx: scrollToDistance, setFooterResizeViewportPreserveDisabled: setFooterPreserveDisabled,
  }), [addListener, addUserListener, compensate, getElement, getLastDistance, isScrolledFromBottom, preserveNextLayout, scrollToBottom, scrollToDistance, setFooterPreserveDisabled]);

  const onFooterResize = stable((entry: unknown) => {
    const height = (initial.jat as (entry: unknown) => { height: number })(entry).height;
    const element = elementRef.current; if (element == null) return;
    const previous = footerHeight.current;
    if (previous === height) return;
    element.style.setProperty("--thread-scroll-padding-bottom", `${height + (presentation === "compact" ? 0 : 16)}px`);
    footerHeight.current = height;
    if (!animationActive.current && !footerPreserveDisabled.current && previous != null && !atBottom(element))
      scrollComputed("instant", current => fromBottom(current) + height - previous);
  });
  const footerRef = (initial.wat as (callback: (entry: unknown) => void) => unknown)(onFooterResize);
  const shiftStyle = contentX == null ? undefined : { x: contentX, "--thread-wide-block-inline-shift": contentShift };
  const button = !active || scrollOrigin === "top" || scrollToBottomButton == null ? null
    : jsx.jsx(ScrollToBottomButton, { ...scrollToBottomButton, responseSpacer });
  const hasDefaultFooter = renderLayout == null && !!footer;
  const motion = shared.o$;
  const footerNode = hasDefaultFooter ? jsx.jsx(motion.div, {
    ref: footerRef,
    className: classes("pointer-events-none absolute inset-x-0 bottom-0 z-10", presentation === "compact" ? "w-full shrink-0" : "pb-4 browser:pb-6"),
    "data-thread-scroll-footer": "true", style: shiftStyle,
    children: jsx.jsxs("div", {
      "data-pip-obstacle": "thread-footer",
      className: classes("relative z-10 flex flex-col *:pointer-events-auto", presentation === "compact" ? undefined : [primary.et, "extension:px-2"]),
      children: [button, footer],
    }),
  }) : null;
  const renderContent = () => jsx.jsxs("div", {
    "data-request-input-activity-root": true,
    className: classes("group/thread-scroll-layout has-[[data-composer-expand-toggle]]:[container-type:size]",
      presentation === "compact" ? "relative flex min-h-0 flex-1 flex-col" : "relative h-full flex-1", "[content-visibility:auto]"),
    children: [
      jsx.jsxs("div", {
        ref: setElement, "data-pip-anchor-host": remoteHostedPIPAnchorHostId,
        ...(presentation === "compact" ? undefined : initial.Agn.timelineScroll),
        className: classes(
          "thread-scroll-container overflow-x-hidden overflow-y-auto group-has-[[data-expanded-composer]]/thread-scroll-layout:overflow-y-hidden [overflow-anchor:none] [scroll-padding-bottom:var(--thread-scroll-padding-bottom,0px)] focus:outline-none",
          presentation === "compact" ? "flex min-h-0 flex-1 flex-col-reverse"
            : "h-full electron:[scrollbar-gutter:stable_both-edges] pt-(--thread-content-top-inset) [--thread-sticky-header-top:calc(var(--spacing)*8)] browser:[--thread-sticky-header-top:var(--thread-content-top-inset,0px)] [&:has([data-thread-scroll-footer='true']:focus-within)]:[scroll-padding-bottom:0px] flex flex-col-reverse",
          presentation === "compact" && (hasDefaultFooter ? styles.compactScrollMask : styles.compactHeaderScrollFade),
          hideScrollbar && "hide-scrollbar",
        ),
        children: [
          jsx.jsxs(motion.div, {
            style: shiftStyle,
            className: classes(styles.scrollContent, "flex min-h-full shrink-0 flex-col justify-start overflow-x-clip [container-name:thread-content] [container-type:inline-size]"),
            children: [
              presentation === "compact" ? null : jsx.jsx(HeaderOverlapProbe, { contentX }),
              jsx.jsx("div", {
                "data-mcp-app-portal-target": "true", ref: initial.YH,
                "data-thread-user-message-navigation-content": true,
                className: classes("relative flex flex-1 shrink-0 flex-col", presentation === "compact" ? undefined
                  : [primary.et, styles.transcriptBody, "has-[[data-compact-status-slot-clearance]]:pb-0"]),
                children,
              }),
              threadEndContent ? jsx.jsx("div", { className: "mt-auto grid",
                children: jsx.jsx("div", { className: "sticky bottom-0 self-end", children: threadEndContent }) }) : null,
              hasDefaultFooter ? jsx.jsx("div", {
                "aria-hidden": true,
                className: classes("sticky bottom-0 z-10 mt-auto w-full shrink-0",
                  presentation === "compact" ? "h-(--thread-scroll-padding-bottom)" : "h-[calc(var(--thread-scroll-padding-bottom)-var(--spacing)*4)]"),
                children: presentation === "compact" ? null : jsx.jsx(primary.tt, {}),
              }) : null,
            ],
          }),
          presentation === "compact" ? null : footerNode,
        ],
      }),
      presentation === "compact" ? footerNode : null,
    ],
  });
  const layout = renderLayout == null ? renderContent()
    : renderLayout({ content: renderContent(), footer: footer ? jsx.jsxs(jsx.Fragment, { children: [button, footer] }) : null });
  return jsx.jsx(scrollContext.t, { value: controller, children: layout });
}

function initializeThreadScrollLayout(): void {
  if (initialized) return;
  initialized = true;
  for (const candidate of [shared.$3, shared.h4, shared.a$, shared.$Q]) call(candidate);
  React = (shared.e6 as () => any)();
  for (const candidate of [
    initial.Ngn, initial.U7, shared.FX, initial.itn, initial.E7, initial.qbt,
    initial.xlt, initial.JH, initial.Sat, shared.g_, primary.rt, scrollContext.n,
    shared.K2, initial.Qa,
  ]) call(candidate);
  jsx = (shared.I3 as () => any)();
}
initializeThreadScrollLayout();
export { initializeThreadScrollLayout as n, ThreadScrollLayout as t };
