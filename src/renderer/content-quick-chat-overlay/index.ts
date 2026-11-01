// Quick Chat overlay: portal geometry, docking, content reservation and composer lifecycle.
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import "@rchunk/quick-chat-drop-zones";
import "@rchunk/quick-chat-frame";
import "@rchunk/quick-chat-obstacles";
import "@rchunk/right-panel-composer-overlay-alignment";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type DockPosition = "bottom-left" | "bottom-center" | "bottom-right" | "top-left" | "top-right";
type Presentation = "compact" | "expanded";
type UnknownRecord = Record<string, unknown>;
interface Size { height: number; width: number }
export interface ContentQuickChatOverlayProps {
  autoCollapse?: boolean; children?: unknown | ((presentation: Presentation) => unknown); composerOnly?: boolean;
  dockPosition?: DockPosition; forceExpanded?: boolean; hasElicitation?: boolean; mainContentElement?: HTMLElement | null;
  onDockPositionChange?(position: DockPosition): void; onMinimizedChange?(minimized: boolean): void;
  onPresentationChange?(presentation: Presentation): void; onStop?(): void; portalTarget?: HTMLElement | null;
  presentation?: Presentation; renderTranscript?: ((options?: { isVisible: boolean }) => unknown) | null;
  statusState?: "idle" | "working" | "failed" | string; title?: string; titleContent?: unknown;
  workingStatus?: string; zoom?: number;
}

const shared = appSharedChunk as unknown as UnknownRecord;
const initial = appInitialChunk as unknown as UnknownRecord;
const primary = appPrimaryChunk as unknown as UnknownRecord;
let jsx: JsxRuntime;
let React: ReactRuntime;
let compactPresentationState: unknown = { defaultValue: "compact" as const, key: "quick-chat-presentation" };
let initialized = false;

function getJsx(): JsxRuntime {
  if (jsx == null) {
    const candidate = appSharedChunk.I3 as unknown as JsxRuntime | (() => JsxRuntime);
    jsx = typeof candidate === "function" ? candidate() : candidate;
  }
  return jsx;
}
function getReact(): ReactRuntime {
  if (React == null) {
    const candidate = appSharedChunk.e6 as unknown;
    if (candidate != null) React = (typeof candidate === "function" && !(candidate as { useState?: unknown }).useState
      ? (candidate as () => ReactRuntime)() : candidate) as ReactRuntime;
    else React = createFallbackReact();
  }
  return React;
}
function createFallbackReact(): ReactRuntime {
  return {
    useEffect(effect: () => void | (() => void)) { effect(); },
    useLayoutEffect(effect: () => void | (() => void)) { effect(); },
    useRef<Value>(value: Value) { return { current: value }; },
    useState<Value>(value: Value) { let current = value; return [current, (next: Value | ((previous: Value) => Value)) => { current = typeof next === "function" ? (next as (previous: Value) => Value)(current) : next; }]; },
  } as unknown as ReactRuntime;
}
function getPortalRenderer(): undefined | ((children: unknown, container: Element | DocumentFragment) => unknown) {
  for (const name of ["createPortal", "p"]) {
    if (typeof shared[name] === "function") return shared[name] as (children: unknown, container: Element | DocumentFragment) => unknown;
  }
  return undefined;
}
function clamp(value: number, minimum: number, maximum: number): number { return Math.max(minimum, Math.min(value, maximum)); }
function statusLabel(props: ContentQuickChatOverlayProps): string | null {
  if (props.statusState === "failed") return "Chat stopped with an error";
  if (props.statusState === "working") return props.workingStatus ?? "Working…";
  return null;
}
function edgeFromPointer(event: unknown, bounds: DOMRect | { left: number; right: number }, threshold = 24): "left" | "right" | null {
  if (event == null || typeof event !== "object" || !("clientX" in event)) return null;
  const x = Number((event as { clientX: unknown }).clientX);
  if (!Number.isFinite(x)) return null;
  if (x <= bounds.left + threshold) return "left";
  if (x >= bounds.right - threshold) return "right";
  return null;
}
function resolveDockStyle(position: DockPosition, size: Size | null): UnknownRecord {
  const horizontal = position.endsWith("left") ? { left: 16 } : position.endsWith("right") ? { right: 16 } : { left: "50%", transform: "translateX(-50%)" };
  const vertical = position.startsWith("top") ? { top: 16 } : { bottom: 16 };
  return { ...horizontal, ...vertical, maxHeight: size == null ? undefined : Math.max(180, size.height - 32), maxWidth: size == null ? undefined : Math.max(320, size.width - 32) };
}

function OverlaySurface(props: ContentQuickChatOverlayProps & {
  containerSize: Size | null; dockPosition: DockPosition; dropTarget: "left" | "right" | null;
  minimized: boolean; presentation: Presentation; setDockPosition(position: DockPosition): void;
  setDropTarget(target: "left" | "right" | null): void; setMinimized(value: boolean): void;
  setPresentation(value: Presentation): void;
}): unknown {
  const r = getJsx();
  const label = statusLabel(props);
  const transcript = props.composerOnly ? null : props.renderTranscript?.({ isVisible: !props.minimized });
  const content = typeof props.children === "function" ? props.children(props.presentation) : props.children;
  const expanded = props.forceExpanded === true || props.presentation === "expanded";
  const drag = (event: { clientX: number; currentTarget?: { getBoundingClientRect?(): DOMRect } }) => {
    const bounds = event.currentTarget?.getBoundingClientRect?.();
    if (bounds != null) props.setDropTarget(edgeFromPointer(event, bounds));
  };
  const finishDrag = () => {
    if (props.dropTarget != null) props.setDockPosition(props.dropTarget === "left" ? "bottom-left" : "bottom-right");
    props.setDropTarget(null);
  };
  return r.jsxs("section", {
    "aria-label": props.title ?? "Quick Chat", "data-composer-overlay-floating-ui": true,
    "data-dock-position": props.dockPosition, "data-drop-target": props.dropTarget ?? undefined,
    "data-has-elicitation": props.hasElicitation === true, "data-minimized": props.minimized,
    "data-presentation": props.presentation, "data-status": props.statusState ?? "idle",
    className: `content-quick-chat-overlay content-quick-chat-overlay--${props.presentation}`, role: "dialog",
    style: resolveDockStyle(props.dockPosition, props.containerSize), onPointerMove: drag, onPointerUp: finishDrag,
    children: [
      r.jsxs("header", { className: "content-quick-chat-overlay__header", "data-quick-chat-drag-handle": true, children: [
        r.jsx("h2", { children: props.titleContent ?? props.title ?? "Quick Chat" }),
        r.jsxs("div", { children: [
          props.statusState === "working" ? r.jsx("button", { "aria-label": "Stop response", onClick: props.onStop, type: "button", children: "Stop" }) : null,
          r.jsx("button", { "aria-label": expanded ? "Use compact chat" : "Expand chat", type: "button",
            onClick: () => props.setPresentation(expanded ? "compact" : "expanded"), children: expanded ? "Compact" : "Expand" }),
          r.jsx("button", { "aria-label": props.minimized ? "Restore chat" : "Minimize chat", type: "button",
            onClick: () => props.setMinimized(!props.minimized), children: props.minimized ? "Restore" : "Minimize" }),
        ] }),
      ] }),
      label == null ? null : r.jsx("p", { "aria-live": "polite", className: "content-quick-chat-overlay__status", children: label }),
      props.minimized ? null : r.jsxs("div", { className: "content-quick-chat-overlay__body", children: [
        transcript == null ? null : r.jsx("div", { className: "content-quick-chat-overlay__transcript", children: transcript }),
        r.jsx("div", { className: "content-quick-chat-overlay__composer", children: content }),
      ] }),
    ],
  });
}

function ContentQuickChatOverlay(props: ContentQuickChatOverlayProps): unknown {
  initializeContentQuickChatOverlay();
  const state = getReact();
  const useLayoutEffect = ((state as ReactRuntime & { useLayoutEffect?: ReactRuntime["useEffect"] }).useLayoutEffect ?? state.useEffect).bind(state);
  const overlayRef = state.useRef<HTMLElement | null>(null);
  const [containerSize, setContainerSize] = state.useState<Size | null>(null);
  const [internalPresentation, setInternalPresentation] = state.useState<Presentation>("compact");
  const [minimized, setMinimized] = state.useState(false);
  const [dropTarget, setDropTarget] = state.useState<"left" | "right" | null>(null);
  const [internalDock, setInternalDock] = state.useState<DockPosition>("bottom-right");
  const presentation = props.forceExpanded === true ? "expanded" : (props.presentation ?? internalPresentation);
  const dockPosition = props.dockPosition ?? internalDock;
  const mainContent = props.mainContentElement ?? null;

  useLayoutEffect(() => {
    const target = mainContent;
    const overlay = overlayRef.current;
    if (target == null || overlay == null || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const bounds = target.getBoundingClientRect();
      const next = { height: clamp(bounds.height, 0, window.innerHeight), width: clamp(bounds.width, 0, window.innerWidth) };
      setContainerSize((current) => current?.height === next.height && current.width === next.width ? current : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(target); observer.observe(overlay);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [mainContent]);

  useLayoutEffect(() => {
    if (mainContent == null) return;
    const reserve = minimized ? 0 : presentation === "compact" ? 118 : 0;
    mainContent.style.setProperty("--quick-chat-overlay-reserve-bottom", `${reserve}px`);
    mainContent.style.setProperty("--quick-chat-overlay-dock", dockPosition);
    return () => {
      mainContent.style.removeProperty("--quick-chat-overlay-reserve-bottom");
      mainContent.style.removeProperty("--quick-chat-overlay-dock");
    };
  }, [dockPosition, mainContent, minimized, presentation]);

  state.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMinimized(true); };
    const ownerWindow = mainContent?.ownerDocument.defaultView ?? (typeof window === "undefined" ? null : window);
    ownerWindow?.addEventListener("keydown", onKeyDown);
    return () => ownerWindow?.removeEventListener("keydown", onKeyDown);
  }, [mainContent]);

  const changePresentation = (value: Presentation) => { setInternalPresentation(value); props.onPresentationChange?.(value); };
  const changeMinimized = (value: boolean) => { setMinimized(value); props.onMinimizedChange?.(value); };
  const changeDock = (value: DockPosition) => { setInternalDock(value); props.onDockPositionChange?.(value); };
  const overlayContent = OverlaySurface({ ...props, containerSize, dockPosition, dropTarget, minimized, presentation,
    setDockPosition: changeDock, setDropTarget, setMinimized: changeMinimized, setPresentation: changePresentation });
  const surface = getJsx().jsx("div", { ref: overlayRef, className: "content-quick-chat-overlay__portal", style: { zoom: props.zoom ?? 1 }, children: overlayContent });
  const portalTarget = props.portalTarget ?? mainContent?.ownerDocument.body ?? null;
  const createPortal = getPortalRenderer();
  return portalTarget != null && createPortal != null ? createPortal(surface, portalTarget) : (surface as { props: { children: unknown } }).props.children;
}

function initializeCompactPresentationState(): void {
  const factory = initial.he as undefined | ((owner: unknown, defaultValue: string) => unknown);
  if (factory != null) compactPresentationState = factory(initial.pt, "compact");
}
function initializeContentQuickChatOverlay(): void {
  if (initialized) return;
  initialized = true; getJsx(); getReact(); initializeCompactPresentationState();
  for (const owner of [initial, primary]) {
    const initializer = owner.n;
    if (typeof initializer === "function") (initializer as () => void)();
  }
}

initializeContentQuickChatOverlay();

export { initializeCompactPresentationState as i, initializeContentQuickChatOverlay as n, compactPresentationState as r, ContentQuickChatOverlay as t };
