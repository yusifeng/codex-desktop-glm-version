// Adaptive function-graph sampling. Release chunk: interactive-sampling-1ac392c5c15b.js.
import "@rchunk/rolldown-runtime";
import { G2 as defineMessages, K2 as initializeIntl } from "@rchunk/app-shared";
import * as graphDataChunk from "@rchunk/build-graph-data";

interface Viewport {
  xDomain: [number, number];
  yDomain: [number, number];
}
interface CanvasSize {
  width?: number;
  height?: number;
}
interface SamplePoint {
  x: number;
  y: number;
}
interface ScreenSample {
  x: number;
  y: number | null;
  screenX: number;
  screenY: number;
  isReal: boolean;
}
type SamplingQuality = "interactive" | "settled";
interface SamplingInput {
  viewport: Viewport;
  canvasSize?: CanvasSize;
  rpn: unknown;
  constants: unknown;
  evaluateAt?: (x: number) => number;
  forcedXs?: number[];
  quality?: SamplingQuality;
}
interface PoleAnalysis {
  knownPoleXs: number[];
  periodicAnchorXs: number[];
  explicitPoleXs: number[];
}
interface GraphDataRuntime {
  a(): void;
  n(rpn: unknown, x: number, constants: unknown): number;
  r(
    rpn: unknown,
    constants: unknown,
    minimumX: number,
    maximumX: number,
  ): PoleAnalysis;
}
interface SamplingConfig {
  delta: number;
  maxDepth: number;
  smoothLevel: number;
  jumpLevel: number;
  nanLevel: number;
  testLevel: number;
  cuspThreshold: number;
}

const graphData = graphDataChunk as unknown as GraphDataRuntime;
let graphMessages: ReturnType<typeof defineMessages>;

function initializeGraphMessages(): void {
  initializeIntl();
  graphMessages ??= defineMessages({
    xIntercept: {
      id: "learningBlock.graph.xInterceptTooltipLabel",
      defaultMessage: "x-intercept",
    },
    yIntercept: {
      id: "learningBlock.graph.yInterceptTooltipLabel",
      defaultMessage: "y-intercept",
    },
    intersection: {
      id: "learningBlock.graph.intersectionTooltipLabel",
      defaultMessage: "intersection",
    },
    minimum: {
      id: "learningBlock.graph.minimumTooltipLabel",
      defaultMessage: "minimum",
    },
    maximum: {
      id: "learningBlock.graph.maximumTooltipLabel",
      defaultMessage: "maximum",
    },
    undefinedPoint: {
      id: "learningBlock.graph.undefinedPointTooltipLabel",
      defaultMessage: "undefined point",
    },
    resetViewport: {
      id: "learningBlock.graph.resetViewportButtonLabel",
      defaultMessage: "Reset viewport",
    },
  });
}

const samplingConfig = (quality: SamplingQuality): SamplingConfig =>
  quality === "interactive"
    ? {
        delta: 2,
        maxDepth: 13,
        smoothLevel: 7,
        jumpLevel: 3,
        nanLevel: 9,
        testLevel: 1,
        cuspThreshold: 0.5,
      }
    : {
        delta: 2,
        maxDepth: 17,
        smoothLevel: 8,
        jumpLevel: 2,
        nanLevel: 13,
        testLevel: 1,
        cuspThreshold: 0.5,
      };

function uniqueSorted(values: number[]): number[] {
  return Array.from(
    new Set(values.map((value) => Number(value.toFixed(10)))),
  ).sort((left, right) => left - right);
}

function sampleFunction({
  viewport,
  canvasSize,
  rpn,
  constants,
  evaluateAt,
  forcedXs,
  quality = "settled",
}: SamplingInput): SamplePoint[][] {
  const width = Math.max(1, canvasSize?.width ?? 1);
  const height = Math.max(1, canvasSize?.height ?? width);
  const config = samplingConfig(quality);
  const cache = new Map<number, number | null>();
  const xRange = Math.max(1e-6, viewport.xDomain[1] - viewport.xDomain[0]);
  const yRange = Math.max(1e-6, viewport.yDomain[1] - viewport.yDomain[0]);

  const evaluate = (x: number): number | null => {
    const key = Number(x.toFixed(12));
    if (cache.has(key)) return cache.get(key) ?? null;
    const result = evaluateAt ? evaluateAt(x) : graphData.n(rpn, x, constants);
    const finite = Number.isFinite(result) ? result : null;
    cache.set(key, finite);
    return finite;
  };
  const sample = (x: number): ScreenSample => {
    const y = evaluate(x);
    if (y == null) {
      return {
        x,
        y: null,
        screenX: Number.NaN,
        screenY: Number.NaN,
        isReal: false,
      };
    }
    const screenX = ((x - viewport.xDomain[0]) / xRange) * width;
    const screenY = ((viewport.yDomain[1] - y) / yRange) * height;
    return {
      x,
      y,
      screenX,
      screenY,
      isReal: Number.isFinite(screenX + screenY),
    };
  };
  const outOfBounds = (point: ScreenSample) =>
    point.isReal &&
    (point.screenX < -500 ||
      point.screenY < -500 ||
      point.screenX > width + 500 ||
      point.screenY > height + 500);
  const sameOutsideSide = (left: ScreenSample, right: ScreenSample) =>
    left.isReal &&
    right.isReal &&
    ((left.screenX < -500 && right.screenX < -500) ||
      (left.screenY < -500 && right.screenY < -500) ||
      (left.screenX > width + 500 && right.screenX > width + 500) ||
      (left.screenY > height + 500 && right.screenY > height + 500));
  const distance = (left: ScreenSample, right: ScreenSample) =>
    !left.isReal || !right.isReal
      ? Number.NaN
      : Math.hypot(right.screenX - left.screenX, right.screenY - left.screenY);

  const analysis = graphData.r(
    rpn,
    constants,
    viewport.xDomain[0],
    viewport.xDomain[1],
  );
  const anchors = uniqueSorted([
    viewport.xDomain[0],
    viewport.xDomain[1],
    ...analysis.periodicAnchorXs,
    ...analysis.explicitPoleXs,
    ...(forcedXs ?? []).filter(
      (x) => x >= viewport.xDomain[0] && x <= viewport.xDomain[1],
    ),
  ]);
  const points: Array<SamplePoint | null> = [];
  let previous: ScreenSample | null = null;
  const epsilon = Math.max(1e-9, xRange * 1e-9);

  const breakSegment = () => {
    if (previous != null) points.push(null);
    previous = null;
  };
  const append = (point: ScreenSample) => {
    const visible = point.isReal && point.y != null && !outOfBounds(point);
    if (!visible) {
      breakSegment();
      return;
    }
    if (
      previous &&
      Math.abs(previous.screenX - point.screenX) < 0.8 &&
      Math.abs(previous.screenY - point.screenY) < 0.8
    ) {
      return;
    }
    points.push({ x: point.x, y: point.y });
    previous = point;
  };
  const intervalHasNoRealPoint = (leftX: number, rightX: number) => {
    if (sample(leftX).isReal || sample(rightX).isReal) return false;
    for (let index = 0; index < 20; index += 1) {
      if (sample(leftX + ((index + 0.5) * (rightX - leftX)) / 20).isReal) {
        return false;
      }
    }
    return true;
  };
  const isNearUndefined = (x: number) =>
    !sample(x + epsilon).isReal || !sample(x - epsilon).isReal;

  const refine = (
    left: ScreenSample,
    right: ScreenSample,
    depth: number,
  ): void => {
    if (
      depth < config.nanLevel &&
      (intervalHasNoRealPoint(left.x, right.x) || sameOutsideSide(left, right))
    ) {
      return;
    }
    const middle = sample((left.x + right.x) * 0.5);
    if (depth <= config.testLevel) {
      const oneUndefined = !left.isReal || !middle.isReal || !right.isReal;
      if (oneUndefined) {
        const candidates = [left, middle, right].filter(
          (point) => point.isReal,
        );
        if (
          candidates.length === 1 &&
          !isNearUndefined(candidates[0]?.x ?? 0)
        ) {
          append(candidates[0] as ScreenSample);
          return;
        }
      }
    }
    const whole = distance(left, right);
    const leftHalf = distance(left, middle);
    const rightHalf = distance(middle, right);
    const midpointDistance =
      left.isReal && middle.isReal && right.isReal
        ? Math.hypot(
            middle.screenX - (left.screenX + right.screenX) * 0.5,
            middle.screenY - (left.screenY + right.screenY) * 0.5,
          )
        : Number.NaN;
    const smooth =
      depth < config.smoothLevel &&
      Number.isFinite(midpointDistance) &&
      midpointDistance < config.delta;
    const jump =
      (depth <= config.jumpLevel &&
        (!Number.isFinite(whole) ||
          !Number.isFinite(leftHalf) ||
          !Number.isFinite(rightHalf))) ||
      (depth < config.jumpLevel &&
        (rightHalf > 0.99 * whole || leftHalf > 0.99 * whole));
    if (jump) {
      breakSegment();
      return;
    }
    if (depth <= 0 || smooth) {
      append(middle);
      return;
    }
    refine(left, middle, depth - 1);
    if (middle.isReal) append(middle);
    refine(middle, right, depth - 1);
  };

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const left = sample(anchors[index] as number);
    const right = sample(anchors[index + 1] as number);
    append(left);
    refine(left, right, config.maxDepth);
    append(right);
    if (
      !right.isReal ||
      analysis.knownPoleXs.some(
        (poleX) => Math.abs(poleX - (anchors[index + 1] as number)) <= 1e-7,
      )
    ) {
      breakSegment();
    }
  }

  const segments: SamplePoint[][] = [];
  let segment: SamplePoint[] = [];
  for (const point of points) {
    if (point == null) {
      if (segment.length > 1) segments.push(segment);
      segment = [];
    } else segment.push(point);
  }
  if (segment.length > 1) segments.push(segment);
  return segments;
}

function initializeInteractiveSampling(): void {
  graphData.a();
}

function sampleInteractiveGraph(input: SamplingInput): SamplePoint[][] {
  return sampleFunction(input);
}

export {
  graphMessages as a,
  initializeGraphMessages as i,
  sampleFunction as n,
  initializeInteractiveSampling as r,
  sampleInteractiveGraph as t,
};
