import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as scrollChunk from "@rchunk/thread-scroll-controller-context-value";

export interface ResponseSpacerHandle {
  clear(): void;
  getHeightPx(): number;
  place(): void;
  scrollToBottom(): void;
}

interface ResponseSpacerProps {
  initialPlacementKey?: unknown;
  onResponseSpacerStateChange(handle: ResponseSpacerHandle | null): void;
}

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
const scroll = scrollChunk as unknown as Record<string, unknown>;
let React: {
  useContext<T>(context: unknown): T;
  useEffect(effect: () => void | (() => void), deps: unknown[]): void;
  useLayoutEffect(effect: () => void | (() => void), deps: unknown[]): void;
  useRef<T>(value: T): { current: T };
  useState<T>(value: T | (() => T)): [T, (value: T) => void];
};
let jsx: { jsx(component: unknown, props: Record<string, unknown>): unknown };
let responseSpacerInitialized = false;
let responseWatcherInitialized = false;
let composerProviderInitialized = false;

function call(value: unknown): void { if (typeof value === "function") value(); }
function viewportPadding(element: HTMLElement): number {
  const value = Number.parseFloat(element.style.getPropertyValue("--thread-scroll-padding-bottom"));
  return Number.isFinite(value) ? value : 0;
}
function desiredSpacerHeight(element: HTMLElement): number {
  const available = Math.max(0, element.clientHeight - viewportPadding(element));
  return Math.max(0, Math.min(available * (2 / 3), available - 240));
}

function ResponseSpacer({ initialPlacementKey, onResponseSpacerStateChange }: ResponseSpacerProps): unknown {
  initializeResponseSpacer();
  const height = React.useRef(0);
  const pendingReduction = React.useRef(0);
  const frame = React.useRef<number | null>(null);
  const elementRef = React.useRef<HTMLDivElement | null>(null);
  const controller = (scroll.r as () => {
    addScrollListener(listener: (distanceFromBottomPx: number) => void): () => void;
    addUserScrollListener(listener: (current: number, previous: number | null) => void): () => void;
    compensateScrollToDistanceFromBottomPx(distance: number): void;
    getLastScrollDistanceFromBottomPx(): number;
    getScrollElement(): HTMLElement | null;
    getUnroundedScrollDistanceFromBottomPx(distanceFromBottomPx: number): number;
    scrollToBottom(): void;
    scrollToDistanceFromBottomPx(distance: number, behavior: "instant"): void;
  })();
  const observer = React.useContext<unknown>(initial.kat);
  const useStableCallback = shared.__ as <Callback extends (...args: never[]) => unknown>(callback: Callback) => Callback;
  const setHeight = useStableCallback((value: number) => {
    height.current = value;
    if (elementRef.current != null) elementRef.current.style.height = `${value}px`;
  });
  const cancelFrame = useStableCallback(() => {
    if (frame.current != null) window.cancelAnimationFrame(frame.current);
    frame.current = null;
    pendingReduction.current = 0;
  });
  const clear = useStableCallback(() => { cancelFrame(); setHeight(0); });
  const scrollToBottom = useStableCallback(() => { clear(); controller.scrollToBottom(); });
  const reconcile = useStableCallback(() => {
    const current = height.current;
    const scrollElement = controller.getScrollElement();
    const spacer = elementRef.current;
    if (current <= 0 || scrollElement == null || spacer == null) return;
    const distance = controller.getLastScrollDistanceFromBottomPx();
    const bounds = scrollElement.getBoundingClientRect();
    const scale = bounds.height / scrollElement.clientHeight;
    const viewportBottom = bounds.bottom - viewportPadding(scrollElement) * scale;
    if (distance < current && spacer.getBoundingClientRect().top < viewportBottom - scale) return;
    setHeight(0);
    controller.scrollToDistanceFromBottomPx(Math.max(0, distance - current), "instant");
  });
  const reduce = useStableCallback((delta: number) => {
    if (delta <= 0) return;
    const previous = height.current;
    const next = Math.max(0, previous - delta);
    if (next === previous) return;
    const distance = controller.getLastScrollDistanceFromBottomPx();
    setHeight(next);
    controller.compensateScrollToDistanceFromBottomPx(Math.max(0, distance - (previous - next)));
    reconcile();
  });
  const flushReduction = useStableCallback(() => {
    frame.current = null;
    const delta = pendingReduction.current;
    pendingReduction.current = 0;
    reduce(delta);
  });
  const place = useStableCallback(() => {
    const scrollElement = controller.getScrollElement();
    if (scrollElement == null) return;
    cancelFrame();
    setHeight(desiredSpacerHeight(scrollElement));
    controller.scrollToDistanceFromBottomPx(1, "instant");
  });
  const constrainToViewport = useStableCallback(() => {
    const scrollElement = controller.getScrollElement();
    const current = height.current;
    if (scrollElement == null || scrollElement.clientHeight <= 0 || current <= 0) return;
    const next = Math.min(current, desiredSpacerHeight(scrollElement));
    if (next === current) return;
    const overscroll = Math.max(0, -scrollElement.scrollTop);
    setHeight(next);
    controller.compensateScrollToDistanceFromBottomPx(Math.max(0, overscroll - (current - next)));
  });
  React.useLayoutEffect(() => {
    const scrollElement = controller.getScrollElement();
    if (scrollElement == null) return;
    let resizeFrame: number | null = null;
    const onResize = () => { resizeFrame ??= window.requestAnimationFrame(() => { resizeFrame = null; constrainToViewport(); }); };
    const footer = scrollElement.parentElement?.querySelector<HTMLElement>("[data-thread-scroll-footer]");
    const elements = footer == null ? [scrollElement] : [scrollElement, footer];
    for (const element of elements) (initial.Eat as (input: Record<string, unknown>) => void)({ element, callback: onResize, observer });
    return () => {
      for (const element of elements) (initial.Oat as (input: Record<string, unknown>) => void)({ element, callback: onResize, observer });
      if (resizeFrame != null) window.cancelAnimationFrame(resizeFrame);
    };
  }, [constrainToViewport, controller, observer]);
  React.useLayoutEffect(() => {
    const scrollElement = controller.getScrollElement();
    const spacer = elementRef.current;
    if (scrollElement == null || spacer == null || typeof IntersectionObserver === "undefined") return;
    const intersection = new IntersectionObserver(reconcile, { root: scrollElement, threshold: Array.from({ length: 101 }, (_, index) => index / 100) });
    intersection.observe(spacer);
    return () => intersection.disconnect();
  }, [controller, reconcile]);
  React.useLayoutEffect(() => {
    const removeScroll = controller.addScrollListener(distance => {
      if (height.current > 0 && controller.getUnroundedScrollDistanceFromBottomPx(distance) === 0) clear();
    });
    const removeUserScroll = controller.addUserScrollListener((current, previous) => {
      if (previous == null || current - previous <= 0) return;
      pendingReduction.current += current - previous;
      frame.current ??= window.requestAnimationFrame(flushReduction);
    });
    return () => { removeScroll(); removeUserScroll(); cancelFrame(); };
  }, [cancelFrame, clear, controller, flushReduction]);
  React.useLayoutEffect(() => {
    onResponseSpacerStateChange({ clear, getHeightPx: () => height.current, place, scrollToBottom });
    return () => onResponseSpacerStateChange(null);
  }, [clear, onResponseSpacerStateChange, place, scrollToBottom]);
  React.useLayoutEffect(() => { if (initialPlacementKey != null) place(); }, [initialPlacementKey, place]);
  return jsx.jsx("div", { ref: elementRef, className: "shrink-0", "aria-hidden": true });
}

function createResponseSpacerStore() {
  let value: ResponseSpacerHandle | null = null;
  const listeners = new Set<() => void>();
  const set = (next: ResponseSpacerHandle | null) => { value = next; for (const listener of listeners) listener(); };
  return {
    getSnapshot: () => value,
    subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
    register(next: ResponseSpacerHandle) { set(next); return () => { if (value === next) set(null); }; },
  };
}

function ComposerProvider({ children }: { children?: unknown }): unknown {
  initializeComposerProvider();
  const [store] = React.useState(createResponseSpacerStore);
  return jsx.jsx(initial.vW, { value: store, children });
}

function ConversationResponseWatcher({ conversationId }: { conversationId: string }): null {
  initializeConversationResponseWatcher();
  const scope = (shared.LX as (root: unknown) => {
    get(signal: unknown, key: unknown): unknown;
    watch(listener: (state: { get(signal: unknown, key: unknown): unknown }) => void): () => void;
  })(shared.ZI);
  const { mutate } = (initial.pht as () => { mutate(id: unknown): void })();
  React.useEffect(() => {
    (initial.SHt as (scope: unknown, id: string, watching: boolean) => void)(scope, conversationId, true);
    const unwatch = scope.watch(({ get }) => {
      const responseId = get(initial.wVt, conversationId);
      if (responseId == null || get(initial.NSt, responseId) !== true) return;
      const key = (initial.Z1t as (id: unknown) => unknown)(responseId);
      (initial.K1t as (scope: unknown, key: unknown, value: unknown) => void)(scope, key, scope.get(initial.LSt, key));
      mutate(responseId);
    });
    return () => { unwatch(); (initial.SHt as (scope: unknown, id: string, watching: boolean) => void)(scope, conversationId, false); };
  }, [conversationId, mutate, scope]);
  return null;
}

function initializeResponseSpacer(): void {
  if (responseSpacerInitialized) return;
  responseSpacerInitialized = true;
  call(shared.$3);
  React = (shared.e6 as () => typeof React)();
  for (const value of [initial.Aat, initial.Dat, scroll.n, shared.g_]) call(value);
  jsx = (shared.I3 as () => typeof jsx)();
}
function initializeConversationResponseWatcher(): void {
  if (responseWatcherInitialized) return;
  responseWatcherInitialized = true;
  call(shared.$3);
  call(shared.FX);
  React = (shared.e6 as () => typeof React)();
  for (const value of [initial.rht, shared.QI, initial.G1t, initial.MSt, initial.t0t, initial.uHt]) call(value);
}
function initializeComposerProvider(): void {
  if (composerProviderInitialized) return;
  composerProviderInitialized = true;
  call(shared.$3);
  React = (shared.e6 as () => typeof React)();
  call(initial.yW);
  jsx = (shared.I3 as () => typeof jsx)();
}

export {
  ResponseSpacer as a,
  initializeConversationResponseWatcher as i,
  initializeComposerProvider as n,
  initializeResponseSpacer as o,
  ConversationResponseWatcher as r,
  ComposerProvider as t,
};
