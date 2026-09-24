// 窗口放置吸附（原版 22016-22121 区段）。
//
// 把热键窗口/头像浮层等吸附到屏幕九宫格位置：位置可用 [0,1] 归一化分数或
// 命名档位（cE/lE 枚举）表示；fE 依据当前窗口和默认区域计算吸附锚点，
// vE 做单轴吸附判定（捕获距离 12px、释放距离 20px、滞后 4px 防抖），
// _E 把放置档位换算回像素坐标（lodash clamp 限幅，见 vendor 的 sE）。

import {
  Cf as number, // z.number()（声明类型过窄，断言见下）
  wf as object, // z.object(shape)
  df as enumSchema, // z.enum(values)
  jf as union, // z.union(options)
} from "@chunk/shared";
import { sE as lodashClampInterop } from "../vendor";

// vendored lodash clamp 的 interop 包装：`sE.default` 为 clamp 函数本体。
const clamp = (lodashClampInterop as any).default as (value: number, min: number, max: number) => number;

const zNumber = number as unknown as () => any;

/** 水平放置档位（枚举顺序即吸附索引）。 */
export const HORIZONTAL_POSITIONS = [
  `one-third`,
  `two-thirds`,
  `center`,
  `one-third-end`,
  `two-thirds-end`,
  `first-segment-center`,
  `third-segment-center`,
  `first-guide-center`,
  `second-guide-center`,
] as const;
/** 垂直放置档位（枚举顺序即吸附索引）。 */
export const VERTICAL_POSITIONS = [
  `one-third`,
  `two-thirds`,
  `bottom`,
  `one-third-end`,
  `two-thirds-end`,
  `first-segment-center`,
  `center`,
  `third-segment-center`,
  `first-guide-center`,
  `second-guide-center`,
] as const;

export type HorizontalPosition = (typeof HORIZONTAL_POSITIONS)[number];
export type VerticalPosition = (typeof VERTICAL_POSITIONS)[number];
/** 放置坐标：[0,1] 归一化分数或命名档位。 */
export type PlacementX = number | HorizontalPosition;
export type PlacementY = number | VerticalPosition;
export interface WindowPlacement {
  x: PlacementX;
  y: PlacementY;
}
/** 屏幕矩形（display / window 通用）。 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
/** 单轴吸附锚点集合与吸附参数。 */
export interface SnapAnchors {
  x: number[];
  y: number[];
  captureDistance: number;
  releaseDistance: number;
}

/** 归一化分数 schema（0..1）。 */
export const placementFractionSchema = zNumber().min(0).max(1);
/** 窗口放置 schema（x/y 各为分数或命名档位）。 */
export const windowPlacementSchema = object({
  x: union([placementFractionSchema, enumSchema(HORIZONTAL_POSITIONS)]),
  y: union([placementFractionSchema, enumSchema(VERTICAL_POSITIONS)]),
});

/** 默认吸附区域：水平居中、上起 1/4 处、高 half 屏（窗口宽度）。 */
export function defaultSnapRegion(display: Rect, window: Rect): Rect {
  return {
    x: display.x + (display.width - window.width) / 2,
    y: display.y + display.height / 4,
    width: window.width,
    height: display.height / 2,
  };
}

/** 依据显示器与窗口尺寸计算全部吸附锚点（x/y 各 9 档）及吸附参数。 */
export function computeSnapAnchors(display: Rect, window: Rect): SnapAnchors {
  const region = defaultSnapRegion(display, window);
  return {
    x: [
      region.x,
      region.x + region.width,
      display.x + display.width / 2 - window.width / 2,
      region.x - window.width,
      region.x + region.width - window.width,
      Math.max(display.x, (display.x + region.x - window.width) / 2),
      Math.min(display.x + display.width - window.width, (region.x + region.width + display.x + display.width - window.width) / 2),
      region.x - window.width / 2,
      region.x + region.width - window.width / 2,
    ],
    y: [
      display.y + display.height / 4,
      display.y + (display.height * 3) / 4,
      display.y + display.height - 16 - window.height,
      display.y + display.height / 4 - window.height,
      display.y + (display.height * 3) / 4 - window.height,
      Math.max(display.y, display.y + display.height / 8 - window.height / 2),
      Math.min(display.y + display.height - window.height, display.y + (display.height * 7) / 8 - window.height / 2),
      region.y - window.height / 2,
      region.y + region.height - window.height / 2,
    ],
    captureDistance: 12,
    releaseDistance: 20,
  };
}

/**
 * 单轴吸附判定：返回吸附后的档位索引（-1 表示未吸附）。
 *
 * 在捕获距离内取最近的锚点；已吸附（previousIndex >= 0 且未超出释放距离）
 * 时保持原档位，但有 4px 滞后保护（更近的新锚点需比旧锚点近 4px 以上才会
 * 抢占），避免在锚点附近抖动。
 */
function snapAxis(value: number, anchors: number[], previousIndex: number, opts: SnapAnchors): number {
  let bestIndex = -1;
  let bestDistance = opts.captureDistance;
  for (const [index, anchor] of anchors.entries()) {
    const distance = Math.abs(value - anchor);
    if (distance <= bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  }
  const previousDistance = Math.abs(value - anchors[previousIndex]);
  const shouldSteal = bestIndex !== previousIndex && bestDistance <= 4 && previousDistance > bestDistance + 4;
  return previousIndex >= 0 && previousDistance <= opts.releaseDistance && !shouldSteal ? previousIndex : bestIndex;
}

/** 依据当前位置和锚点计算吸附后的档位索引（x 轴上 0/4 档归一到 2=center）。 */
export function snapWindowPosition(
  position: { x: number; y: number },
  anchors: SnapAnchors,
  previous: { x: number; y: number },
): { x: number; y: number } {
  const x = snapAxis(position.x, anchors.x, previous.x, anchors);
  return { x: x === 0 || x === 4 ? 2 : x, y: snapAxis(position.y, anchors.y, previous.y, anchors) };
}

/** 窗口在显示器内自由移动可达的坐标范围（宽高差 clamp 到 0）。 */
export function movementBounds(display: Rect, window: Rect): Rect {
  return {
    x: display.x,
    y: display.y,
    width: Math.max(0, display.width - window.width),
    height: Math.max(0, display.height - window.height),
  };
}

/** 相对分数：size 为 0 时取 0.5，否则 clamp 到 [0,1]。 */
function normalizedFraction(value: number, start: number, size: number): number {
  return size === 0 ? 0.5 : Math.max(0, Math.min(1, (value - start) / size));
}

/** 把吸附索引换算回放置档位（越界索引退化为归一化分数）。 */
export function positionFromIndices(
  position: { x: number; y: number },
  display: Rect,
  window: Rect,
): WindowPlacement {
  return {
    x: HORIZONTAL_POSITIONS[position.x] ?? normalizedFraction(position.x, display.x, display.width),
    y: VERTICAL_POSITIONS[position.y] ?? normalizedFraction(position.y, display.y, display.height),
  };
}

/** 把放置档位（分数或命名档位）换算回像素坐标（clamp 在显示器范围内）。 */
export function placementToPosition(placement: WindowPlacement, display: Rect, anchors: SnapAnchors): { x: number; y: number } {
  return {
    x: clamp(
      typeof placement.x == `number` ? display.x + placement.x * display.width : anchors.x[HORIZONTAL_POSITIONS.indexOf(placement.x)],
      display.x,
      display.x + display.width,
    ),
    y: clamp(
      typeof placement.y == `number` ? display.y + placement.y * display.height : anchors.y[VERTICAL_POSITIONS.indexOf(placement.y)],
      display.y,
      display.y + display.height,
    ),
  };
}
