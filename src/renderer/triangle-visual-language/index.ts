// Shared triangle SVG visual language. Release chunk: triangle-visual-language-46f026eb70c8.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

interface Point {
  x: number;
  y: number;
}
interface LabelPlacementOptions {
  offset?: number;
  avoidPoints?: Point[];
  viewBoxWidth?: number;
  viewBoxHeight?: number;
}
interface PolygonProps {
  fill?: string;
  points: Point[];
  stroke?: string;
  strokeWidth?: number;
}
interface VertexHandleProps {
  ariaLabel: string;
  cx: number;
  cy: number;
  interactive?: boolean;
  isThumbnail?: boolean;
  onKeyDown?: (event: unknown) => void;
  onPointerDown?: (event: unknown) => void;
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
}
interface ReactRuntime {
  useState<T>(initial: T): [T, (value: T) => void];
}
interface SharedRuntime {
  I3(): JsxRuntime;
  e6(): ReactRuntime;
}

const shared = appSharedChunk as unknown as SharedRuntime;
let React: ReactRuntime;
let jsxRuntime: JsxRuntime;
let visualizationSurface: string;
let accentSurface: string;
let primaryColor: string;
let accentColor: string;
let secondaryTextColor: string;
let mutedTextColor: string;
let handleFill: string;
let handleStroke: string;
let lineStrokeWidth: number;
let handleRadius: number;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

function placeTriangleLabel(
  vertex: Point,
  opposite: Point,
  {
    offset,
    avoidPoints,
    viewBoxWidth = 320,
    viewBoxHeight = 240,
  }: LabelPlacementOptions = {},
): Point {
  const delta = { x: vertex.x - opposite.x, y: vertex.y - opposite.y };
  const length = Math.hypot(delta.x, delta.y);
  const direction =
    length > Number.EPSILON
      ? { x: delta.x / length, y: delta.y / length }
      : { x: 0, y: -1 };
  const centerFor = (candidate: Point, candidateOffset = offset): Point => {
    const diagonal =
      Math.abs(candidate.x) > 0.01 && Math.abs(candidate.y) > 0.01;
    const distance =
      candidateOffset ??
      (diagonal || Math.abs(candidate.x) > Math.abs(candidate.y) ? 52 : 38);
    return {
      x: clamp(vertex.x + candidate.x * distance, 40, viewBoxWidth - 40),
      y: clamp(vertex.y + candidate.y * distance, 20, viewBoxHeight - 20),
    };
  };
  const defaultCenter = centerFor(direction);
  if (!avoidPoints?.length) return defaultCenter;
  const clearance = (center: Point) =>
    Math.min(
      ...avoidPoints.map((point) =>
        Math.hypot(
          Math.max(Math.abs(point.x - center.x) - 36, 0),
          Math.max(Math.abs(point.y - center.y) - 16, 0),
        ),
      ),
    );
  const diagonal = Math.SQRT1_2;
  const directions: Point[] = [
    direction,
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -diagonal, y: -diagonal },
    { x: diagonal, y: -diagonal },
    { x: -diagonal, y: diagonal },
    { x: diagonal, y: diagonal },
  ];
  const offsets = offset === undefined ? [undefined, 72, 96, 128] : [offset];
  return (
    directions
      .flatMap((candidateDirection) =>
        offsets.map((candidateOffset) => ({
          candidateDirection,
          center: centerFor(candidateDirection, candidateOffset),
        })),
      )
      .map(({ candidateDirection: _candidateDirection, center }) => {
        const fromVertex = { x: center.x - vertex.x, y: center.y - vertex.y };
        const distance = Math.hypot(fromVertex.x, fromVertex.y);
        return {
          alignment:
            distance > Number.EPSILON
              ? (fromVertex.x * direction.x + fromVertex.y * direction.y) /
                distance
              : -1,
          center,
          clearance: clearance(center),
        };
      })
      .filter((candidate) => candidate.clearance >= 11.5)
      .sort(
        (left, right) =>
          right.alignment - left.alignment || right.clearance - left.clearance,
      )[0]?.center ?? defaultCenter
  );
}

function pointsToSvg(points: Point[]): string {
  return points.map((point) => point.x + "," + point.y).join(" ");
}

function arrowKeyDelta(key: string, step = 6): Point | null {
  if (key === "ArrowLeft") return { x: -step, y: 0 };
  if (key === "ArrowRight") return { x: step, y: 0 };
  if (key === "ArrowUp") return { x: 0, y: -step };
  if (key === "ArrowDown") return { x: 0, y: step };
  return null;
}

function TrianglePolygon({
  fill = accentSurface,
  points,
  stroke = primaryColor,
  strokeWidth = 2,
}: PolygonProps): unknown {
  return jsxRuntime.jsx("polygon", {
    points: pointsToSvg(points),
    fill,
    stroke,
    strokeLinejoin: "round",
    strokeWidth,
  });
}

function TriangleAnglePill({
  center,
  label,
}: {
  center: Point;
  label: unknown;
}): unknown {
  return jsxRuntime.jsx("foreignObject", {
    x: center.x - 36,
    y: center.y - 16,
    width: 72,
    height: 32,
    pointerEvents: "none",
    "aria-hidden": "true",
    "data-triangle-angle-pill": "",
    children: jsxRuntime.jsx("div", {
      className:
        "flex h-full w-full items-center justify-center rounded-full bg-[var(--learning-block-accent)] text-lg font-semibold text-white",
      children: label,
    }),
  });
}

function TriangleVertexHandle({
  ariaLabel,
  cx,
  cy,
  interactive = true,
  isThumbnail = false,
  onKeyDown,
  onPointerDown,
}: VertexHandleProps): unknown {
  const [focused, setFocused] = React.useState(false);
  return jsxRuntime.jsxs("g", {
    children: [
      jsxRuntime.jsx("circle", {
        cx,
        cy,
        r: handleRadius,
        fill: handleFill,
        stroke: handleStroke,
        strokeWidth: 2,
        pointerEvents: "none",
      }),
      focused
        ? jsxRuntime.jsx("circle", {
            cx,
            cy,
            r: 12,
            fill: "none",
            stroke: accentColor,
            strokeWidth: 2,
            pointerEvents: "none",
            "aria-hidden": "true",
            "data-triangle-focus-halo": "",
          })
        : null,
      interactive && !isThumbnail
        ? jsxRuntime.jsx("circle", {
            cx,
            cy,
            r: 12,
            fill: "transparent",
            stroke: "transparent",
            strokeWidth: 2,
            className: "cursor-grab outline-none active:cursor-grabbing",
            role: "button",
            tabIndex: 0,
            "aria-label": ariaLabel,
            onBlur: () => setFocused(false),
            onFocus: () => setFocused(true),
            onKeyDown,
            onPointerDown,
          })
        : null,
    ],
  });
}

function initializeTriangleVisualLanguage(): void {
  React = shared.e6();
  jsxRuntime = shared.I3();
  visualizationSurface =
    "var(--learning-block-visualization-surface, var(--bg-primary))";
  accentSurface = "var(--learning-block-accent-surface)";
  primaryColor = "var(--learning-block-color-primary)";
  accentColor = "var(--learning-block-accent)";
  secondaryTextColor = "var(--text-secondary)";
  mutedTextColor = "var(--text-secondary)";
  handleFill = "var(--learning-block-accent)";
  handleStroke = visualizationSurface;
  lineStrokeWidth = 1.25;
  handleRadius = 5.5;
}

export {
  mutedTextColor as a,
  TriangleAnglePill as c,
  placeTriangleLabel as d,
  arrowKeyDelta as f,
  handleRadius as i,
  TriangleVertexHandle as l,
  secondaryTextColor as n,
  primaryColor as o,
  initializeTriangleVisualLanguage as p,
  lineStrokeWidth as r,
  visualizationSurface as s,
  accentColor as t,
  TrianglePolygon as u,
};
