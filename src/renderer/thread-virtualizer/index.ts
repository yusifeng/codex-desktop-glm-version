// thread-virtualizer —— 会话流的虚拟化布局引擎。
//
// 原版：app/webview/assets/thread-virtualizer-e1964ca5c039.js（2.9KB，仅依赖
// rolldown runtime 的懒初始化辅助，完全自包含）。
//
// 六个导出（压缩名 → 语义）：
//   - t → computeTurnLayout：条目（turn/gap）→ 偏移/高度/总高的布局表
//   - n → computeVisibleRange：视口 + overscan → 起止索引（两段二分）
//   - r → rangeForAnchor：锚定 turn 的窗口保持
//   - i → distanceForAnchor：布局变化后按锚定 turn 保持视觉位置的滚动距离
//   - a → centerScrollDistanceForTurn：居中某 turn 的滚动距离
//   - l/o → 懒初始化器 + 默认估算高度 280px
//
// 布局条目的 gapBeforePx/estimatedHeightPx/minHeightPx 由测量层提供；
// pixelScale 用于缩放取整（zoom 场景）。

/** 布局条目（turn 或 gap 行）。 */
export interface TurnLayoutEntry {
  /** turn 键（gap 行也有键，参与 gapKeys）。 */
  turnKey: string;
  type: "turn" | "gap";
  /** 该行前的间距（px，可选）。 */
  gapBeforePx?: number;
  /** 估算高度（px，未测量时用）。 */
  estimatedHeightPx?: number;
  /** 最小高度（px）。 */
  minHeightPx?: number;
}

/** 布局表（computeTurnLayout 产物）。 */
export interface TurnLayout {
  /** 每 turn 的底部偏移（相对总底）。 */
  bottomOffsetsPx: number[];
  collapseEmptyRows: boolean;
  /** gap 行的键集合。 */
  gapKeys: Set<string>;
  /** 每行前的实际间距。 */
  gapsBeforePx: number[];
  /** 每行高度。 */
  heightsPx: number[];
  /** 顶部偏移（累积）。 */
  topOffsetsPx: number[];
  totalHeightPx: number;
  /** 键 → 索引。 */
  turnIndexByKey: Map<string, number>;
  turnKeys: string[];
}

/** 默认估算高度（原 `c` = 280px）。 */
const DEFAULT_ESTIMATED_TURN_HEIGHT_PX = 280;

/** 懒初始化器（原 `l`/导出 `o`）：幂等，供消费者触发默认常量装配。 */
let initialized = false;
function initializeThreadVirtualizer(): void {
  if (initialized) return;
  initialized = true;
}

/**
 * 布局计算（原 `t`）：
 * 高度 = max(minHeight, measured ?? estimated)；pixelScale 时对高度与间距做
* 取整缩放；首行（或 collapseEmptyRows 下首行非空后）间距为 0；gap 行键进
 * gapKeys。
 */
function computeTurnLayout({
  collapseEmptyRows = false,
  entries,
  gapPx,
  measuredHeightsByKey,
  pixelScale,
}: {
  collapseEmptyRows?: boolean;
  entries: TurnLayoutEntry[];
  gapPx?: number;
  measuredHeightsByKey: Record<string, number | undefined>;
  pixelScale?: number;
}): TurnLayout {
  const gapKeys = new Set<string>();
  const gapsBeforePx: number[] = [];
  const heightsPx: number[] = [];
  const topOffsetsPx: number[] = [];
  const turnIndexByKey = new Map<string, number>();
  const turnKeys: string[] = [];
  let totalHeightPx = 0;
  for (const [index, entry] of entries.entries()) {
    const { turnKey } = entry;
    let height = Math.max(entry.minHeightPx ?? 0, measuredHeightsByKey[turnKey] ?? entry.estimatedHeightPx ?? DEFAULT_ESTIMATED_TURN_HEIGHT_PX);
    if (pixelScale != null) height = Math.round(height * pixelScale) / pixelScale;
    // 原文：collapseEmptyRows ? (累积高度 > 0 && 当前行高 > 0) : index > 0
    const isFirst = collapseEmptyRows ? totalHeightPx > 0 && height > 0 : index > 0;
    let gapBeforePx = isFirst ? entry.gapBeforePx ?? gapPx ?? 0 : 0;
    if (pixelScale != null) gapBeforePx = Math.round(gapBeforePx * pixelScale) / pixelScale;
    totalHeightPx += gapBeforePx;
    gapsBeforePx.push(gapBeforePx);
    if (entry.type === "gap") gapKeys.add(turnKey);
    turnIndexByKey.set(turnKey, index);
    turnKeys.push(turnKey);
    topOffsetsPx.push(totalHeightPx);
    heightsPx.push(height);
    totalHeightPx += height;
  }
  return {
    bottomOffsetsPx: topOffsetsPx.map((topOffset, index) => totalHeightPx - topOffset - (heightsPx[index] ?? 0)),
    collapseEmptyRows,
    gapKeys,
    gapsBeforePx,
    heightsPx,
    topOffsetsPx,
    totalHeightPx,
    turnIndexByKey,
    turnKeys,
  };
}

/** 上界二分（原 `o`）：首个 bottomOffset < target 的索引。 */
function findUpperBound(offsets: number[], target: number): number {
  let low = 0;
  let high = offsets.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if ((offsets[mid] ?? 0) < target) high = mid;
    else low = mid + 1;
  }
  return low;
}

/** 起始二分（原 `s`）：首个 bottom+height <= target 的索引。 */
function findStartIndex(offsets: number[], heights: number[], target: number): number {
  let low = 0;
  let high = offsets.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if ((offsets[mid] ?? 0) + (heights[mid] ?? 0) <= target) high = mid;
    else low = mid + 1;
  }
  return low;
}

/**
 * 可见范围（原 `n`）：
 * 距底距离 + 视口高 + overscan → [startIndex, endIndex)。
 * collapseEmptyRows 时顶端/底端特判（0 距离 → 全量，贴底 → 0 起始）。
 */
function computeVisibleRange({
  distanceFromBottomPx,
  layout,
  overscanCount,
  viewportHeightPx,
}: {
  distanceFromBottomPx: number;
  layout: TurnLayout;
  overscanCount: number;
  viewportHeightPx: number;
}): { startIndex: number; endIndex: number } {
  if (layout.turnKeys.length === 0) return { startIndex: 0, endIndex: 0 };
  const viewportTop = Math.min(Math.max(0, distanceFromBottomPx), layout.totalHeightPx);
  const viewportBottom = Math.min(viewportTop + Math.max(0, viewportHeightPx), layout.totalHeightPx);
  const endIndexRaw =
    layout.collapseEmptyRows && viewportBottom === layout.totalHeightPx ? 0 : findUpperBound(layout.bottomOffsetsPx, viewportBottom);
  const startIndexRaw =
    layout.collapseEmptyRows && viewportTop === 0 ? layout.turnKeys.length : findStartIndex(layout.bottomOffsetsPx, layout.heightsPx, viewportTop);
  return {
    startIndex: Math.max(0, endIndexRaw - overscanCount),
    endIndex: Math.min(layout.turnKeys.length, Math.max(startIndexRaw, endIndexRaw + 1) + overscanCount),
  };
}

/**
 * 锚定窗口（原 `r`）：布局变化后保持锚定 turn 的可见窗口尺寸。
 */
function rangeForAnchor({
  anchorKey,
  layout,
  previousRange,
}: {
  anchorKey: string;
  layout: TurnLayout;
  previousRange: { startIndex: number; endIndex: number };
}): { startIndex: number; endIndex: number } | null {
  const anchorIndex = layout.turnIndexByKey.get(anchorKey);
  return anchorIndex == null
    ? null
    : { startIndex: anchorIndex, endIndex: Math.min(layout.turnKeys.length, anchorIndex + previousRange.endIndex - previousRange.startIndex) };
}

/**
 * 锚定滚动距离（原 `i`）：新布局下保持锚定 turn 视觉位置所需的距底距离。
 */
function distanceForAnchor({
  anchorKey,
  distanceFromBottomPx,
  nextLayout,
  previousLayout,
}: {
  anchorKey: string;
  distanceFromBottomPx: number;
  nextLayout: TurnLayout;
  previousLayout: TurnLayout;
}): number | null {
  const previousIndex = previousLayout.turnIndexByKey.get(anchorKey);
  const nextIndex = nextLayout.turnIndexByKey.get(anchorKey);
  if (previousIndex == null || nextIndex == null) return null;
  const previousBottom = (previousLayout.bottomOffsetsPx[previousIndex] ?? 0) + (previousLayout.heightsPx[previousIndex] ?? 0);
  const nextBottom = (nextLayout.bottomOffsetsPx[nextIndex] ?? 0) + (nextLayout.heightsPx[nextIndex] ?? 0);
  return Math.max(0, distanceFromBottomPx + nextBottom - previousBottom);
}

/**
 * 居中滚动距离（原 `a`）：把某 turn 居中到视口所需的距底距离。
 */
function centerScrollDistanceForTurn({
  layout,
  turnKey,
  viewportHeightPx,
}: {
  layout: TurnLayout;
  turnKey: string;
  viewportHeightPx: number;
}): number | null {
  const index = layout.turnIndexByKey.get(turnKey);
  return index == null
    ? null
    : Math.max(0, (layout.bottomOffsetsPx[index] ?? 0) - viewportHeightPx / 2 + (layout.heightsPx[index] ?? 0) / 2);
}

// 原版压缩导出名（chunk 间契约，保持兼容）：
// t=computeTurnLayout i=computeVisibleRange n=distanceForAnchor
// a=rangeForAnchor r=centerScrollDistanceForTurn o=懒初始化器
export { computeTurnLayout as t, computeVisibleRange as i, distanceForAnchor as n, rangeForAnchor as a, centerScrollDistanceForTurn as r, initializeThreadVirtualizer as o };
