// Quick Chat geometry, resize controls, and obstacle observation.

import * as appShared from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";

type Placement = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center" | null;
type HorizontalEdge = "left" | "right";
type VerticalEdge = "top" | "bottom";
interface Size { height: number; width: number }
interface Rect extends Size { left: number; top: number }
interface ResizeHandlesProps {
  currentSize: Size; defaultSize: Size; extendIntoToolbar?: boolean; heightLabel?: string;
  maximumSize: Size; minimumSize: Size; onResize(edge: HorizontalEdge, size: Size): void;
  onResizeEnd(size: Size): void; onResizingChange?(resizing: boolean): void;
  verticalEdge?: VerticalEdge; widthLabel?: string;
}
interface PointerState {
  didMove: boolean; edge: HorizontalEdge | null; lastSize: Size; pointerId: number;
  startPointer: { x: number; y: number }; startSize: Size; verticalEdge: VerticalEdge | null;
}
interface ReactRuntime { useRef<T>(value: T): { current: T } }

const shared = appShared as Record<string, unknown>;
let jsx: JsxRuntime;
let react: ReactRuntime;
const obstacleCleanups = new Map<HTMLElement, (() => void) | null>();
const obstacleSubscribers = new Set<() => void>();
let scheduledNotification: number | null = null;

function positionForPlacement(placement: Placement, size: Size, viewportHeight: number, viewportWidth: number, insetWidth = 0, topInset = 0): { x: number; y: number } {
  if (placement == null) return { x: Math.round((viewportWidth - size.width) / 2), y: Math.round((viewportHeight - size.height) / 2) };
  const inset = 16 - insetWidth / 2;
  let x = placement.endsWith("left") ? inset : viewportWidth - size.width - inset;
  if (placement === "bottom-center") x = Math.round((viewportWidth - size.width) / 2);
  return { x, y: placement.startsWith("top") ? topInset + inset : viewportHeight - size.height - inset };
}
function placementForRect(rect: Rect, viewportHeight: number, viewportWidth: number): Placement {
  const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
  if (centerY >= viewportHeight / 2 && centerX >= viewportWidth / 4 && centerX <= viewportWidth * 3 / 4) return "bottom-center";
  return `${centerY < viewportHeight / 2 ? "top" : "bottom"}-${centerX < viewportWidth / 2 ? "left" : "right"}` as Placement;
}
function nearestPlacement(rect: Rect, viewportHeight: number, viewportWidth: number): Placement {
  return ([null, "bottom-left", "bottom-right"] as Placement[]).reduce((best, candidate) => {
    const a = positionForPlacement(best, rect, viewportHeight, viewportWidth), b = positionForPlacement(candidate, rect, viewportHeight, viewportWidth);
    const da = (rect.left - a.x) ** 2 + (rect.top - a.y) ** 2, db = (rect.left - b.x) ** 2 + (rect.top - b.y) ** 2;
    return db < da ? candidate : best;
  });
}
function clampResizeOffset(placement: Placement, edge: HorizontalEdge, size: Size, offset: number, targetWidth: number, viewportHeight: number, viewportWidth: number, inset = 0): number {
  const base = positionForPlacement(placement, size, viewportHeight, viewportWidth, inset).x + offset;
  const desired = edge === "left" ? base + size.width - targetWidth : base;
  const margin = 16 - inset / 2;
  return Math.min(viewportWidth - targetWidth - margin, Math.max(margin, desired)) - positionForPlacement(placement, { ...size, width: targetWidth }, viewportHeight, viewportWidth, inset).x;
}

function observeObstacle(element: HTMLElement): () => void {
  const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleObstacleNotification);
  const mutationObserver = typeof MutationObserver === "undefined" ? null : new MutationObserver(scheduleObstacleNotification);
  resizeObserver?.observe(element);
  mutationObserver?.observe(element, { attributes: true, attributeFilter: ["style", "class", "data-pip-obstacle"] });
  return () => { resizeObserver?.disconnect(); mutationObserver?.disconnect(); };
}
function registerObstacle(element: HTMLElement | null): (() => void) | undefined {
  if (element == null) return undefined;
  obstacleCleanups.set(element, obstacleSubscribers.size === 0 ? null : observeObstacle(element));
  scheduleObstacleNotification();
  return () => { obstacleCleanups.get(element)?.(); obstacleCleanups.delete(element); scheduleObstacleNotification(); };
}
function obstacleRects(): DOMRect[] {
  return Array.from(obstacleCleanups.keys()).filter((element) => element.dataset.pipObstacle === "quick-chat")
    .map((element) => element.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0);
}
function obstacleSignature(): string {
  return obstacleRects().map((rect) => [rect.left, rect.top, rect.width, rect.height].map(Math.round).join(",")).join(";");
}
function subscribeObstacles(callback: () => void): () => void {
  obstacleSubscribers.add(callback);
  if (obstacleSubscribers.size === 1) {
    for (const element of obstacleCleanups.keys()) obstacleCleanups.set(element, observeObstacle(element));
    if (typeof window !== "undefined") window.addEventListener("resize", scheduleObstacleNotification);
  }
  return () => {
    obstacleSubscribers.delete(callback);
    if (obstacleSubscribers.size !== 0) return;
    for (const [element, cleanup] of obstacleCleanups) { cleanup?.(); obstacleCleanups.set(element, null); }
    if (typeof window !== "undefined") window.removeEventListener("resize", scheduleObstacleNotification);
    if (scheduledNotification != null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(scheduledNotification);
    scheduledNotification = null;
  };
}
function scheduleObstacleNotification(): void {
  if (obstacleSubscribers.size === 0 || scheduledNotification != null) return;
  const schedule = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (callback: FrameRequestCallback): number => setTimeout(() => callback(Date.now()), 0) as unknown as number;
  scheduledNotification = schedule(() => { scheduledNotification = null; for (const callback of obstacleSubscribers) callback(); });
}

function ResizeHandles(props: ResizeHandlesProps): unknown {
  initializeQuickChatObstacles();
  const verticalEdge = props.verticalEdge ?? "top";
  return jsx.jsxs(jsx.Fragment, { children: [
    ...(["left", "right"] as const).map((edge) => jsx.jsx(ResizeHandle, { ...props, edge, verticalEdge: null }, edge)),
    jsx.jsx(ResizeHandle, { ...props, edge: null, verticalEdge }, verticalEdge),
    ...(["left", "right"] as const).map((edge) => jsx.jsx(ResizeHandle, { ...props, edge, verticalEdge }, `${verticalEdge}-${edge}`)),
  ] });
}
function ResizeHandle(props: ResizeHandlesProps & { edge: HorizontalEdge | null; verticalEdge: VerticalEdge | null }): unknown {
  const pointer = react.useRef<PointerState | null>(null);
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
  const move = (event: PointerEvent): void => {
    const state = pointer.current;
    if (state == null || state.pointerId !== event.pointerId) return;
    event.preventDefault();
    const widthDelta = state.edge === "left" ? state.startPointer.x - event.clientX : event.clientX - state.startPointer.x;
    const heightDelta = state.verticalEdge === "top" ? state.startPointer.y - event.clientY : event.clientY - state.startPointer.y;
    const next = {
      width: state.edge == null ? state.startSize.width : clamp(state.startSize.width + widthDelta, props.minimumSize.width, props.maximumSize.width),
      height: state.verticalEdge == null ? state.startSize.height : clamp(state.startSize.height + heightDelta, props.minimumSize.height, props.maximumSize.height),
    };
    state.didMove ||= next.width !== state.startSize.width || next.height !== state.startSize.height;
    state.lastSize = next; props.onResize(state.edge ?? "right", next);
  };
  const finish = (event: PointerEvent, commit: boolean): void => {
    const state = pointer.current; if (state == null || state.pointerId !== event.pointerId) return;
    pointer.current = null; props.onResizingChange?.(false); if (commit && state.didMove) props.onResizeEnd(state.lastSize);
  };
  const cursor = props.edge == null ? "ns-resize" : props.verticalEdge == null ? "ew-resize" : (props.edge === "left") === (props.verticalEdge === "top") ? "nwse-resize" : "nesw-resize";
  return jsx.jsx("div", {
    "aria-hidden": true, "data-quick-chat-resize-edge": [props.verticalEdge, props.edge].filter(Boolean).join("-"),
    className: "quick-chat-resize-handle", style: { cursor, pointerEvents: "auto", touchAction: "none" },
    onLostPointerCapture: (event: PointerEvent) => finish(event, false), onPointerCancel: (event: PointerEvent) => finish(event, true),
    onPointerDown: (event: PointerEvent) => {
      if (event.button !== 0) return; event.preventDefault(); (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
      pointer.current = { didMove: false, edge: props.edge, lastSize: props.currentSize, pointerId: event.pointerId,
        startPointer: { x: event.clientX, y: event.clientY }, startSize: props.currentSize, verticalEdge: props.verticalEdge };
      props.onResizingChange?.(true);
    },
    onPointerMove: move, onPointerUp: (event: PointerEvent) => { move(event); finish(event, true); },
  });
}

function initializeQuickChatObstacles(): void {
  if (jsx != null) return;
  if (typeof shared.I3 !== "function" || typeof shared.e6 !== "function") throw new Error("Quick Chat obstacles require renderer JSX and React runtimes");
  jsx = (shared.I3 as () => JsxRuntime)(); react = (shared.e6 as () => ReactRuntime)();
}
initializeQuickChatObstacles();

export { subscribeObstacles as a, nearestPlacement as c, placementForRect as d, initializeQuickChatObstacles as f,
  registerObstacle as i, clampResizeOffset as l, obstacleSignature as n, ResizeHandles as o,
  initializeQuickChatObstacles as r, initializeQuickChatObstacles as s, obstacleRects as t, positionForPlacement as u };
