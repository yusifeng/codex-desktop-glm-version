// Floating composer orchestration for the right browser panel.
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import * as alignmentChunk from "@rchunk/right-panel-composer-overlay-alignment";
import * as wheelChunk from "@rchunk/wheel-swipe-gesture";

export type OverlayVisibility = "entering" | "visible" | "exiting" | "hidden";
export type ComposerOverlayMode = "default" | "compact" | "expanded";
interface MutableRef<Value> { current: Value }
interface ReactRuntime {
  useContext<Value>(context: unknown): Value;
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useLayoutEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useRef<Value>(initialValue: Value): MutableRef<Value>;
  useState<Value>(initialValue: Value | (() => Value)): [Value, (next: Value | ((previous: Value) => Value)) => void];
  useSyncExternalStore?<Value>(subscribe: (listener: () => void) => () => void, getSnapshot: () => Value, getServerSnapshot?: () => Value): Value;
}
interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface Scope { get?(signal: unknown): unknown; set?(signal: unknown, value: unknown): void; value?: { routeKind?: string } }
interface BrowserTabSnapshot { tabType?: unknown; url?: string; isSuspended?: boolean; securityState?: unknown; isLoading?: boolean }
interface BrowserHost { setFloatingComposerRevealTracking?(options: Record<string, unknown>): void }

const shared = sharedChunk as unknown as {
  C_?: unknown;
  HX?: <Value>(signal: unknown) => Value;
  I3: () => JsxRuntime;
  LX?: (signal: unknown) => Scope;
  P3?: () => { createPortal(node: unknown, container: Element): unknown };
  e6: () => ReactRuntime;
  m4?: (...values: unknown[]) => string;
  xm?: (value: number, zoom: number) => number;
};
const initial = initialChunk as unknown as Record<string, unknown> & {
  $en?: unknown;
  Jen?: (value: unknown) => string | null;
  Ken?: (scope: Scope) => string | null;
  Yen?: (value: unknown) => boolean;
  _gt?: { subscribe(listener: () => void): () => void; getSnapshot(hostId: string, tabId: string): BrowserTabSnapshot | null };
  qvt?: { activeTab$?: unknown };
};
const primary = primaryChunk as unknown as { ar?: unknown; et?: { browserHost?: BrowserHost }; or?: unknown; rt?: unknown };
const alignment = alignmentChunk as unknown as { r?: (scope: Scope, options?: unknown) => void; t?: () => void };
const wheel = wheelChunk as unknown as { t?: new () => { begin(event: WheelEvent, duration: number): void; isContinuation(event: WheelEvent): boolean } };
const React = shared.e6();
const jsx = shared.I3();
const portals = shared.P3?.();
const classes = shared.m4 ?? ((...values: unknown[]) => values.filter(Boolean).join(" "));
const scaleValue = shared.xm ?? ((value: number) => value);

function readSignal<Value>(signal: unknown, fallback: Value): Value {
  if (signal == null) return fallback;
  try { return shared.HX?.<Value>(signal) ?? fallback; } catch { return fallback; }
}
function browserReadiness(hostId: string | null, tabId: string | null): "ready" | "loading" | "unavailable" {
  const read = () => hostId == null || tabId == null ? null : initial._gt?.getSnapshot(hostId, tabId) ?? null;
  const subscribe = (listener: () => void) => initial._gt?.subscribe(listener) ?? (() => {});
  const snapshot = React.useSyncExternalStore?.(subscribe, read, read) ?? read();
  if (hostId == null || tabId == null || initial._gt == null) return "ready";
  if (snapshot == null || snapshot.url?.trim().length === 0 || snapshot.isSuspended || snapshot.securityState != null) return "unavailable";
  return snapshot.isLoading ? "loading" : "ready";
}
function visibilityFor(showOverlay: boolean, transition: OverlayVisibility): OverlayVisibility {
  return showOverlay ? (transition === "entering" ? "entering" : "visible") : transition === "exiting" ? "exiting" : "hidden";
}
function wheelDirection(event: { deltaX: number; deltaY: number }, direction: "hide" | "reveal"): boolean {
  return Math.abs(event.deltaY) > Math.abs(event.deltaX) && (direction === "hide" ? event.deltaY >= 0 : event.deltaY <= 0);
}
function HideHandle({ visible, onActivate, onWheel }: { visible: boolean; onActivate(event: MouseEvent | WheelEvent): void; onWheel(event: WheelEvent): void }): unknown {
  return jsx.jsx("button", { type: "button", className: "right-panel-composer-overlay__hide", "aria-hidden": !visible, inert: visible ? undefined : "", tabIndex: visible ? 0 : -1, onClick: onActivate, onWheel: (event: WheelEvent) => { if (wheelDirection(event, "hide")) { event.stopPropagation(); onWheel(event); } }, children: jsx.jsx("span", { className: "sr-only", children: "Hide floating composer" }) });
}
function RevealHandle({ active, visible, onActivate, onPointerEnter, onPointerLeave, onTransitionEnd, onWheel }: { active: boolean; visible: boolean; onActivate(event: MouseEvent | WheelEvent): void; onPointerEnter(): void; onPointerLeave(): void; onTransitionEnd(event: TransitionEvent): void; onWheel(event: WheelEvent): void }): unknown {
  return jsx.jsx("button", { type: "button", className: classes("right-panel-composer-overlay__reveal", active && "is-active"), "data-testid": "floating-composer-reveal-handle", "aria-hidden": !visible, inert: visible ? undefined : "", tabIndex: visible ? 0 : -1, onClick: onActivate, onPointerEnter, onPointerLeave, onTransitionEnd, onWheel: (event: WheelEvent) => { if (wheelDirection(event, "reveal")) { event.stopPropagation(); onWheel(event); } }, children: jsx.jsx("span", { className: "sr-only", children: "Show floating composer" }) });
}

class ComposerWheelController {
  readonly swipeTracker = wheel.t == null ? null : new wheel.t();
  begin(event: WheelEvent, surface: "composer" | "peek"): void { this.swipeTracker?.begin(event, surface === "peek" ? 400 : 150); }
  handle(event: WheelEvent, options: { enabled: boolean; interactiveContent: HTMLElement | null; gestureSurface: HTMLElement | null; latestTurn: HTMLElement | null; compact: boolean; composerFocused: boolean; onLatestTurnExpandedChange?(expanded: boolean): void }): void {
    if (!options.enabled || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || !(event.target instanceof Element) || options.interactiveContent == null || options.gestureSurface == null) return;
    const target = options.gestureSurface.contains(event.target) ? event.target : options.interactiveContent.ownerDocument.elementFromPoint?.(event.clientX, event.clientY);
    if (!(target instanceof Element) || !options.gestureSurface.contains(target) || options.latestTurn?.contains(target)) return;
    const composer = options.gestureSurface.querySelector<HTMLElement>("[data-codex-composer]");
    const scrollSurface = composer?.parentElement;
    if (options.compact) { if (event.deltaY > 0 && composer != null) { event.preventDefault(); event.stopPropagation(); this.begin(event, "composer"); composer.focus(); } return; }
    if (this.swipeTracker?.isContinuation(event)) { event.preventDefault(); event.stopPropagation(); return; }
    if (options.composerFocused && scrollSurface != null && scrollSurface.scrollHeight <= scrollSurface.clientHeight && options.onLatestTurnExpandedChange != null) { event.preventDefault(); event.stopPropagation(); options.onLatestTurnExpandedChange(event.deltaY > 0); }
  }
}

interface RightPanelComposerOverlayProps<Child> {
  children: Child;
  expandComposerContentImmediately?: boolean;
  forceExpanded?: boolean;
  latestTurnContentRef?: MutableRef<HTMLElement | null>;
  reserveFullComposerHeight?: boolean;
  onLatestTurnExpandedChange?(expanded: boolean): void;
  // Explicit values are retained for isolated hosts and focused contract tests;
  // production callers normally omit them and use the app signals below.
  browserPanelEnabled?: boolean;
  browserReady?: boolean;
  browserPeeked?: boolean;
  browserTabMatchesConversation?: boolean;
  bottomPanelHeight?: string;
  overlayVisibility?: OverlayVisibility;
  transitionHeight?: number;
  composerFocused?: boolean;
  reduceMotion?: boolean;
  activeBrowserTabId?: string | null;
  overlayHost?: HTMLElement | null;
  zoom?: number;
}

function RightPanelComposerOverlay<Child>(input: RightPanelComposerOverlayProps<Child>) {
  const scope = shared.LX?.(initial.$en) ?? {};
  const activeTabState = readSignal(initial.qvt?.activeTab$, null);
  const runtimeTabId = initial.Jen?.(activeTabState) ?? null;
  const activeTabId = input.activeBrowserTabId === undefined ? runtimeTabId : input.activeBrowserTabId;
  const hostId = initial.Ken?.(scope) ?? null;
  const readiness = input.browserReady === undefined ? browserReadiness(hostId, activeTabId) : input.browserReady ? "ready" : "unavailable";
  const runtimePanelEnabled = initial.Yen?.(activeTabState) === true && readSignal(initial.Jbt, false);
  const panelEnabled = input.browserPanelEnabled ?? runtimePanelEnabled;
  const runtimeOverlayTab = readSignal<string | null>(initial.tQ, null);
  const tabMatchesConversation = input.browserTabMatchesConversation ?? (activeTabId != null && runtimeOverlayTab === activeTabId);
  const composerFocused = input.composerFocused ?? tabMatchesConversation;
  const browserPeeked = input.browserPeeked ?? readSignal(initial.nQ, false);
  const browserSuppressed = readSignal(initial.hU, false);
  const browserAvailable = readSignal(initial.bU, true);
  const pointerPeek = panelEnabled && readiness === "ready" && browserAvailable && !browserSuppressed && !browserPeeked;
  const showOverlay = !panelEnabled || readiness !== "ready" || browserSuppressed || browserPeeked;
  const runtimeTransition = readSignal<OverlayVisibility>(initial.yU, showOverlay ? "visible" : "hidden");
  const transition = input.overlayVisibility ?? runtimeTransition;
  const visibility = visibilityFor(showOverlay, transition);
  const shouldRender = visibility !== "hidden" || pointerPeek;
  const mode: ComposerOverlayMode = panelEnabled ? input.forceExpanded || tabMatchesConversation || browserPeeked ? "expanded" : "compact" : "default";

  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const revealPortalRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const interactiveRef = React.useRef<HTMLDivElement | null>(null);
  const gestureRef = React.useRef<HTMLDivElement | null>(null);
  const fallbackLatestTurnRef = React.useRef<HTMLElement | null>(null);
  const latestTurnRef = input.latestTurnContentRef ?? fallbackLatestTurnRef;
  const [revealHovered, setRevealHovered] = React.useState(false);
  const [revealTracked, setRevealTracked] = React.useState<string | null>(null);
  const [contentReady, setContentReady] = React.useState(true);
  const [controller] = React.useState(() => new ComposerWheelController());
  const zoom = input.zoom ?? 1;
  const overlayHost = input.overlayHost ?? (React.useContext<HTMLElement | null>(shared.C_) || null);
  const reducedMotion = input.reduceMotion ?? false;

  const hide = (event: MouseEvent | WheelEvent) => {
    input.onLatestTurnExpandedChange?.(false);
    setRevealTracked(null); setRevealHovered(false);
    alignment.r?.(scope, { prefersReducedMotion: reducedMotion || (event.type === "click" && (event as MouseEvent).detail === 0) });
    alignment.t?.();
  };
  const reveal = (event: MouseEvent | WheelEvent) => {
    input.onLatestTurnExpandedChange?.(false);
    if (activeTabId != null && event.type === "click" && (event as MouseEvent).detail !== 0) setRevealTracked(activeTabId);
    alignment.r?.(scope, { prefersReducedMotion: reducedMotion || (event.type === "click" && (event as MouseEvent).detail === 0) });
  };
  const measure = () => {
    const hostRect = overlayHost?.getBoundingClientRect();
    if (hostRect != null && hostRef.current != null) {
      const geometry = { height: `${scaleValue(hostRect.height, zoom)}px`, left: `${scaleValue(hostRect.left, zoom)}px`, top: `${scaleValue(hostRect.top, zoom)}px`, width: `${scaleValue(hostRect.width, zoom)}px` };
      Object.assign(hostRef.current.style, geometry); if (revealPortalRef.current != null) Object.assign(revealPortalRef.current.style, geometry);
    }
    const contentHeight = contentRef.current?.getBoundingClientRect().height ?? 0;
    scope.set?.(initial.gU, Math.max(input.transitionHeight ?? 0, Math.ceil(scaleValue(contentHeight, zoom))));
  };
  React.useLayoutEffect(() => {
    if (!shouldRender) return;
    measure();
    const observed = contentRef.current;
    if (observed == null || typeof ResizeObserver === "undefined") return;
    const resize = new ResizeObserver(measure); resize.observe(observed); if (overlayHost != null) resize.observe(overlayHost);
    const mutation = typeof MutationObserver === "undefined" ? null : new MutationObserver(measure);
    mutation?.observe(observed, { attributes: true, attributeFilter: ["aria-expanded"], childList: true, subtree: true });
    window.addEventListener("resize", measure);
    return () => { resize.disconnect(); mutation?.disconnect(); window.removeEventListener("resize", measure); };
  }, [overlayHost, shouldRender, zoom]);
  React.useEffect(() => {
    const document = interactiveRef.current?.ownerDocument;
    if (!panelEnabled || !shouldRender || document == null) return;
    const listener = (event: WheelEvent) => controller.handle(event, { enabled: !pointerPeek, interactiveContent: interactiveRef.current, gestureSurface: gestureRef.current, latestTurn: latestTurnRef.current, compact: mode === "compact", composerFocused, onLatestTurnExpandedChange: input.onLatestTurnExpandedChange });
    document.addEventListener("wheel", listener, { capture: true, passive: false });
    return () => document.removeEventListener("wheel", listener, true);
  }, [composerFocused, controller, input.onLatestTurnExpandedChange, mode, panelEnabled, pointerPeek, shouldRender]);
  React.useEffect(() => {
    const browserHost = primary.et?.browserHost;
    const conversationId = hostId;
    if (!pointerPeek || activeTabId == null || conversationId == null || browserHost == null) return;
    browserHost.setFloatingComposerRevealTracking?.({ activationHeightPx: 48 * zoom, browserTabId: activeTabId, conversationId, enabled: true });
    return () => browserHost.setFloatingComposerRevealTracking?.({ activationHeightPx: 48 * zoom, browserTabId: activeTabId, conversationId, enabled: false });
  }, [activeTabId, hostId, pointerPeek, zoom]);
  React.useLayoutEffect(() => { if (mode === "expanded") setContentReady(input.expandComposerContentImmediately === true || reducedMotion); else setContentReady(true); }, [input.expandComposerContentImmediately, mode, reducedMotion]);
  if (!shouldRender) return null;

  const transitionHeight = input.transitionHeight ?? readSignal<number>(initial.gU, 0);
  const bottomPanelHeight = input.bottomPanelHeight ?? "0px";
  const overlayStyle = { "--right-panel-composer-overlay-bottom-panel-height": bottomPanelHeight, bottom: "var(--right-panel-composer-overlay-bottom-panel-height)", transform: `translateY(${panelEnabled ? 0 : Math.max(0, 118 - transitionHeight)}px)` };
  const contextValue = { activeBrowserTabId: activeTabId, isExpanding: mode === "expanded" && !contentReady, isInsideOverlay: true, onAttachmentAdded: () => { if (mode === "compact") hide(new MouseEvent("click")); }, shouldAnimate: !reducedMotion };
  const composer = jsx.jsx("div", { ref: gestureRef, "aria-hidden": pointerPeek, inert: pointerPeek ? "" : undefined, className: "right-panel-composer-overlay__composer", "data-prevent-composer-focus-restoration": browserPeeked && !composerFocused, onPointerDownCapture: (event: PointerEvent) => { if ((event.target as Element | null)?.closest?.(":disabled, [aria-disabled='true']") != null) event.preventDefault(); }, onFocusCapture: () => { if (mode === "compact") { scope.set?.(initial.tQ, activeTabId); setContentReady(input.expandComposerContentImmediately === true); } }, children: input.children });
  const content = jsx.jsxs("div", { ref: interactiveRef, className: classes("right-panel-composer-overlay__interactive", visibility === "visible" ? "pointer-events-auto" : "pointer-events-none"), children: [jsx.jsx("div", { ref: contentRef, "data-right-panel-composer-overlay-content": "true", "data-mode": mode, "data-context": JSON.stringify(contextValue), "data-reserve-full-height": input.reserveFullComposerHeight === true, children: composer }), panelEnabled && readiness === "ready" ? jsx.jsx(HideHandle, { visible: visibility === "visible", onActivate: hide, onWheel: hide }) : null] });
  const overlay = jsx.jsx("div", { "aria-hidden": panelEnabled && visibility !== "visible", className: "right-panel-composer-overlay", "data-composer-peeked": pointerPeek, "data-presentation": panelEnabled ? "floating" : "default", "data-testid": "right-panel-composer-overlay", "data-transition-state": visibility, style: overlayStyle, children: content });
  const revealHandle = panelEnabled && readiness === "ready" ? jsx.jsx(RevealHandle, { active: revealTracked === activeTabId || revealHovered, visible: pointerPeek, onPointerEnter: () => setRevealHovered(true), onPointerLeave: () => setRevealHovered(false), onTransitionEnd: () => setRevealTracked(null), onWheel: event => { controller.begin(event, "peek"); reveal(event); }, onActivate: reveal }) : null;
  if (overlayHost == null || portals?.createPortal == null) return jsx.jsxs(jsx.Fragment, { children: [overlay, revealHandle] });
  const overlayPortal = portals.createPortal(jsx.jsx("div", { ref: hostRef, className: "pointer-events-none fixed z-[41]", style: { zoom }, "data-testid": "right-panel-composer-overlay-host", children: overlay }), overlayHost.ownerDocument.body);
  const revealPortal = revealHandle == null ? null : portals.createPortal(jsx.jsx("div", { ref: revealPortalRef, className: "pointer-events-none fixed z-[42]", style: { zoom }, children: revealHandle }), overlayHost.ownerDocument.body);
  return jsx.jsxs(jsx.Fragment, { children: [overlayPortal, revealPortal] });
}

function initializeRightPanelComposerOverlay(): void {}

export { initializeRightPanelComposerOverlay as n, RightPanelComposerOverlay as t };
