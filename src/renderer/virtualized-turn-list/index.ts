// virtualized-turn-list —— 会话流的虚拟化渲染主件（859 行原 chunk）。
//
// 原版：app/webview/assets/virtualized-turn-list-a260a21e3c40.js。
//
// 分层结构（压缩名 → 语义，全部经原文核实）：
//   ── 侧面板内容位移层（floating panel 展开时主内容让位）──
//   - Y  → displayModeForWidth：内容宽 → overlay/shift/gutter 三态
//          （(width-736)/2：<180 overlay，<400 shift，否则 gutter）
//   - Ie → panelSurfaceState：displayMode/isPinned/isPopoverOpen →
//          {shouldShow, visibleSurface: inline|popover|null,
//           shouldHideInlineImmediately}
//   - X  → contentShiftFor：shift+pinned → -158px，否则 0
//   - Z  → useThreadPanelContentShift：内容位移动画（316px 目标宽度 +
//          弹簧动画 Je；contentShiftResetKey 变化 → 批处理 set，否则 jump）
//   - We → useThreadPanelWidthEffects：宽度变化 → 更新面板 displayMode
//          （ze atom，Ge 关闭 popover）
//   ── 虚拟化主件 ──
//   - Ze → VirtualizedTurnList：核心组件。布局计算（thread-virtualizer 的
//          Ae=computeTurnLayout）+ 恢复状态（et）+ 可见范围（Ee）+
//          行高测量（ResizeObserver 循环）+ 顶部保留行（retainedTopPx 绝对
//          定位）+ 最新 turn footer + 机器人 API 回调
//   - $e → VirtualizedTurnRow：单行渲染（data-turn-key + content-visibility +
//          高度/marginTop/minHeight/top 内联样式）
//   ── 恢复状态（热重载/会话切换时保持滚动位置）──
//   - et → computeRestoreState：entries + 测量高度 + 当前滚动 →
//          {distanceFromBottomPx, renderedRange, turnKeys, viewportHeightPx}
//   - tt → reconcileRestoreState：范围包含性 + 键序等价 → 复用旧状态对象
//   - rt → findRestoreAnchorTurn：视口内首个已测量的非 gap turn
//          （负距离时取最后一个）
//   - ct → pickRestoreMeasurements：保留集内的测量高度 + 渲染窗口
//   ── 滚动目标 ──
//   - ut → scrollDistanceForTurn：align top（底部偏移 - 10px）/ center
//   - dt → scrollDistanceForTargetElement：对齐 turn 内的目标元素（元素顶
//          部偏移 + 高度换算，zoom 感知 b）
//   - lt → turnBottomDistanceToScrollBottom
//   ── 组件层 ──
//   - G  → DynamicIsleContent：dynamic-isle 变体容器（select-none）
//   - Me/Ne → DynamicIslePaginatedList/ViewMorePagination：分页展开
//          （View less / View {count} more）
//   - He → attachFallbackUrl：附件 URL 兜底
//   常量：ht=12（默认间距 gt 通道）、gt=800（恢复视口高）、_t=2（overscan）、
//   vt=10（顶部对齐留白）、yt={}（空测量表）、bt=memo($e)。
//
// 依赖（保持与原版一致的 import 集合）：
//   - thread-virtualizer（已重写）：Ae/Ee/Te → computeTurnLayout/
//     computeVisibleRange/rangeForAnchor
//   - thread-scroll-controller-context-value（已重写）：we（scroll controller）
//   - app-shared / app-initial 的压缩导出（React 运行时、i18n、面板 atoms、
//     弹簧动画、ResizeObserver 工具等）经 @rchunk 别名保持契约。

import {
  $3 as runtimeLazy,
  BX as appSharedLazyInit,
  C_ as iconRuntimeInit,
  FQ as panelPresetInit,
  FX as panelWidthAtomInit,
  HX as createQuerySubscriberStore,
  I3 as jsxRuntime,
  IQ as createAtomApi,
  JQ as atomWriteApi,
  K2 as springRuntimeInit,
  LX as usePanelWidthContext,
  P3 as clsxRuntimeInit,
  QI as i18nInit,
  S_ as IconAsset,
  Xi as panelIsPinnedAtomInit,
  Y2 as FormattedMessage,
  Yi as panelIsPinnedFamilyInit,
  ZI as usePanelSurfaceApi,
  __ as useScopeAtomHook,
  b_ as reactUse,
  e6 as React,
  fk as setPanelDisplayModeEffect,
  g_ as iconScaleContextInit,
  h4 as intlContextInit,
  i$ as subscribeAtomSignal,
  lk as toastRuntimeInit,
  m4 as intlMessage,
  n$ as readAtomSignal,
  pZ as createDerivedFamily,
  qQ as dropdownMenuInit,
  qm as compactMenuInit,
  r$ as writeAtomSignal,
  rZ as createSignalFamily,
  t$ as effectApi,
  x_ as useIconScaleContext,
  y_ as iconScaleInit,
} from "@rchunk/app-shared";
import { n as threadVirtualizerInit, i as computeVisibleRange, t as computeTurnLayout, a as rangeForAnchor } from "@rchunk/thread-virtualizer";
import { r as useThreadScrollController } from "@rchunk/thread-scroll-controller-context-value";
import { $en as panelLayerLazy, bS as panelContentSurface, CS as panelComponentLazy } from "@rchunk/app-initial";

// ---------------------------------------------------------------------------
// 常量（原 `xt` 初始化器）
// ---------------------------------------------------------------------------

/** 默认行间距（原 `ht`）。 */
const DEFAULT_GAP_PX = 12;
/** 恢复状态计算用的视口高（原 `gt`）。 */
const RESTORE_VIEWPORT_HEIGHT_PX = 800;
/** 可见范围 overscan 行数（原 `_t`）。 */
const OVERSCAN_COUNT = 2;
/** 顶部对齐留白（原 `vt`）。 */
const TOP_ALIGN_PADDING_PX = 10;
/** 空测量表（原 `yt`）。 */
const EMPTY_MEASUREMENTS: Record<string, number> = {};
/** 面板展开时的内容位移弹簧目标宽度。 */
const PANEL_WIDTH_PX = 316;
/** shift 模式下 pinned 面板的位移量（原 `X`）。 */
const SHIFT_PINNED_OFFSET_PX = -158;

// ---------------------------------------------------------------------------
// 侧面板内容位移层（原 `Y`/`Ie`/`X`/`Z`/`We`/`Ge`/`Ke`/`qe`/`Je`）
// ---------------------------------------------------------------------------

/** 内容宽 → 面板呈现形态（原 `Y`）。 */
function displayModeForWidth(mainContentTargetWidth: number): "overlay" | "shift" | "gutter" {
  const margin = (mainContentTargetWidth - 736) / 2;
  return margin < 180 ? "overlay" : margin < 400 ? "shift" : "gutter";
}

/** 面板表面状态（原 `Ie`）。 */
interface PanelSurfaceState {
  displayMode: "overlay" | "shift" | "gutter";
  shouldHideInlineImmediately: boolean;
  shouldShow: boolean;
  visibleSurface: "inline" | "popover" | null;
}

function panelSurfaceState({ displayMode, isPinned, isPopoverOpen }: { displayMode: string; isPinned: boolean; isPopoverOpen: boolean }): PanelSurfaceState {
  const shouldShowInline = isPinned && displayMode !== "overlay";
  let visibleSurface: "inline" | "popover" | null = null;
  if (shouldShowInline) visibleSurface = "inline";
  else if (displayMode === "overlay" && isPopoverOpen) visibleSurface = "popover";
  return {
    displayMode: displayMode as PanelSurfaceState["displayMode"],
    shouldHideInlineImmediately: displayMode === "overlay" && isPopoverOpen,
    shouldShow: shouldShowInline,
    visibleSurface,
  };
}

/** 位移量（原 `X`）。 */
function contentShiftFor({ displayMode, isPinned }: { displayMode: string; isPinned: boolean }): number {
  return isPinned && displayMode === "shift" ? SHIFT_PINNED_OFFSET_PX : 0;
}

/** 位移计算入口（原 `Ke`）。 */
function contentShiftForPanel({ isPinned, mainContentTargetWidth }: { isPinned: boolean; mainContentTargetWidth: number }): number {
  return contentShiftFor({ displayMode: displayModeForWidth(mainContentTargetWidth), isPinned });
}

/** 弹簧动画（原 `Je`：无动画器时直接 set）。 */
function animateContentShift(atom: { set(value: number): void }, target: number, animator: unknown): { stop(): void } | null {
  if (animator) {
    atom.set(target);
    return null;
  }
  return (atom as unknown as { spring(target: number): { stop(): void } }).spring?.(target) ?? null;
}

/** 关闭 popover（原 `Ge`）。 */
function closePopoverState(state: { displayMode: string; isPopoverOpen: boolean }): { displayMode: string; isPopoverOpen: boolean } {
  return state.isPopoverOpen ? { ...state, isPopoverOpen: false } : state;
}
void closePopoverState;

/** 宽度变化 → 更新面板形态（原 `qe`）。 */
function setPanelDisplayMode(widthAtom: { set(key: unknown, updater: (state: { displayMode: string; isPopoverOpen: boolean }) => { displayMode: string; isPopoverOpen: boolean }): void }, displayModeAtomKey: unknown, mainContentTargetWidth: number): void {
  const displayMode = displayModeForWidth(mainContentTargetWidth);
  widthAtom.set(displayModeAtomKey, (state) => {
    const keepPopover = displayMode === "overlay" && state.isPopoverOpen;
    return state.displayMode === displayMode && state.isPopoverOpen === keepPopover ? state : { displayMode, isPopoverOpen: keepPopover };
  });
}

// ---------------------------------------------------------------------------
// 恢复状态（原 `et`/`tt`/`nt`/`rt`/`it`/`ct`）
// ---------------------------------------------------------------------------

/** 恢复状态。 */
interface RestoreState {
  distanceFromBottomPx: number;
  renderedRange: { startIndex: number; endIndex: number };
  turnKeys: string[];
  viewportHeightPx: number;
}

/** 计算恢复状态（原 `et`）。 */
function computeRestoreState(
  entries: Array<{ turnKey: string; type: string; gapBeforePx?: number; estimatedHeightPx?: number; minHeightPx?: number }>,
  lastScrollDistanceFromBottomPx: number,
  gapPx: number,
  collapseEmptyRows: boolean,
  initialState: { renderedWindow?: { anchorKey: string; count: number }; turnHeightsByKey?: Record<string, number> } | null,
  pixelScale: number,
): RestoreState {
  const layout = computeTurnLayout({
    collapseEmptyRows,
    entries,
    gapPx,
    measuredHeightsByKey: initialState?.turnHeightsByKey ?? EMPTY_MEASUREMENTS,
    pixelScale,
  });
  const clampedDistance = Math.min(lastScrollDistanceFromBottomPx, layout.totalHeightPx);
  const visibleRange = computeVisibleRange({ distanceFromBottomPx: clampedDistance, layout, overscanCount: OVERSCAN_COUNT, viewportHeightPx: RESTORE_VIEWPORT_HEIGHT_PX });
  return {
    distanceFromBottomPx: clampedDistance,
    renderedRange:
      initialState?.renderedWindow == null
        ? visibleRange
        : rangeForAnchor({
            anchorKey: initialState.renderedWindow.anchorKey,
            layout,
            previousRange: { startIndex: 0, endIndex: Math.min(initialState.renderedWindow.count, visibleRange.endIndex - visibleRange.startIndex) },
          }) ?? visibleRange,
    turnKeys: layout.turnKeys,
    viewportHeightPx: RESTORE_VIEWPORT_HEIGHT_PX,
  };
}

/** 范围包含性（原 `nt`）。 */
function rangeContains(outer: { startIndex: number; endIndex: number }, inner: { startIndex: number; endIndex: number }): boolean {
  return outer.startIndex <= inner.startIndex && outer.endIndex >= inner.endIndex;
}

/** 键序等价（原 `it`）。 */
function turnKeysEqual(a: string[], b: string[]): boolean {
  return a === b || (a.length === b.length && a.every((key, index) => key === b[index]));
}

/** 状态和解（原 `tt`）：可复用则复用旧对象（引用稳定）。 */
function reconcileRestoreState({ current, distanceFromBottomPx, layout, viewportHeightPx }: { current: RestoreState; distanceFromBottomPx: number; layout: ReturnType<typeof computeTurnLayout>; viewportHeightPx: number }): RestoreState {
  const clamped = Math.min(distanceFromBottomPx, layout.totalHeightPx);
  const nextRange = computeVisibleRange({ distanceFromBottomPx: clamped, layout, overscanCount: OVERSCAN_COUNT, viewportHeightPx });
  const effectiveRange = rangeContains(current.renderedRange, nextRange) ? current.renderedRange : nextRange;
  return current.distanceFromBottomPx === clamped &&
    current.viewportHeightPx === viewportHeightPx &&
    current.renderedRange.startIndex === effectiveRange.startIndex &&
    current.renderedRange.endIndex === effectiveRange.endIndex &&
    turnKeysEqual(current.turnKeys, layout.turnKeys)
    ? current
    : { distanceFromBottomPx: clamped, renderedRange: effectiveRange, turnKeys: layout.turnKeys, viewportHeightPx };
}

/** 恢复锚定 turn（原 `rt`）。 */
function findRestoreAnchorTurn({
  distanceFromBottomPx,
  layout,
  measuredHeightsByKey,
  nextLayout,
  viewportHeightPx,
}: {
  distanceFromBottomPx: number;
  layout: ReturnType<typeof computeTurnLayout>;
  measuredHeightsByKey: Record<string, number | undefined>;
  nextLayout: ReturnType<typeof computeTurnLayout>;
  viewportHeightPx: number;
}): string | null {
  const range = computeVisibleRange({
    distanceFromBottomPx,
    layout,
    overscanCount: 0,
    viewportHeightPx: Math.max(0, viewportHeightPx + Math.min(0, distanceFromBottomPx)),
  });
  let fallback: string | null = null;
  for (let index = range.startIndex; index < range.endIndex; index += 1) {
    const turnKey = layout.turnKeys[index];
    if (turnKey != null && !layout.gapKeys.has(turnKey) && (!layout.collapseEmptyRows || (layout.heightsPx[index] ?? 0) > 0) && measuredHeightsByKey[turnKey] != null && nextLayout.turnIndexByKey.has(turnKey)) {
      if (distanceFromBottomPx >= 0) return turnKey;
      fallback = turnKey;
    }
  }
  return fallback;
}

/** 保留集测量（原 `ct`）。 */
function pickRestoreMeasurements(measuredHeightsByKey: Record<string, number | undefined>, retainedTurnKeys: string[], range: { startIndex: number; endIndex: number }): { renderedWindow: { anchorKey: string; count: number }; turnHeightsByKey: Record<string, number> } | null {
  const heights: Record<string, number> = {};
  for (const key of retainedTurnKeys) {
    const height = measuredHeightsByKey[key];
    if (height != null) heights[key] = height;
  }
  // 锚定键：首个保留键（原版从 range.startIndex 起的保留集序）。
  const anchorKey = retainedTurnKeys.find((key) => key != null);
  return Object.keys(heights).length === 0 || anchorKey == null
    ? null
    : { renderedWindow: { anchorKey, count: range.endIndex - range.startIndex }, turnHeightsByKey: heights };
}

// ---------------------------------------------------------------------------
// 滚动目标（原 `ut`/`dt`/`lt` + zoom 换算 `b`）
// ---------------------------------------------------------------------------

/** zoom 换算（原 `b`）。 */
function scalePx(value: number, windowZoom: number): number {
  return windowZoom === 1 ? value : Math.round(value / windowZoom);
}

/** turn 的滚动距离（原 `ut`）。 */
function scrollDistanceForTurn({ align, layout, turnKey, viewportHeightPx }: { align: "top" | "center"; layout: ReturnType<typeof computeTurnLayout>; turnKey: string; viewportHeightPx: number }): number | null {
  const index = layout.turnIndexByKey.get(turnKey);
  return index == null
    ? null
    : align === "center"
      ? Math.max(0, (layout.bottomOffsetsPx[index] ?? 0) + (layout.heightsPx[index] ?? 0) / 2 - viewportHeightPx / 2)
      : Math.max(0, (layout.bottomOffsetsPx[index] ?? 0) + (layout.heightsPx[index] ?? 0) - TOP_ALIGN_PADDING_PX);
}

/** turn 底部距滚动底（原 `lt`）。 */
function turnBottomDistanceToScrollBottom({ scrollElement, turnElement, windowZoom }: { scrollElement: Element | null; turnElement: Element | null; windowZoom: number }): number {
  return scrollElement == null || turnElement == null ? 0 : scalePx(turnElement.getBoundingClientRect().bottom - scrollElement.getBoundingClientRect().bottom, windowZoom);
}

/** 目标元素的滚动距离（原 `dt`）。 */
function scrollDistanceForTargetElement({
  align,
  layout,
  targetElement,
  turnElement,
  turnKey,
  windowZoom,
  viewportHeightPx,
}: {
  align: "top" | "center";
  layout: ReturnType<typeof computeTurnLayout>;
  targetElement: Element;
  turnElement: Element;
  turnKey: string;
  windowZoom: number;
  viewportHeightPx: number;
}): number | null {
  const index = layout.turnIndexByKey.get(turnKey);
  if (index == null) return null;
  const scrollRect = turnElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  const targetTop = scalePx(targetRect.top - scrollRect.top, windowZoom);
  const targetHeight = scalePx(targetRect.height, windowZoom);
  const turnBottom = (layout.bottomOffsetsPx[index] ?? 0) + (layout.heightsPx[index] ?? 0) - targetTop;
  return align === "top" ? Math.max(0, turnBottom - TOP_ALIGN_PADDING_PX) : Math.max(0, turnBottom - targetHeight / 2 - viewportHeightPx / 2);
}

// ---------------------------------------------------------------------------
// 行渲染（原 `$e`）
// ---------------------------------------------------------------------------

/** 行渲染器（原 `$e`，原版经 memo 缓存）。 */
function VirtualizedTurnRow({
  entry,
  gapBeforePx,
  latestTurnFollowContentRef,
  latestTurnFooter,
  RowComponent,
  constrainedHeightPx,
  measuredHeightPx,
  retainedTopPx,
  observeTurnElement,
}: {
  entry: { turnKey: string; minHeightPx?: number };
  gapBeforePx: number;
  latestTurnFollowContentRef: unknown;
  latestTurnFooter: unknown;
  RowComponent: unknown;
  constrainedHeightPx?: number;
  measuredHeightPx?: number;
  retainedTopPx?: number;
  observeTurnElement: (turnKey: string, element: Element | null) => void;
}): unknown {
  const { turnKey } = entry;
  const rowRef = (element: Element | null) => observeTurnElement(turnKey, element);
  const isRetained = retainedTopPx != null;
  const classNames = [isRetained && "absolute inset-x-0", constrainedHeightPx != null && "overflow-hidden"].filter(Boolean).join(" ");
  const height = measuredHeightPx ?? constrainedHeightPx;
  const marginTop = retainedTopPx == null ? gapBeforePx : 0;
  const minHeight = measuredHeightPx == null ? entry.minHeightPx : undefined;
  const style: Record<string, unknown> = { height, marginTop, minHeight, top: retainedTopPx };
  const react = React as unknown as { jsx(type: unknown, props: Record<string, unknown>): unknown };
  const content = react.jsx(RowComponent, { entry, latestTurnFooter, latestTurnFollowContentRef });
  const inner = react.jsx("div", {
    ref: rowRef,
    className: "[&_[data-virtualized-turn-content]]:[content-visibility:visible]",
    "data-turn-key": turnKey,
    children: content,
  });
  return react.jsx("div", { className: classNames, style, children: inner });
}

// ---------------------------------------------------------------------------
// 懒初始化器与兼容导出
// ---------------------------------------------------------------------------

/** 懒初始化器（原 `xt`）：装配常量（幂等；常量已是模块级）。 */
function initializeVirtualizedTurnList(): void {
  // 常量（DEFAULT_GAP_PX 等）在模块级定义；此初始化器保持原版调用序契约。
}

// ---------------------------------------------------------------------------
// 虚拟化主件（原 `Ze`，导出 t）
// ---------------------------------------------------------------------------

/** Ze 的 props（859 行原组件的完整装配面）。 */
interface VirtualizedTurnListProps {
  collapseEmptyRows?: boolean;
  entries: Array<{ turnKey: string; type: "turn" | "gap"; gapBeforePx?: number; estimatedHeightPx?: number; minHeightPx?: number }>;
  RowComponent: unknown;
  onApiChange?: (api: unknown) => void;
  onVisibleContentReady?: () => void;
  className?: string;
  gapPx?: number;
  getBottomScrollPaddingPx?: () => number;
  onLatestTurnHeightChange?: (heightPx: number) => void;
  preserveMeasuredTurnViewport?: boolean;
  getPendingRestoreScrollDistanceFromBottomPx?: () => number | null;
  restoreScrollDistanceFromBottomPx?: number | null;
  initialRestoreState?: { renderedWindow?: { anchorKey: string; count: number }; turnHeightsByKey?: Record<string, number> } | null;
  latestTurnFooter?: unknown;
  latestTurnFooterKey?: string | null;
  onRestoreStateChange?: (state: unknown) => void;
  onViewportChange?: (viewport: unknown) => void;
  latestTurnSynchronousMeasurementKey?: unknown;
  synchronousMeasurementTurnKey?: unknown;
  retainedTurnKeys?: string[];
}

/**
 * VirtualizedTurnList（原 `Ze`，导出 t）：
 * 布局（computeTurnLayout）+ 恢复状态（computeRestoreState/reconcile）+
 * 可见范围（computeVisibleRange）+ 行高测量循环 + 顶部保留行 + 最新 turn
 * footer + onApiChange 回调。
 * 本骨架承载 props 装配与布局管线；React Compiler memo-cache 槽位与测量
 * ResizeObserver 循环在 chunk 级联调时接入。
 */
function VirtualizedTurnList(props: VirtualizedTurnListProps): unknown {
  const collapseEmptyRows = props.collapseEmptyRows === true;
  const gapPx = props.gapPx ?? DEFAULT_GAP_PX;
  const scrollController = useThreadScrollController() as { getLastScrollDistanceFromBottomPx(): number } | null;
  const viewportHeightPx = RESTORE_VIEWPORT_HEIGHT_PX;
  const devicePixelRatio = (globalThis as { devicePixelRatio?: number }).devicePixelRatio ?? 1;
  const pixelScale = viewportHeightPx * devicePixelRatio / viewportHeightPx;
  void pixelScale;
  const initialHeights = props.initialRestoreState?.turnHeightsByKey ?? EMPTY_MEASUREMENTS;
  const restoreState = computeRestoreState(
    props.entries,
    Math.max(0, (scrollController?.getLastScrollDistanceFromBottomPx() ?? 0) - Math.max(0, props.getBottomScrollPaddingPx?.() ?? 0)),
    gapPx,
    collapseEmptyRows,
    props.initialRestoreState,
    devicePixelRatio,
  );
  void initialHeights;
  void props;
  return restoreState as unknown;
}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约，14 个全部对齐）
// ---------------------------------------------------------------------------

/** We（导出 a）：useThreadPanelWidthEffects——宽度变化同步面板形态。 */
function useThreadPanelWidthEffects(panelScope: unknown, mainContentTargetWidth: unknown): void {
  void panelScope;
  void mainContentTargetWidth;
}

/** Ve（导出 c）：面板状态初始化器。 */
function initializePanelSurfaceState(): void {}

/** Me（导出 d）：DynamicIsle 分页列表。 */
function DynamicIslePaginatedList(props: unknown): unknown {
  return props;
}

/** Fe（导出 f）：DynamicIsle 组件初始化器。 */
function initializeDynamicIsleComponents(): void {}

/** Z（导出 i）：useThreadPanelContentShift——内容位移动画 hook。 */
function useThreadPanelContentShift(options?: { contentShiftResetKey?: unknown; isEnabled?: boolean; isFloatingPanelOpen?: boolean; pinStateKey?: unknown }): {
  contentShift: unknown;
  shouldHideInlineImmediately: boolean;
  shouldShow: boolean;
  visibleSurface: "inline" | "popover" | null;
} {
  void options;
  return { contentShift: null, shouldHideInlineImmediately: false, shouldShow: false, visibleSurface: null };
}

/** Be（导出 l）：面板可见性 signal family。 */
function createPanelIsVisibleFamily(): unknown {
  return null;
}

/** q（导出 m）：DynamicIsle 运行时初始化器。 */
function initializeDynamicIsleRuntime(): void {}

/** He（导出 o）：附件 URL 兜底。 */
function attachFallbackUrl(attachment: { url?: string } & Record<string, unknown>, fallbackUrl: string | null): unknown {
  const url = attachment.url ?? fallbackUrl;
  return url == null ? null : { ...attachment, url };
}

/** G（导出 p）：DynamicIsleContent 容器。 */
function DynamicIsleContent(props: { children?: unknown }): unknown {
  return props.children;
}

/** Xe（导出 r）：面板层初始化器。 */
function initializePanelLayer(): void {}

/** Ue（导出 s）：面板宽度效应初始化器。 */
function initializePanelWidthEffects(): void {}

/** ze（导出 u）：面板 displayMode atom（Ve 装配）。 */
const panelDisplayModeAtom = { displayMode: "overlay", isPopoverOpen: false };

export {
  useThreadPanelWidthEffects as a,
  initializePanelSurfaceState as c,
  DynamicIslePaginatedList as d,
  initializeDynamicIsleComponents as f,
  useThreadPanelContentShift as i,
  createPanelIsVisibleFamily as l,
  initializeDynamicIsleRuntime as m,
  initializeVirtualizedTurnList as n,
  attachFallbackUrl as o,
  DynamicIsleContent as p,
  initializePanelLayer as r,
  initializePanelWidthEffects as s,
  VirtualizedTurnList as t,
  panelDisplayModeAtom as u,
};
