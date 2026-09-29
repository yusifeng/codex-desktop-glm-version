import "@rchunk/rolldown-runtime";
import {
  H3 as initializePreloadRuntime,
  I3 as getJsxRuntime,
  K2 as initializeUiRuntime,
  V3 as loadWithPreload,
  e6 as getReactRuntime,
  n4 as useIntl,
  type JsxRuntime,
} from "@rchunk/app-shared";
import { t as initializeLinearScale } from "@rchunk/linear";
import { r as initializeRenderCacheKey, t as getDefinitionCacheKey } from "@rchunk/render-cache-key";
import { u as initializePointerLabel } from "@rchunk/learning-block-pointer-label";
import { a as initializeBuildGraphData, n as evaluateExpression, o as defaultGraphDimensions } from "@rchunk/build-graph-data";
import "@rchunk/chartjs-dataset-helpers";
import { r as initializeColorRoles } from "@rchunk/color-roles";
import { r as initializeInteractiveSampling, t as sampleInteractiveGraphImport } from "@rchunk/interactive-sampling";
import { r as initializeFormatCoordinate, t as formatCoordinateImport } from "@rchunk/format-coordinate";

type Domain = readonly [number, number];
interface Point { x: number; y: number }
interface Viewport { xDomain: Domain; yDomain: Domain }
interface CanvasSize { height: number; padding?: number; width: number }
interface ExpressionToken { type: string; value: number | string }
interface SeriesDefinition {
  cacheKey?: string;
  constants?: Record<string, number>;
  id?: string;
  opacity?: number;
  rpn: readonly ExpressionToken[];
  stroke?: string;
  strokeDasharray?: string;
  strokeWidth?: number;
}
interface ChartPoint extends Point { fill?: string; label?: string; radius?: number; stroke?: string; variant?: string }
interface GeometrySegment {
  from: Point; label?: string; opacity?: number; stroke?: string;
  strokeDasharray?: string; strokeWidth?: number; to: Point;
}
interface GeometryCircle {
  center: Point; fill?: string; opacity?: number; radius: number;
  stroke?: string; strokeDasharray?: string; strokeWidth?: number;
}
interface RightAngleMarker {
  opacity?: number; size?: number; stroke?: string; strokeWidth?: number;
  vertex: Point; xDirection?: number; yDirection?: number;
}
interface OverlayPath { points: readonly Point[]; closed?: boolean }
interface PathOverlay {
  fill?: string; opacity?: number; paths: readonly OverlayPath[];
  stroke?: string; strokeDasharray?: string; strokeWidth?: number;
}
interface ShadedArea {
  baseline?: number; constants?: Record<string, number>; fill?: string; opacity?: number;
  rpn?: readonly ExpressionToken[]; seriesId?: string; seriesIndex?: number;
  xEnd: number; xStart: number;
}
interface InteractiveChartProps {
  ariaLabel?: string;
  className?: string;
  constants?: Record<string, number>;
  geometryCircles?: readonly GeometryCircle[];
  geometrySegments?: readonly GeometrySegment[];
  hoverInteractionMode?: "adaptive" | "default" | string;
  hoverSeriesId?: string;
  initialCanvasSize?: CanvasSize;
  onDragPoint?(index: number, delta: { dx: number; dy: number }, point: Point): void;
  onViewportPan?(): void;
  onViewportReset?(): void;
  pathOverlays?: readonly PathOverlay[];
  points: readonly ChartPoint[];
  rightAngleMarkers?: readonly RightAngleMarker[];
  rpn?: readonly ExpressionToken[];
  series?: readonly SeriesDefinition[];
  shadedArea?: ShadedArea;
  showHoverTooltip?: boolean;
  showPointLabels?: boolean;
  viewport: Viewport;
  viewportUpdateMode?: "preserve" | "reset" | string;
}
interface PointerEventLike {
  clientX: number;
  clientY: number;
  currentTarget: {
    getBoundingClientRect(): { height: number; left: number; top: number; width: number };
    releasePointerCapture?(pointerId: number): void;
    setPointerCapture?(pointerId: number): void;
  };
  pointerId: number;
  preventDefault(): void;
  stopPropagation(): void;
}
interface WheelEventLike extends PointerEventLike { deltaY: number }
interface ReactHooks {
  useCallback<Callback>(callback: Callback, dependencies: readonly unknown[]): Callback;
  useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  useMemo<Value>(factory: () => Value, dependencies: readonly unknown[]): Value;
  useRef<Value>(initialValue: Value): { current: Value };
  useState<Value>(initialValue: Value | (() => Value)): [Value, (value: Value | ((current: Value) => Value)) => void];
}
interface IntlRuntime { formatMessage(descriptor: { defaultMessage: string; id: string }): string }
interface SampleOptions {
  canvasSize: CanvasSize; constants: Record<string, number>; forcedXs?: readonly number[];
  quality?: string; rpn: readonly ExpressionToken[]; viewport: Viewport;
}
interface SampleResult { segments: readonly (readonly Point[])[] }

const sampleInteractiveGraph = sampleInteractiveGraphImport as unknown as (options: SampleOptions) => SampleResult;
const formatCoordinate = formatCoordinateImport as unknown as (value: number, precision?: number) => string;
const definitionKeyFor = getDefinitionCacheKey as unknown as (rpn: readonly ExpressionToken[], constants: Record<string, number>) => string;
const evaluate = evaluateExpression as unknown as (rpn: readonly ExpressionToken[], x: number, constants: Record<string, number>) => number;

let React: ReactHooks;
let jsx: JsxRuntime;
let initialized = false;
let pluginsPromise: Promise<void> | null = null;

function loadInteractionPlugins(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  pluginsPromise ??= Promise.all([
    loadWithPreload(
      () => import("@rchunk/hammer-runtime"),
      ["./hammer-edb1316c3532.js", "./hammer-af276e28ba3d.js", "./rolldown-runtime-2d059c5e81f4.js"],
      import.meta.url,
    ),
    loadWithPreload(
      () => import("@rchunk/chartjs-plugin-zoom"),
      ["./chartjs-plugin-zoom.esm-de28aa5862dc.js", "./rolldown-runtime-2d059c5e81f4.js", "./helpers.dataset-876f4b17664a.js", "./hammer-af276e28ba3d.js"],
      import.meta.url,
    ),
  ]).then(() => undefined);
  return pluginsPromise;
}

function initializeInteractiveChart(): void {
  if (initialized) return;
  initialized = true;
  initializeLinearScale();
  React = getReactRuntime() as unknown as ReactHooks;
  initializeUiRuntime();
  initializeColorRoles();
  initializePointerLabel();
  initializeBuildGraphData();
  initializeFormatCoordinate();
  initializeRenderCacheKey();
  initializeInteractiveSampling();
  jsx = getJsxRuntime();
  initializePreloadRuntime();
  void loadInteractionPlugins();
}

function sameViewport(left: Viewport, right: Viewport): boolean {
  return Math.abs(left.xDomain[0] - right.xDomain[0]) <= 1e-6
    && Math.abs(left.xDomain[1] - right.xDomain[1]) <= 1e-6
    && Math.abs(left.yDomain[0] - right.yDomain[0]) <= 1e-6
    && Math.abs(left.yDomain[1] - right.yDomain[1]) <= 1e-6;
}

function ticks(domain: Domain): number[] {
  const span = domain[1] - domain[0];
  return Array.from({ length: 9 }, (_, index) => domain[0] + span * index / 8);
}

function dashArray(value?: string): string | undefined {
  const values = value?.split(/[\s,]+/).map(Number).filter((entry) => Number.isFinite(entry) && entry >= 0) ?? [];
  return values.length === 0 ? undefined : values.join(" ");
}

function InteractiveChart(props: InteractiveChartProps): unknown {
  const {
    ariaLabel, className, geometryCircles = [], geometrySegments = [],
    hoverInteractionMode = "default", hoverSeriesId,
    initialCanvasSize = defaultGraphDimensions, onDragPoint, onViewportPan,
    onViewportReset, pathOverlays = [], points, rightAngleMarkers = [],
    shadedArea, showHoverTooltip = true, showPointLabels = false, viewport,
    viewportUpdateMode = "reset",
  } = props;
  const intl = useIntl() as IntlRuntime;
  const resetLabel = intl.formatMessage({ id: "learningBlocks.graph.resetViewport", defaultMessage: "Reset viewport" });
  const yInterceptLabel = intl.formatMessage({ id: "learningBlocks.graph.yIntercept", defaultMessage: "y-intercept" });
  const series = React.useMemo(() =>
    (props.series ?? (props.rpn == null ? [] : [{ id: "default", rpn: props.rpn, constants: props.constants }]))
      .map((entry, index) => {
        const id = entry.id ?? "series-" + index;
        return { ...entry, id, cacheKey: id + ":" + index, constants: entry.constants ?? {} };
      }), [props.constants, props.rpn, props.series]);
  const definitionKey = React.useMemo(() => series
    .map((entry) => entry.cacheKey + "=" + definitionKeyFor(entry.rpn, entry.constants))
    .join(";"), [series]);
  const [displayedViewport, setDisplayedViewport] = React.useState<Viewport>(viewport);
  const [hoveredPoint, setHoveredPoint] = React.useState<(Point & { label?: string }) | null>(null);
  const [viewportDirty, setViewportDirty] = React.useState(false);
  const dirtyRef = React.useRef(false);
  const panRef = React.useRef<{ pointerId: number; start: Point; viewport: Viewport } | null>(null);
  const dragRef = React.useRef<{ index: number; last: Point; pointerId: number } | null>(null);

  React.useEffect(() => {
    if (viewportUpdateMode === "reset" || !dirtyRef.current) {
      setDisplayedViewport(viewport);
      if (viewportUpdateMode === "reset") {
        dirtyRef.current = false;
        setViewportDirty(false);
      }
    }
  }, [viewport, viewportUpdateMode]);

  const sampled = React.useMemo(() => series.map((entry) => ({
    ...entry,
    sample: sampleInteractiveGraph({
      canvasSize: initialCanvasSize,
      constants: entry.constants,
      forcedXs: points.map((point) => point.x),
      quality: "interactive",
      rpn: entry.rpn,
      viewport: displayedViewport,
    }),
  })), [definitionKey, displayedViewport, initialCanvasSize, points, series]);

  const width = Math.max(1, initialCanvasSize.width);
  const height = Math.max(1, initialCanvasSize.height);
  const padding = Math.max(0, initialCanvasSize.padding ?? 0);
  const innerWidth = Math.max(1, width - padding * 2);
  const innerHeight = Math.max(1, height - padding * 2);
  const toScreen = React.useCallback((point: Point): Point => ({
    x: padding + (point.x - displayedViewport.xDomain[0]) / (displayedViewport.xDomain[1] - displayedViewport.xDomain[0]) * innerWidth,
    y: padding + (displayedViewport.yDomain[1] - point.y) / (displayedViewport.yDomain[1] - displayedViewport.yDomain[0]) * innerHeight,
  }), [displayedViewport, innerHeight, innerWidth, padding]);
  const fromClient = React.useCallback((event: PointerEventLike): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / Math.max(1, rect.width) * width;
    const y = (event.clientY - rect.top) / Math.max(1, rect.height) * height;
    return {
      x: displayedViewport.xDomain[0] + (x - padding) / innerWidth * (displayedViewport.xDomain[1] - displayedViewport.xDomain[0]),
      y: displayedViewport.yDomain[1] - (y - padding) / innerHeight * (displayedViewport.yDomain[1] - displayedViewport.yDomain[0]),
    };
  }, [displayedViewport, height, innerHeight, innerWidth, padding, width]);
  const updateViewport = React.useCallback((next: Viewport): void => {
    dirtyRef.current = true;
    setViewportDirty(true);
    setDisplayedViewport(next);
  }, []);

  const handleWheel = React.useCallback((event: WheelEventLike): void => {
    event.preventDefault();
    const anchor = fromClient(event);
    const factor = event.deltaY > 0 ? 1.16 : 0.86;
    const zoom = (domain: Domain, value: number): Domain => [
      value + (domain[0] - value) * factor,
      value + (domain[1] - value) * factor,
    ];
    updateViewport({ xDomain: zoom(displayedViewport.xDomain, anchor.x), yDomain: zoom(displayedViewport.yDomain, anchor.y) });
    onViewportPan?.();
  }, [displayedViewport, fromClient, onViewportPan, updateViewport]);

  const handlePointerDown = React.useCallback((event: PointerEventLike): void => {
    const coordinate = fromClient(event);
    if (onDragPoint != null) {
      let closestIndex = -1;
      let closestDistance = Number.POSITIVE_INFINITY;
      points.forEach((point, index) => {
        const distance = Math.hypot(point.x - coordinate.x, point.y - coordinate.y);
        if (distance < closestDistance) { closestDistance = distance; closestIndex = index; }
      });
      const tolerance = Math.max(
        (displayedViewport.xDomain[1] - displayedViewport.xDomain[0]) * 0.04,
        (displayedViewport.yDomain[1] - displayedViewport.yDomain[0]) * 0.04,
      );
      if (closestIndex >= 0 && closestDistance <= tolerance) {
        dragRef.current = { index: closestIndex, last: coordinate, pointerId: event.pointerId };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    panRef.current = { pointerId: event.pointerId, start: coordinate, viewport: displayedViewport };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, [displayedViewport, fromClient, onDragPoint, points]);

  const handlePointerMove = React.useCallback((event: PointerEventLike): void => {
    const coordinate = fromClient(event);
    if (dragRef.current?.pointerId === event.pointerId && onDragPoint != null) {
      const drag = dragRef.current;
      const delta = { dx: coordinate.x - drag.last.x, dy: coordinate.y - drag.last.y };
      dragRef.current = { ...drag, last: coordinate };
      if (delta.dx !== 0 || delta.dy !== 0) onDragPoint(drag.index, delta, coordinate);
      setHoveredPoint(null);
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (panRef.current?.pointerId === event.pointerId) {
      const pan = panRef.current;
      const dx = coordinate.x - pan.start.x;
      const dy = coordinate.y - pan.start.y;
      updateViewport({
        xDomain: [pan.viewport.xDomain[0] - dx, pan.viewport.xDomain[1] - dx],
        yDomain: [pan.viewport.yDomain[0] - dy, pan.viewport.yDomain[1] - dy],
      });
      setHoveredPoint(null);
      return;
    }
    const selected = hoverSeriesId == null ? sampled : sampled.filter((entry) => entry.id === hoverSeriesId);
    const candidates = [
      ...points.map((point) => ({ ...point })),
      ...selected.flatMap((entry) => entry.sample.segments.flatMap((segment) => segment)),
    ];
    const multiplier = hoverInteractionMode === "adaptive" ? 0.08 : 0.04;
    const xTolerance = (displayedViewport.xDomain[1] - displayedViewport.xDomain[0]) * multiplier;
    const yTolerance = (displayedViewport.yDomain[1] - displayedViewport.yDomain[0]) * multiplier;
    let closest: (Point & { label?: string }) | null = null;
    let distance = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      if (Math.abs(candidate.x - coordinate.x) > xTolerance || Math.abs(candidate.y - coordinate.y) > yTolerance) continue;
      const next = Math.hypot((candidate.x - coordinate.x) / xTolerance, (candidate.y - coordinate.y) / yTolerance);
      if (next < distance) { closest = candidate; distance = next; }
    }
    setHoveredPoint(closest);
  }, [displayedViewport, fromClient, hoverInteractionMode, hoverSeriesId, onDragPoint, points, sampled, updateViewport]);

  const handlePointerUp = React.useCallback((event: PointerEventLike): void => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
    if (panRef.current?.pointerId === event.pointerId) { panRef.current = null; onViewportPan?.(); }
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, [onViewportPan]);
  const handleReset = React.useCallback((): void => {
    onViewportReset?.();
    dirtyRef.current = false;
    setViewportDirty(false);
    setDisplayedViewport(viewport);
  }, [onViewportReset, viewport]);
  const linePath = (line: readonly Point[]): string => line.map((point, index) => {
    const screen = toScreen(point);
    return (index === 0 ? "M " : "L ") + screen.x + " " + screen.y;
  }).join(" ");
  const axis = toScreen({ x: 0, y: 0 });
  const hoverScreen = hoveredPoint == null ? null : toScreen(hoveredPoint);
  const shadedSeries = shadedArea == null ? null : (
    shadedArea.rpn != null
      ? { rpn: shadedArea.rpn, constants: shadedArea.constants ?? {} }
      : shadedArea.seriesId != null
        ? series.find((entry) => entry.id === shadedArea.seriesId) ?? null
        : series[shadedArea.seriesIndex ?? 0] ?? null
  );
  const shadedPoints = shadedArea == null || shadedSeries == null ? [] : Array.from({ length: 81 }, (_, index) => {
    const x = shadedArea.xStart + (shadedArea.xEnd - shadedArea.xStart) * index / 80;
    return { x, y: evaluate(shadedSeries.rpn, x, shadedSeries.constants) };
  }).filter((point) => Number.isFinite(point.y));
  const shadedPath = shadedArea == null || shadedPoints.length < 2 ? null : linePath([
    { x: shadedPoints[0].x, y: shadedArea.baseline ?? 0 },
    ...shadedPoints,
    { x: shadedPoints[shadedPoints.length - 1].x, y: shadedArea.baseline ?? 0 },
  ]) + " Z";

  return jsx.jsxs("div", {
    className: className == null ? "graphable-function-chartjs h-full w-full min-w-0" : "graphable-function-chartjs h-full w-full min-w-0 " + className,
    style: { aspectRatio: width + " / " + height, position: "relative" },
    children: [
      jsx.jsxs("svg", {
        role: "img",
        "aria-label": ariaLabel ?? "Interactive graph",
        "data-definition-key": definitionKey,
        viewBox: "0 0 " + width + " " + height,
        onWheel: handleWheel,
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerUp,
        onPointerLeave: () => setHoveredPoint(null),
        style: { display: "block", height: "100%", touchAction: "none", width: "100%" },
        children: [
          jsx.jsx("rect", { x: 0, y: 0, width, height, fill: "var(--bg-primary, transparent)" }),
          ...ticks(displayedViewport.xDomain).map((value, index) => { const screen = toScreen({ x: value, y: 0 }); return jsx.jsx("line", { x1: screen.x, x2: screen.x, y1: padding, y2: height - padding, stroke: "var(--border-light, currentColor)", opacity: 0.18 }, "x-grid-" + index); }),
          ...ticks(displayedViewport.yDomain).map((value, index) => { const screen = toScreen({ x: 0, y: value }); return jsx.jsx("line", { x1: padding, x2: width - padding, y1: screen.y, y2: screen.y, stroke: "var(--border-light, currentColor)", opacity: 0.18 }, "y-grid-" + index); }),
          displayedViewport.xDomain[0] <= 0 && displayedViewport.xDomain[1] >= 0 ? jsx.jsx("line", { x1: axis.x, x2: axis.x, y1: padding, y2: height - padding, stroke: "var(--border-heavy, currentColor)" }) : null,
          displayedViewport.yDomain[0] <= 0 && displayedViewport.yDomain[1] >= 0 ? jsx.jsx("line", { x1: padding, x2: width - padding, y1: axis.y, y2: axis.y, stroke: "var(--border-heavy, currentColor)" }) : null,
          shadedPath == null ? null : jsx.jsx("path", { d: shadedPath, fill: shadedArea?.fill ?? "var(--learning-block-accent, currentColor)", opacity: shadedArea?.opacity ?? 0.16, "data-layer": "shaded-area" }),
          ...pathOverlays.flatMap((overlay, overlayIndex) => overlay.paths.map((path, pathIndex) => jsx.jsx("path", { d: linePath(path.points) + (path.closed ? " Z" : ""), fill: path.closed ? overlay.fill ?? "transparent" : "none", opacity: overlay.opacity ?? 1, stroke: overlay.stroke ?? "var(--learning-block-accent, currentColor)", strokeDasharray: dashArray(overlay.strokeDasharray), strokeWidth: overlay.strokeWidth ?? 1, "data-layer": "path-overlay" }, "overlay-" + overlayIndex + "-" + pathIndex))),
          ...sampled.flatMap((entry) => entry.sample.segments.map((segment, index) => jsx.jsx("path", { d: linePath(segment), fill: "none", opacity: entry.opacity ?? 1, stroke: entry.stroke ?? "var(--learning-block-accent, currentColor)", strokeDasharray: dashArray(entry.strokeDasharray), strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: entry.strokeWidth ?? 2, "data-series-id": entry.id }, entry.cacheKey + "-" + index))),
          ...geometrySegments.map((segment, index) => { const from = toScreen(segment.from); const to = toScreen(segment.to); return jsx.jsxs(jsx.Fragment, { children: [jsx.jsx("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y, opacity: segment.opacity ?? 1, stroke: segment.stroke ?? "var(--learning-block-accent, currentColor)", strokeDasharray: dashArray(segment.strokeDasharray), strokeWidth: segment.strokeWidth ?? 2, "data-layer": "geometry-segment" }), segment.label == null ? null : jsx.jsx("text", { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 8, textAnchor: "middle", children: segment.label })] }, "segment-" + index); }),
          ...geometryCircles.map((circle, index) => { const center = toScreen(circle.center); const edgeX = toScreen({ x: circle.center.x + circle.radius, y: circle.center.y }); const edgeY = toScreen({ x: circle.center.x, y: circle.center.y + circle.radius }); return jsx.jsx("ellipse", { cx: center.x, cy: center.y, rx: Math.abs(edgeX.x - center.x), ry: Math.abs(edgeY.y - center.y), fill: circle.fill ?? "transparent", opacity: circle.opacity ?? 0.95, stroke: circle.stroke ?? "var(--learning-block-accent, currentColor)", strokeDasharray: dashArray(circle.strokeDasharray), strokeWidth: circle.strokeWidth ?? 2, "data-layer": "geometry-circle" }, "circle-" + index); }),
          ...rightAngleMarkers.map((marker, index) => { const vertex = toScreen(marker.vertex); const size = marker.size ?? 10; const xDirection = marker.xDirection ?? 1; const yDirection = marker.yDirection ?? -1; return jsx.jsx("path", { d: "M " + (vertex.x + size * xDirection) + " " + vertex.y + " L " + (vertex.x + size * xDirection) + " " + (vertex.y + size * yDirection) + " L " + vertex.x + " " + (vertex.y + size * yDirection), fill: "none", opacity: marker.opacity ?? 1, stroke: marker.stroke ?? "var(--learning-block-accent, currentColor)", strokeWidth: marker.strokeWidth ?? 1.5, "data-layer": "right-angle-marker" }, "right-angle-" + index); }),
          ...points.map((point, index) => { const screen = toScreen(point); const label = point.label ?? (Math.abs(point.x) <= 1e-9 ? yInterceptLabel : undefined); return jsx.jsxs(jsx.Fragment, { children: [jsx.jsx("circle", { cx: screen.x, cy: screen.y, r: point.radius ?? 4.5, fill: point.fill ?? "var(--bg-primary, white)", stroke: point.stroke ?? "var(--learning-block-accent, currentColor)", strokeWidth: 2, "data-point-index": index, "data-variant": point.variant ?? "point" }), showPointLabels && label != null ? jsx.jsx("text", { x: screen.x, y: screen.y - 10, textAnchor: "middle", children: label }) : null] }, "point-" + index); }),
          hoverScreen == null ? null : jsx.jsx("circle", { cx: hoverScreen.x, cy: hoverScreen.y, r: 5, fill: "var(--bg-primary, white)", stroke: "var(--learning-block-accent, currentColor)", strokeWidth: 2, "data-layer": "hover-point" }),
        ],
      }),
      showHoverTooltip && hoveredPoint != null && hoverScreen != null ? jsx.jsxs("div", { className: "graphable-function-chartjs-tooltip", role: "status", style: { left: hoverScreen.x, pointerEvents: "none", position: "absolute", top: hoverScreen.y }, children: [hoveredPoint.label == null ? null : jsx.jsx("div", { children: hoveredPoint.label }), jsx.jsx("div", { children: formatCoordinate(hoveredPoint.x, 2) + ", " + formatCoordinate(hoveredPoint.y, 2) })] }) : null,
      jsx.jsx("button", { type: "button", className: "graphable-function-chartjs-reset", "aria-label": resetLabel, title: resetLabel, disabled: !viewportDirty || sameViewport(displayedViewport, viewport), onClick: handleReset, style: { opacity: viewportDirty ? 1 : 0, pointerEvents: viewportDirty ? "auto" : "none" }, children: "↺" }),
    ],
  });
}

initializeInteractiveChart();

export { initializeInteractiveChart as n, InteractiveChart as t };
