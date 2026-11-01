// Popcorn editor surface primitives shared by presentation, workbook, and document artifacts.

import "@rchunk/rolldown-runtime";
import "@rchunk/artifact-source-bootstrap";
import "@rchunk/app-initial";
import "@rchunk/yjs-runtime";
import "@rchunk/popcorn-icons";
import "@rchunk/app-primary";
import "@rchunk/draw-presence-label";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";

interface JsxRuntime {
  Fragment: unknown;
  jsx(
    type: unknown,
    props: Record<string, unknown>,
    key?: string | number,
  ): unknown;
  jsxs(
    type: unknown,
    props: Record<string, unknown>,
    key?: string | number,
  ): unknown;
}
interface Point {
  x: number;
  y: number;
}
interface Rect {
  height: number;
  left: number;
  top: number;
  width: number;
}
interface Stroke {
  color: string;
  points: Point[];
  strokeWidth: number;
}
interface DisabledState {
  draggable: boolean;
  droppable: boolean;
}
interface SortableItem {
  id: string | number;
}
interface CrdtController {
  applyCrdtUpdate?(update: Uint8Array): Promise<void> | void;
  flushCrdtUpdates?(): Promise<void>;
  requestCrdtSnapshot?(): Promise<Uint8Array>;
  subscribeCrdtUpdates?(
    listener: (update: Uint8Array) => void,
  ): (() => void) | void;
}
interface RestoreState {
  artifactLabel?: string;
  errorMessage?: string;
  kind: "failed" | "restoring";
  pendingUpdateCount: number;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 32, 48, 64] as const;
const COLORS = [
  { label: "White", value: "#FFFFFF" },
  { label: "Black", value: "#000000" },
  { label: "Gray", value: "#64748B" },
  { label: "Red", value: "#EF4444" },
  { label: "Orange", value: "#F97316" },
  { label: "Yellow", value: "#EAB308" },
  { label: "Green", value: "#22C55E" },
  { label: "Blue", value: "#3B82F6" },
  { label: "Purple", value: "#A855F7" },
] as const;
const CODEX_THEME: Record<string, string> = {
  "--color-token-main-surface-primary": "var(--color-surface)",
  "--color-token-side-bar-background": "var(--color-surface)",
  "--color-background-accent": "var(--color-background-info-soft)",
  "--color-background-accent-hover": "var(--color-background-info-soft)",
  "--color-background-accent-active": "var(--color-background-info-soft)",
  "--interactive-bg-secondary-hover":
    "var(--color-background-primary-ghost-hover)",
  "--interactive-bg-secondary-press":
    "var(--color-background-primary-ghost-active)",
  "--color-token-bg-primary": "var(--color-surface)",
  "--color-token-bg-secondary": "var(--color-surface-secondary)",
  "--color-token-bg-tertiary": "var(--color-surface-tertiary)",
  "--color-token-charts-blue": "var(--color-blue)",
  "--color-token-interactive-bg-secondary-hover":
    "var(--interactive-bg-secondary-hover)",
  "--color-token-interactive-bg-secondary-press":
    "var(--interactive-bg-secondary-press)",
  "--color-token-interactive-bg-secondary-selected":
    "var(--color-background-primary-soft-active)",
  "--color-token-interactive-bg-accent-muted-hover":
    "var(--color-background-info-soft)",
  "--color-token-interactive-bg-accent-muted-press":
    "var(--color-background-info-soft)",
  "--color-token-foreground": "var(--color-text)",
  "--color-token-description-foreground": "var(--color-text-tertiary)",
  "--color-token-interactive-label-secondary-default":
    "var(--color-token-text-primary)",
  "--color-token-interactive-label-accent-default":
    "var(--color-token-text-link-foreground)",
  "--color-token-focus-border": "var(--color-ring)",
  "--color-token-list-hover-background":
    "var(--color-background-primary-ghost-hover)",
  "--color-token-text-primary": "var(--color-text)",
  "--color-token-text-secondary": "var(--color-text-secondary)",
  "--color-token-text-tertiary": "var(--color-text-tertiary)",
  "--color-token-border-default": "var(--color-border)",
  "--color-token-border-light": "var(--color-border-subtle)",
};

let jsx: JsxRuntime;
let initialized = false;
let drawingId = 0;
function initializeSurface(): void {
  if (initialized) return;
  jsx = getJsxRuntime();
  initialized = true;
}
function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
function reorder<T>(items: readonly T[], from: number, to: number): T[] {
  const result = items.slice();
  const normalizedTo = to < 0 ? result.length + to : to;
  const [item] = result.splice(from, 1);
  if (item !== undefined) result.splice(normalizedTo, 0, item);
  return result;
}
function mapRects<T extends string | number>(
  items: readonly T[],
  rects: Map<T, Rect>,
): Array<Rect | undefined> {
  return items.map((item) => rects.get(item));
}
function isValidIndex(index: number | null): index is number {
  return index !== null && index >= 0;
}
function arraysEqual<T>(left: readonly T[], right: readonly T[]): boolean {
  if (left === right) return true;
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}
function normalizeDisabled(
  value: boolean | Partial<DisabledState>,
): DisabledState {
  return typeof value === "boolean"
    ? { draggable: value, droppable: value }
    : {
        draggable: value.draggable ?? false,
        droppable: value.droppable ?? false,
      };
}
function resolveDisabled(
  value: boolean | Partial<DisabledState> | undefined,
  inherited: DisabledState,
): DisabledState {
  if (typeof value === "boolean") return { draggable: value, droppable: false };
  return {
    draggable: value?.draggable ?? inherited.draggable,
    droppable: value?.droppable ?? inherited.droppable,
  };
}
function itemGap(
  rects: Array<Rect | undefined>,
  index: number,
  activeIndex: number,
): number {
  const rect = rects[index];
  const previous = rects[index - 1];
  const next = rects[index + 1];
  if (!rect || (!previous && !next)) return 0;
  if (activeIndex < index)
    return previous
      ? rect.left - (previous.left + previous.width)
      : next!.left - (rect.left + rect.width);
  return next
    ? next.left - (rect.left + rect.width)
    : rect.left - (previous!.left + previous!.width);
}
function rectSortingStrategy({
  rects,
  activeIndex,
  overIndex,
  index,
}: {
  rects: Array<Rect | undefined>;
  activeIndex: number;
  overIndex: number;
  index: number;
}): Record<string, number> | null {
  const reordered = reorder(rects, overIndex, activeIndex);
  const current = rects[index];
  const next = reordered[index];
  return !current || !next
    ? null
    : {
        x: next.left - current.left,
        y: next.top - current.top,
        scaleX: next.width / current.width,
        scaleY: next.height / current.height,
      };
}
function horizontalSortingStrategy({
  rects,
  activeNodeRect,
  activeIndex,
  overIndex,
  index,
}: {
  rects: Array<Rect | undefined>;
  activeNodeRect?: Rect | null;
  activeIndex: number;
  overIndex: number;
  index: number;
}): Record<string, number> | null {
  const active = rects[activeIndex] ?? activeNodeRect;
  if (!active) return null;
  const gap = itemGap(rects, index, activeIndex);
  if (index === activeIndex) {
    const over = rects[overIndex];
    return over
      ? {
          x:
            activeIndex < overIndex
              ? over.left + over.width - (active.left + active.width)
              : over.left - active.left,
          y: 0,
          scaleX: 1,
          scaleY: 1,
        }
      : null;
  }
  if (index > activeIndex && index <= overIndex)
    return { x: -active.width - gap, y: 0, scaleX: 1, scaleY: 1 };
  if (index < activeIndex && index >= overIndex)
    return { x: active.width + gap, y: 0, scaleX: 1, scaleY: 1 };
  return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
}
function sortableNewIndex<T>({
  id,
  items,
  activeIndex,
  overIndex,
}: {
  id: T;
  items: T[];
  activeIndex: number;
  overIndex: number;
}): number {
  return reorder(items, activeIndex, overIndex).indexOf(id);
}

function SortableContext({
  children,
  id = "Sortable",
  items,
  disabled = false,
  strategy = rectSortingStrategy,
}: {
  children?: unknown;
  id?: string;
  items: Array<string | number | SortableItem>;
  disabled?: boolean | Partial<DisabledState>;
  strategy?: unknown;
}): unknown {
  initializeSurface();
  const ids = items.map((item) => (typeof item === "object" ? item.id : item));
  return jsx.jsx("div", {
    "data-popcorn-sortable-context": id,
    "data-items": ids.join(","),
    "data-disabled": JSON.stringify(normalizeDisabled(disabled)),
    "data-strategy":
      strategy === horizontalSortingStrategy ? "horizontal" : "rect",
    children,
  });
}
function useSortable({
  id,
  items = [],
  activeId = null,
  overId = null,
  disabled = false,
}: {
  id: string | number;
  items?: Array<string | number>;
  activeId?: string | number | null;
  overId?: string | number | null;
  disabled?: boolean | Partial<DisabledState>;
}): Record<string, unknown> {
  const index = items.indexOf(id);
  const activeIndex = activeId == null ? -1 : items.indexOf(activeId);
  const overIndex = overId == null ? -1 : items.indexOf(overId);
  return {
    active: activeId,
    activeIndex,
    attributes: { "aria-roledescription": "sortable" },
    data: { sortable: { containerId: "Sortable", index, items } },
    disabled: resolveDisabled(disabled, { draggable: false, droppable: false }),
    index,
    isDragging: activeId === id,
    isSorting: activeId != null,
    newIndex:
      isValidIndex(activeIndex) && isValidIndex(overIndex)
        ? sortableNewIndex({ id, items, activeIndex, overIndex })
        : index,
    overIndex,
    transform: null,
    transition: "transform 200ms ease",
  };
}

function annotationTargetKey(target: unknown): string {
  if (typeof target !== "object" || target === null || !("type" in target))
    return String(target);
  const value = target as Record<string, unknown>;
  if (value.type === "workbook-range") {
    const rect = value.rect as Record<string, unknown>;
    return `${value.type}:${value.sheetName}:${rect.r1}:${rect.c1}:${rect.r2}:${rect.c2}`;
  }
  if (value.type === "workbook-floating-element")
    return `${value.type}:${value.sheetName}:${value.elementId}`;
  if (value.type === "presentation-element-selection")
    return `${value.type}:${value.slideId}:${[...((value.elementIds as Iterable<string>) ?? [])].sort().join(",")}`;
  if (value.type === "presentation-region") {
    const frame = value.frame as Rect;
    return `${value.type}:${value.slideId}:${frame.left}:${frame.top}:${frame.width}:${frame.height}`;
  }
  return String(value.type);
}
function annotationOrdinals(
  annotations: Array<{ annotationId: string; target: unknown }>,
): Map<string, number> {
  const result = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const annotation of annotations) {
    const key = annotationTargetKey(annotation.target);
    const ordinal = counts.get(key) ?? 0;
    result.set(annotation.annotationId, ordinal);
    counts.set(key, ordinal + 1);
  }
  return result;
}
function markerPosition(
  rect: Rect,
  placement:
    "top-left" | "top-right" | "bottom-left" | "bottom-right" = "top-right",
  ordinal = 0,
): { left: number; top: number } {
  const offset = ordinal * 20;
  if (rect.width === 0 && rect.height === 0)
    return { left: rect.left, top: rect.top + offset };
  return {
    left: placement.endsWith("-left") ? rect.left : rect.left + rect.width,
    top:
      Math.max(
        13,
        placement.startsWith("bottom-") ? rect.top + rect.height : rect.top,
      ) + offset,
  };
}
function avoidMarkerCollisions(
  position: { left: number; top: number },
  occupied: Array<{ left: number; top: number }>,
): { left: number; top: number } {
  const next = { ...position };
  for (const marker of [...occupied].sort((a, b) => a.top - b.top))
    if (
      Math.abs(next.left - marker.left) < 26 &&
      Math.abs(next.top - marker.top) < 26
    )
      next.top = marker.top + 26;
  return next;
}
function AnnotationMarker({
  position,
  icon,
  color,
  draft = false,
  selected = false,
  testId,
  title,
  onClick,
}: {
  position: { left: number; top: number };
  icon?: unknown;
  color?: string;
  draft?: boolean;
  selected?: boolean;
  testId?: string;
  title?: string;
  onClick?(): void;
}): unknown {
  initializeSurface();
  const type = onClick ? "button" : "div";
  return jsx.jsxs(type, {
    type: onClick ? "button" : undefined,
    "data-testid": testId,
    "data-popcorn-annotation-marker": "true",
    "data-draft": draft,
    "aria-pressed": selected,
    title,
    className: "absolute z-30 flex size-[26px] items-center justify-center",
    style: {
      color: color ?? "var(--color-token-text-link-foreground, #339cff)",
      left: position.left,
      top: position.top,
      transform: `translate(-50%, -50%)${selected ? " scale(1.08)" : ""}`,
    },
    onClick,
    children: [
      jsx.jsx("span", {
        "aria-hidden": true,
        className: "absolute inset-0 rounded-full bg-blue-500",
      }),
      icon == null
        ? null
        : jsx.jsx("span", { className: "relative text-white", children: icon }),
    ],
  });
}
function PresenceMarker({
  position,
  author,
  isUnreadAssistant = false,
  children,
  onClick,
}: {
  position: { left: number; top: number };
  author?: { avatarUrl?: string; displayName: string; initials?: string };
  isUnreadAssistant?: boolean;
  children?: unknown;
  onClick?(): void;
}): unknown {
  initializeSurface();
  const fallback = author?.initials ?? author?.displayName.slice(0, 1) ?? "●";
  return jsx.jsx("button", {
    type: "button",
    "data-popcorn-annotation-marker": "true",
    "aria-label": author?.displayName ?? "Comment",
    className: cx(
      "absolute z-30 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full",
      isUnreadAssistant
        ? "bg-text-info text-info-solid"
        : "bg-surface text-default",
    ),
    style: { left: position.left, top: position.top },
    onClick,
    children:
      children ??
      (author?.avatarUrl
        ? jsx.jsx("img", {
            alt: "",
            src: author.avatarUrl,
            className: "size-4 rounded-full",
          })
        : fallback),
  });
}
function Highlight({
  bounds,
  appearance,
  borderRadius,
  fillOnly,
  borderWidthPx,
  borderColor,
  fillColor,
  shadow,
  testId,
}: {
  bounds: Rect;
  appearance?: string;
  borderRadius?: number;
  fillOnly?: boolean;
  borderWidthPx?: number;
  borderColor?: string;
  fillColor?: string;
  shadow?: string;
  testId?: string;
}): unknown {
  initializeSurface();
  return jsx.jsx("div", {
    "data-testid": testId,
    "data-appearance": appearance,
    className: "pointer-events-none absolute box-border",
    style: {
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      borderRadius,
      borderStyle: fillOnly ? undefined : "solid",
      borderWidth: borderWidthPx,
      borderColor,
      backgroundColor: fillColor,
      boxShadow: shadow,
    },
  });
}

function pointsPath(points: Point[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}
function pointsBounds(points: Point[]): Rect | null {
  const first = points[0];
  if (!first) return null;
  let left = first.x;
  let right = first.x;
  let top = first.y;
  let bottom = first.y;
  for (const point of points.slice(1)) {
    left = Math.min(left, point.x);
    right = Math.max(right, point.x);
    top = Math.min(top, point.y);
    bottom = Math.max(bottom, point.y);
  }
  return { left, top, width: right - left, height: bottom - top };
}
function strokesBounds(strokes: Stroke[]): Rect | null {
  return pointsBounds(strokes.flatMap((stroke) => stroke.points));
}
function paddedRect(
  rect: Rect,
  {
    paddingPx = 24,
    minSizePx = 96,
  }: { paddingPx?: number; minSizePx?: number } = {},
): Rect {
  const width = Math.max(minSizePx, rect.width + paddingPx * 2);
  const height = Math.max(minSizePx, rect.height + paddingPx * 2);
  return {
    left: rect.left - (width - rect.width) / 2,
    top: rect.top - (height - rect.height) / 2,
    width,
    height,
  };
}
function clampRect(
  rect: Rect,
  viewport: { width: number; height: number },
): Rect {
  const width = Math.min(viewport.width, rect.width);
  const height = Math.min(viewport.height, rect.height);
  return {
    left: Math.min(Math.max(0, rect.left), Math.max(0, viewport.width - width)),
    top: Math.min(Math.max(0, rect.top), Math.max(0, viewport.height - height)),
    width,
    height,
  };
}
function drawingCommentPayload({
  drawingId: id,
  screenshot,
  markerViewportPoint,
  viewportSize,
}: {
  drawingId: string;
  screenshot: Record<string, unknown>;
  markerViewportPoint?: Point;
  viewportSize?: { width: number; height: number };
}): Record<string, unknown> {
  return {
    localBrowserCommentMetadata: {
      kind: "region",
      ...(markerViewportPoint
        ? { markerViewportPoint: { ...markerViewportPoint } }
        : {}),
      ...(viewportSize ? { viewportSize: { ...viewportSize } } : {}),
    },
    localBrowserScreenshot: { ...screenshot, commentId: id },
  };
}
async function exportDrawingScreenshot({
  cropRect,
  viewportSize,
  baseCanvas,
  overlayCanvases = [],
  strokes,
  projectPoint,
  mimeType = "image/png",
}: {
  cropRect: Rect;
  viewportSize: { width: number; height: number };
  baseCanvas: HTMLCanvasElement | OffscreenCanvas;
  overlayCanvases?: Array<HTMLCanvasElement | OffscreenCanvas | null>;
  strokes: Stroke[];
  projectPoint(point: Point): Point | null;
  mimeType?: string;
}): Promise<{ blob: Blob; height: number; mimeType: string; width: number }> {
  if (
    typeof OffscreenCanvas === "undefined" ||
    typeof OffscreenCanvas.prototype.convertToBlob !== "function"
  )
    throw new Error(
      "Popcorn drawing screenshot export requires OffscreenCanvas support.",
    );
  const scaleX = baseCanvas.width / Math.max(1, viewportSize.width);
  const scaleY = baseCanvas.height / Math.max(1, viewportSize.height);
  const width = Math.max(1, Math.round(cropRect.width * scaleX));
  const height = Math.max(1, Math.round(cropRect.height * scaleY));
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Failed to acquire OffscreenCanvas 2d context.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  for (const source of [baseCanvas, ...overlayCanvases])
    if (source && source.width > 0 && source.height > 0)
      context.drawImage(
        source,
        cropRect.left * (source.width / Math.max(1, viewportSize.width)),
        cropRect.top * (source.height / Math.max(1, viewportSize.height)),
        cropRect.width * (source.width / Math.max(1, viewportSize.width)),
        cropRect.height * (source.height / Math.max(1, viewportSize.height)),
        0,
        0,
        width,
        height,
      );
  for (const stroke of strokes) {
    const points = stroke.points
      .map(projectPoint)
      .filter((point): point is Point => point !== null);
    if (points.length === 0) continue;
    context.beginPath();
    context.strokeStyle = stroke.color;
    context.fillStyle = stroke.color;
    context.lineWidth =
      stroke.strokeWidth *
      Math.max(width / cropRect.width, height / cropRect.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    points.forEach((point, index) =>
      index === 0
        ? context.moveTo(
            ((point.x - cropRect.left) * width) / cropRect.width,
            ((point.y - cropRect.top) * height) / cropRect.height,
          )
        : context.lineTo(
            ((point.x - cropRect.left) * width) / cropRect.width,
            ((point.y - cropRect.top) * height) / cropRect.height,
          ),
    );
    if (points.length === 1)
      (context.arc(
        ((points[0]!.x - cropRect.left) * width) / cropRect.width,
        ((points[0]!.y - cropRect.top) * height) / cropRect.height,
        context.lineWidth / 2,
        0,
        Math.PI * 2,
      ),
        context.fill());
    else context.stroke();
  }
  return {
    blob: await canvas.convertToBlob({ type: mimeType }),
    width,
    height,
    mimeType,
  };
}
function DrawingOverlay({
  strokes,
  projectPoint,
  testId,
  clipBounds,
}: {
  strokes: Stroke[];
  projectPoint(point: Point): Point | null;
  testId?: string;
  clipBounds?: Rect;
}): unknown {
  initializeSurface();
  if (strokes.length === 0) return null;
  return jsx.jsx("svg", {
    "data-testid": testId,
    className: "pointer-events-none absolute inset-0 z-20",
    width: "100%",
    height: "100%",
    viewBox: clipBounds
      ? `${clipBounds.left} ${clipBounds.top} ${clipBounds.width} ${clipBounds.height}`
      : undefined,
    children: strokes.map((stroke, index) => {
      const points = stroke.points
        .map(projectPoint)
        .filter((point): point is Point => point !== null);
      return points.length === 1
        ? jsx.jsx(
            "circle",
            {
              cx: points[0]!.x,
              cy: points[0]!.y,
              r: stroke.strokeWidth / 2,
              fill: stroke.color,
            },
            index,
          )
        : jsx.jsx(
            "path",
            {
              d: pointsPath(points),
              fill: "none",
              stroke: stroke.color,
              strokeWidth: stroke.strokeWidth,
              strokeLinecap: "round",
              strokeLinejoin: "round",
            },
            index,
          );
    }),
  });
}
function createDrawingId(prefix: string): string {
  drawingId += 1;
  return `${prefix}-${Date.now().toString(36)}-${drawingId.toString(36)}`;
}

function ModeButton({
  active,
  disabled = false,
  onClick,
  label,
  activeLabel = label,
  testId,
  icon,
}: {
  active: boolean;
  disabled?: boolean;
  onClick(): void;
  label: string;
  activeLabel?: string;
  testId?: string;
  icon?: unknown;
}): unknown {
  initializeSurface();
  return jsx.jsxs("button", {
    type: "button",
    "data-testid": testId,
    "aria-label": active ? activeLabel : label,
    "aria-pressed": active,
    disabled,
    className: cx(
      "inline-flex h-8 items-center rounded-lg",
      active ? "bg-info-soft px-2.5 text-info" : "size-8 justify-center",
    ),
    onClick,
    children: [
      icon ?? jsx.jsx("span", { "aria-hidden": true, children: "●" }),
      active
        ? jsx.jsx("span", { className: "ms-1.5", children: activeLabel })
        : null,
    ],
  });
}
function AnnotationButton(
  props: Omit<Parameters<typeof ModeButton>[0], "label" | "activeLabel">,
): unknown {
  return ModeButton({
    ...props,
    label: "Annotation",
    activeLabel: "Annotating",
  });
}
function CommentsButton({
  active,
  disabled = false,
  onClick,
  testId = "popcorn-presentation-comments-button",
}: {
  active: boolean;
  disabled?: boolean;
  onClick(): void;
  testId?: string;
}): unknown {
  initializeSurface();
  return jsx.jsx("button", {
    type: "button",
    "aria-label": "Comments",
    "aria-expanded": active,
    "data-testid": testId,
    disabled,
    onClick,
    children: "Comments",
  });
}
function DrawingButton(
  props: Omit<Parameters<typeof ModeButton>[0], "label">,
): unknown {
  return ModeButton({ ...props, label: "Drawing" });
}
function ArtifactBadge({
  kind,
  children,
  className,
}: {
  kind: "workbook" | "presentation" | "document" | "whiteboard";
  children?: unknown;
  className?: string;
}): unknown {
  initializeSurface();
  return jsx.jsx("div", {
    "data-kind": kind,
    className: cx(
      "inline-flex items-center justify-center rounded-md p-1",
      kind === "workbook"
        ? "bg-[#04b84c] text-white"
        : kind === "presentation"
          ? "bg-orange-300 text-white"
          : "border border-token-border-light",
      className,
    ),
    children,
  });
}
function ActionMenu({
  trigger,
  actions,
}: {
  trigger?: unknown;
  actions: Array<{
    color?: string;
    disabled?: boolean;
    icon?: unknown;
    id: string;
    kind?: "button" | "separator";
    label?: string;
    onSelect?(): void;
    testId?: string;
  }>;
}): unknown {
  initializeSurface();
  return jsx.jsxs("div", {
    className: "relative",
    children: [
      trigger,
      jsx.jsx("div", {
        role: "menu",
        children: actions.map((action) =>
          action.kind === "separator"
            ? jsx.jsx("hr", {}, action.id)
            : jsx.jsx(
                "button",
                {
                  type: "button",
                  role: "menuitem",
                  disabled: action.disabled,
                  "data-testid": action.testId,
                  className:
                    action.color === "danger" ? "text-red-600" : undefined,
                  onClick: action.onSelect,
                  children: action.label,
                },
                action.id,
              ),
        ),
      }),
    ],
  });
}
function CommentThread({
  thread,
  label,
  sourceLabel,
  onSelect,
}: {
  thread: { comments?: unknown[]; threadId: string };
  label?: string;
  sourceLabel?: string;
  onSelect?(id: string): void;
}): unknown {
  initializeSurface();
  return jsx.jsxs("article", {
    "data-thread-id": thread.threadId,
    "aria-label": label ?? "Comment thread",
    onClick: () => onSelect?.(thread.threadId),
    children: [
      sourceLabel ? jsx.jsx("small", { children: sourceLabel }) : null,
      jsx.jsx("div", { children: `${thread.comments?.length ?? 0} comments` }),
    ],
  });
}
function CommentsSidebar({
  threads,
  onClose,
  sidebarLabel = "Comments",
}: {
  threads: Array<{ threadId: string; comments?: unknown[] }>;
  onClose?(): void;
  sidebarLabel?: string;
}): unknown {
  initializeSurface();
  return jsx.jsxs("aside", {
    "aria-label": sidebarLabel,
    children: [
      jsx.jsx("button", {
        type: "button",
        "aria-label": "Close comments",
        onClick: onClose,
        children: "×",
      }),
      threads.length === 0
        ? jsx.jsx("p", { children: "No comments yet" })
        : threads.map((thread) =>
            jsx.jsx(CommentThread, { thread }, thread.threadId),
          ),
    ],
  });
}

function FontSizePicker({
  fontSize,
  onChange,
}: {
  fontSize: number;
  onChange(value: number): void;
}): unknown {
  initializeSurface();
  return jsx.jsx("div", {
    role: "listbox",
    "aria-label": "Font size",
    children: FONT_SIZES.map((size) =>
      jsx.jsxs(
        "button",
        {
          type: "button",
          role: "option",
          "aria-selected": size === fontSize,
          onClick: () => onChange(size),
          children: [size, " pt"],
        },
        size,
      ),
    ),
  });
}
function colorsEqual(left: string, right: string): boolean {
  return left.toUpperCase() === right.toUpperCase();
}
function shortcutLabel(): string {
  return typeof navigator !== "undefined" &&
    /Win|Linux/.test(navigator.platform)
    ? "Ctrl I"
    : "⌘I";
}
function ColorPicker({
  color,
  onChange,
  label = "Color",
  allowNone = false,
}: {
  color?: string | null;
  onChange(value: string | null): void;
  label?: string;
  allowNone?: boolean;
}): unknown {
  initializeSurface();
  const options: Array<{ label: string; value: string | null }> = allowNone
    ? [{ label: "No fill", value: null }, ...COLORS]
    : [...COLORS];
  return jsx.jsx("div", {
    role: "group",
    "aria-label": label,
    children: options.map((option) =>
      jsx.jsx(
        "button",
        {
          type: "button",
          "aria-label": option.label,
          "aria-pressed":
            option.value === null
              ? color == null
              : color != null && colorsEqual(color, option.value),
          style: { backgroundColor: option.value ?? "transparent" },
          onClick: () => onChange(option.value),
        },
        option.value ?? "none",
      ),
    ),
  });
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number | undefined,
  message: string,
): Promise<T> {
  if (timeoutMs === undefined) return promise;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(message)),
      Math.max(0, timeoutMs),
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
function nonEmptyUpdates(updates?: Uint8Array[]): Uint8Array[] {
  return (updates ?? []).filter((update) => update.length > 0);
}
function mergeUpdates(updates: Uint8Array[]): Uint8Array | null {
  const values = nonEmptyUpdates(updates);
  if (values.length === 0) return null;
  if (values.length === 1) return values[0] ?? null;
  const length = values.reduce((sum, update) => sum + update.length, 0);
  const merged = new Uint8Array(length);
  let offset = 0;
  for (const update of values) {
    merged.set(update, offset);
    offset += update.length;
  }
  return merged;
}
function bootstrapCrdtState({
  initialCrdtState,
  externalCrdtUpdates,
}: {
  initialCrdtState?: Uint8Array;
  externalCrdtUpdates?: Uint8Array[];
}): {
  bootstrappedExternalCrdtUpdates: Uint8Array[];
  externalCrdtUpdates: Uint8Array[];
  initialCrdtState?: Uint8Array;
} {
  const updates = nonEmptyUpdates(externalCrdtUpdates);
  const initial =
    mergeUpdates([
      ...(initialCrdtState?.length ? [initialCrdtState] : []),
      ...updates,
    ]) ?? initialCrdtState;
  return {
    initialCrdtState: initial ?? undefined,
    bootstrappedExternalCrdtUpdates: updates,
    externalCrdtUpdates: [],
  };
}
function restoreErrorMessage(error: unknown, artifactLabel: string): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : `Failed to restore external ${artifactLabel.toLowerCase()} edits.`;
}
function CrdtRestoreOverlay({
  artifactLabel,
  restoreState,
}: {
  artifactLabel: string;
  restoreState: RestoreState | null;
}): unknown {
  initializeSurface();
  if (!restoreState) return null;
  return jsx.jsx("div", {
    className: "absolute inset-0 z-10 flex items-end",
    role: restoreState.kind === "failed" ? "alert" : "status",
    children:
      restoreState.kind === "failed"
        ? `Could not restore ${artifactLabel.toLowerCase()} edits. ${restoreState.errorMessage ?? ""} Pending CRDT updates: ${restoreState.pendingUpdateCount}.`
        : `Restoring ${artifactLabel.toLowerCase()} edits. Compacting and applying ${restoreState.pendingUpdateCount} CRDT updates.`,
  });
}
function createCrdtBridge({
  artifactLabel,
  controller,
  externalCrdtUpdates = [],
  onCrdtUpdate,
}: {
  artifactLabel: string;
  controller?: CrdtController;
  externalCrdtUpdates?: Uint8Array[];
  onCrdtUpdate?(update: Uint8Array): void;
}): {
  crdtPublishingReady: boolean;
  restore: () => Promise<void>;
  restoreState: RestoreState | null;
} {
  const pending = nonEmptyUpdates(externalCrdtUpdates);
  return {
    crdtPublishingReady: controller != null,
    restoreState:
      pending.length >= 500
        ? { kind: "restoring", pendingUpdateCount: pending.length }
        : null,
    restore: async () => {
      const update = mergeUpdates(pending);
      if (update && controller?.applyCrdtUpdate)
        await controller.applyCrdtUpdate(update);
      if (update) onCrdtUpdate?.(update);
      if (controller?.requestCrdtSnapshot)
        await withTimeout(
          controller.requestCrdtSnapshot(),
          5_000,
          `${artifactLabel} CRDT drain attempt timed out.`,
        );
    },
  };
}
function resolveSurfaceStyle(
  theme: string,
  baseTheme: Record<string, string> = {},
): Record<string, string> {
  return theme === "codex" ? CODEX_THEME : baseTheme;
}

function noopInitializer(): void {
  initializeSurface();
}
const AnnotationContext = {
  Consumer: ({ children }: { children(value: undefined): unknown }) =>
    children(undefined),
  Provider: ({ children }: { children?: unknown }) => children,
};
const DEFAULT_DRAWING_COLOR = "#111111";

export {
  AnnotationMarker as $,
  noopInitializer as A,
  createDrawingId as B,
  ActionMenu as C,
  noopInitializer as D,
  noopInitializer as E,
  noopInitializer as F,
  exportDrawingScreenshot as G,
  DrawingOverlay as H,
  AnnotationButton as I,
  strokesBounds as J,
  clampRect as K,
  CommentsButton as L,
  annotationTargetKey as M,
  markerPosition as N,
  avoidMarkerCollisions as O,
  noopInitializer as P,
  Highlight as Q,
  DrawingButton as R,
  noopInitializer as S,
  ArtifactBadge as T,
  noopInitializer as U,
  noopInitializer as V,
  DEFAULT_DRAWING_COLOR as W,
  noopInitializer as X,
  paddedRect as Y,
  ModeButton as Z,
  CommentThread as _,
  bootstrapCrdtState as a,
  annotationOrdinals as at,
  noopInitializer as b,
  CommentsSidebar as c,
  horizontalSortingStrategy as ct,
  ColorPicker as d,
  useSortable as dt,
  shortcutLabel as et,
  FontSizePicker as f,
  noopInitializer as g,
  AnnotationContext as h,
  noopInitializer as i,
  noopInitializer as it,
  PresenceMarker as j,
  noopInitializer as k,
  noopInitializer as l,
  noopInitializer as lt,
  colorsEqual as m,
  noopInitializer as n,
  noopInitializer as nt,
  createCrdtBridge as o,
  noopInitializer as ot,
  noopInitializer as p,
  drawingCommentPayload as q,
  CrdtRestoreOverlay as r,
  avoidMarkerCollisions as rt,
  restoreErrorMessage as s,
  SortableContext as st,
  resolveSurfaceStyle as t,
  markerPosition as tt,
  COLORS as u,
  rectSortingStrategy as ut,
  noopInitializer as v,
  noopInitializer as w,
  CommentsSidebar as x,
  PresenceMarker as y,
  noopInitializer as z,
};

initializeSurface();
